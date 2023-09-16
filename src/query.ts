import * as pg from 'pg';
import Cursor from 'pg-cursor';

import * as Chunk from '@effect/data/Chunk';
import { flow, pipe } from '@effect/data/Function';
import * as Option from '@effect/data/Option';
import * as Effect from '@effect/io/Effect';
import * as Exit from '@effect/io/Exit';
import * as Match from '@effect/match';
import * as Schema from '@effect/schema/Schema';
import * as Stream from '@effect/stream/Stream';
import {
  PostgresDuplicateTableError,
  PostgresInvalidParametersError,
  PostgresQueryError,
  PostgresTableDoesntExistError,
  PostgresUnexpectedNumberOfRowsError,
  PostgresUnknownError,
  PostgresValidationError,
} from 'effect-pg/errors';
import { ClientBase } from 'effect-pg/services';

const convertError = pipe(
  Match.type<unknown>(),
  Match.when(
    { code: '42P01' },
    (error) => new PostgresTableDoesntExistError({ error })
  ),
  Match.when(
    { code: '42P07' },
    (error) => new PostgresDuplicateTableError({ error })
  ),
  Match.when(
    { code: '08P01' },
    (error) => new PostgresInvalidParametersError({ error })
  ),
  Match.orElse((error) => new PostgresUnknownError({ error }))
);

export const query: {
  <_, A = unknown>(
    sql: string,
    schema: Schema.Schema<_, A>
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    PostgresQueryError | PostgresValidationError,
    A[]
  >;

  (
    sql: string
  ): (
    ...values: unknown[]
  ) => Effect.Effect<pg.ClientBase, PostgresQueryError, unknown[]>;
} = (sql: string, schema?: Schema.Schema<unknown, unknown>) => {
  const parse = schema ? Schema.parse(schema) : undefined;

  return (...values: unknown[]): Effect.Effect<pg.ClientBase, any, any> =>
    pipe(
      Effect.flatMap(ClientBase, (client) =>
        Effect.tryPromise(() => client.query(sql, values))
      ),
      Effect.mapError(convertError),
      Effect.flatMap((result) => {
        if (parse === undefined) {
          return Effect.succeed(result.rows);
        }

        return pipe(
          result.rows,
          Effect.forEach((row) => parse(row)),
          Effect.mapError((error) => new PostgresValidationError({ error }))
        );
      })
    );
};

export const queryOne: {
  (
    sql: string
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    PostgresQueryError | PostgresUnexpectedNumberOfRowsError,
    unknown
  >;

  <_, A = unknown>(
    sql: string,
    schema?: Schema.Schema<_, A>
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    | PostgresQueryError
    | PostgresValidationError
    | PostgresUnexpectedNumberOfRowsError,
    A
  >;
} = (sql: string, schema?: Schema.Schema<unknown, unknown>) => {
  const runQuery = schema ? query(sql, schema) : query(sql);

  return (...values: unknown[]): Effect.Effect<pg.ClientBase, any, any> =>
    runQuery(...values).pipe(
      Effect.filterOrFail(
        (rows) => rows.length === 1,
        (rows) =>
          new PostgresUnexpectedNumberOfRowsError({
            expectedRows: 1,
            receivedRows: rows.length,
          })
      ),
      Effect.map((rows) => rows[0] as unknown)
    );
};

export interface QueryStreamOptions {
  maxRowsPerRead: number;
}

const defaultQueryStreamOptions: QueryStreamOptions = {
  maxRowsPerRead: 10,
};

export const queryStream: {
  <_, A>(
    queryText: string,
    schema: Schema.Schema<_, A>,
    options?: Partial<QueryStreamOptions>
  ): (
    ...values: unknown[]
  ) => Stream.Stream<
    pg.ClientBase,
    PostgresQueryError | PostgresValidationError,
    A
  >;

  (
    queryText: string,
    options?: Partial<QueryStreamOptions>
  ): (
    ...values: unknown[]
  ) => Stream.Stream<pg.ClientBase, PostgresQueryError, unknown>;
} = (
  sql: string,
  ...args:
    | [
        schema: Schema.Schema<unknown, unknown>,
        options?: Partial<QueryStreamOptions>,
      ]
    | [options?: Partial<QueryStreamOptions>]
) => {
  const { parse, options } = Schema.isSchema(args[0])
    ? {
        parse: Schema.parse(args[0]),
        options: { ...defaultQueryStreamOptions, ...args[1] },
      }
    : {
        parse: undefined,
        options: { ...defaultQueryStreamOptions, ...args[0] },
      };

  return (...values: unknown[]) =>
    pipe(
      Effect.flatMap(ClientBase, (client) =>
        Effect.acquireRelease(
          Effect.succeed(client.query(new Cursor(sql, values))),
          (cursor) => Effect.tryPromise(() => cursor.close()).pipe(Effect.orDie)
        )
      ),
      Effect.map((cursor) =>
        pipe(
          Effect.tryPromise({
            try: () => cursor.read(options.maxRowsPerRead),
            catch: flow(convertError, Option.some),
          }),
          Effect.flatMap((rows) => {
            if (parse === undefined) {
              return Effect.succeed(rows);
            }

            return pipe(
              rows,
              Effect.forEach((row) => parse(row)),
              Effect.mapError((error) =>
                Option.some(
                  new PostgresValidationError({
                    error,
                  }) as unknown as PostgresUnknownError
                )
              )
            );
          }),
          Effect.map(Chunk.fromIterable),
          Effect.filterOrFail(Chunk.isNonEmpty, () => Option.none())
        )
      ),
      Stream.fromPull
    );
};

export const begin = query('BEGIN');
export const commit = query('COMMIT');
export const rollback = query('ROLLBACK');

export const transaction = <R, E, A>(
  self: Effect.Effect<R, E, A>
): Effect.Effect<R | pg.ClientBase, E | PostgresQueryError, A> =>
  Effect.acquireUseRelease(
    begin(),
    () => self,
    (_, exit) =>
      pipe(
        exit,
        Exit.match({
          onSuccess: () => commit(),
          onFailure: () => rollback(),
        }),
        Effect.orDie
      )
  );

export const transactionRollback = <R, E, A>(
  self: Effect.Effect<R, E, A>
): Effect.Effect<R | pg.ClientBase, E | PostgresQueryError, A> =>
  Effect.acquireUseRelease(
    begin(),
    () => self,
    () => Effect.orDie(rollback())
  );
