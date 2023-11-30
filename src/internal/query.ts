import * as pg from 'pg';
import Cursor from 'pg-cursor';

import * as Schema from '@effect/schema/Schema';
import type * as Pg from 'effect-pg/Pg';
import * as PgError from 'effect-pg/PgError';
import * as internal_context from 'effect-pg/internal/context';
import * as Cause from 'effect/Cause';
import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { flow, pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Predicate from 'effect/Predicate';
import * as Stream from 'effect/Stream';

const isObjectWithCode = (code: string, object: unknown) =>
  Predicate.isRecord(object) && 'code' in object && object['code'] === code;

const convertError = (exception: Cause.UnknownException) => {
  const error = exception.error;

  if (isObjectWithCode('42P01', error)) {
    return new PgError.PostgresTableDoesntExistError({ error });
  } else if (isObjectWithCode('42P07', error)) {
    return new PgError.PostgresDuplicateTableError({ error });
  } else if (isObjectWithCode('08P01', error)) {
    return new PgError.PostgresInvalidParametersError({ error });
  }

  return new PgError.PostgresUnknownError({ error });
};

export const query: {
  <_, A = unknown>(
    sql: string,
    schema: Schema.Schema<_, A>
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    PgError.PostgresQueryError | PgError.PostgresValidationError,
    A[]
  >;

  (
    sql: string
  ): (
    ...values: unknown[]
  ) => Effect.Effect<pg.ClientBase, PgError.PostgresQueryError, unknown[]>;
} = (sql: string, schema?: Schema.Schema<unknown, unknown>) => {
  const parse = schema ? Schema.parse(schema) : undefined;

  return (...values: unknown[]): Effect.Effect<pg.ClientBase, any, any> =>
    pipe(
      Effect.flatMap(internal_context.ClientBase, (client) =>
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
          Effect.mapError(
            (error) => new PgError.PostgresValidationError({ error })
          )
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
    PgError.PostgresQueryError | PgError.PostgresUnexpectedNumberOfRowsError,
    unknown
  >;

  <_, A = unknown>(
    sql: string,
    schema?: Schema.Schema<_, A>
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    | PgError.PostgresQueryError
    | PgError.PostgresValidationError
    | PgError.PostgresUnexpectedNumberOfRowsError,
    A
  >;
} = (sql: string, schema?: Schema.Schema<unknown, unknown>) => {
  const runQuery = schema ? query(sql, schema) : query(sql);

  return (...values: unknown[]): Effect.Effect<pg.ClientBase, any, any> =>
    runQuery(...values).pipe(
      Effect.filterOrFail(
        (rows) => rows.length === 1,
        (rows) =>
          new PgError.PostgresUnexpectedNumberOfRowsError({
            expectedRows: 1,
            receivedRows: rows.length,
          })
      ),
      Effect.map((rows) => rows[0] as unknown)
    );
};

const defaultQueryStreamOptions: Pg.QueryStreamOptions = {
  maxRowsPerRead: 10,
};

export const queryStream: {
  <_, A>(
    queryText: string,
    schema: Schema.Schema<_, A>,
    options?: Partial<Pg.QueryStreamOptions>
  ): (
    ...values: unknown[]
  ) => Stream.Stream<
    pg.ClientBase,
    PgError.PostgresQueryError | PgError.PostgresValidationError,
    A
  >;

  (
    queryText: string,
    options?: Partial<Pg.QueryStreamOptions>
  ): (
    ...values: unknown[]
  ) => Stream.Stream<pg.ClientBase, PgError.PostgresQueryError, unknown>;
} = (
  sql: string,
  ...args:
    | [
        schema: Schema.Schema<unknown, unknown>,
        options?: Partial<Pg.QueryStreamOptions>,
      ]
    | [options?: Partial<Pg.QueryStreamOptions>]
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
      Effect.flatMap(internal_context.ClientBase, (client) =>
        Effect.acquireRelease(
          Effect.succeed(client.query(new Cursor(sql, values))),
          (cursor) => Effect.tryPromise(() => cursor.close()).pipe(Effect.orDie)
        )
      ),
      Effect.map((cursor) =>
        pipe(
          Effect.tryPromise(() => cursor.read(options.maxRowsPerRead)),
          Effect.mapError(flow(convertError, Option.some)),
          Effect.flatMap((rows) => {
            if (parse === undefined) {
              return Effect.succeed(rows);
            }

            return pipe(
              rows,
              Effect.forEach((row) => parse(row)),
              Effect.mapError((error) =>
                Option.some(
                  new PgError.PostgresValidationError({
                    error,
                  }) as unknown as PgError.PostgresUnknownError
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

export const begin = query('BEGIN')();
export const commit = query('COMMIT')();
export const rollback = query('ROLLBACK')();

export const transaction = <R, E, A>(
  self: Effect.Effect<R, E, A>
): Effect.Effect<R | pg.ClientBase, E | PgError.PostgresQueryError, A> =>
  Effect.acquireUseRelease(
    begin,
    () => self,
    (_, exit) =>
      pipe(
        exit,
        Exit.match({
          onSuccess: () => commit,
          onFailure: () => rollback,
        }),
        Effect.orDie
      )
  );

export const transactionRollback = <R, E, A>(
  self: Effect.Effect<R, E, A>
): Effect.Effect<R | pg.ClientBase, E | PgError.PostgresQueryError, A> =>
  Effect.acquireUseRelease(
    begin,
    () => self,
    () => Effect.orDie(rollback)
  );
