import * as pg from 'pg';

import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Exit from '@effect/io/Exit';
import * as Match from '@effect/match';
import {
  PostgresQueryError,
  PostgresUnexpectedNumberOfRowsError,
  PostgresValidationError,
  postgresDuplicateTableError,
  postgresTableDoesntExistError,
  postgresUnexpectedNumberOfRowsError,
  postgresUnknownError,
  postgresValidationError,
} from 'effect-pg/errors';
import { Client } from 'effect-pg/services';

export const queryRaw = (
  queryText: string,
  values?: unknown[]
): Effect.Effect<pg.ClientBase, PostgresQueryError, pg.QueryResult<any>> =>
  pipe(
    Effect.flatMap(Client, (client) =>
      Effect.tryPromise(() => client.query(queryText, values))
    ),
    Effect.mapError((error) =>
      pipe(
        Match.value(error),
        Match.when({ code: '42P01' }, (error) =>
          postgresTableDoesntExistError(error)
        ),
        Match.when({ code: '42P07' }, (error) =>
          postgresDuplicateTableError(error)
        ),
        Match.orElse(postgresUnknownError)
      )
    )
  );

type Parser<E, A> = (row: unknown) => Effect.Effect<never, E, A>;

export const queryArray: {
  <A, E>(
    queryText: string,
    parse: Parser<E, A>,
    values?: unknown[]
  ): Effect.Effect<
    pg.ClientBase,
    PostgresQueryError | PostgresValidationError<E>,
    readonly A[]
  >;
  (
    queryText: string,
    values?: unknown[]
  ): Effect.Effect<pg.ClientBase, PostgresQueryError, readonly unknown[]>;
} = <E, A>(
  queryText: string,
  ...args: [parse: Parser<E, A>, values?: unknown[]] | [values?: unknown[]]
): Effect.Effect<pg.ClientBase, any, unknown[] | readonly A[]> => {
  const values =
    args.length === 2 ? args[1] : Array.isArray(args[0]) ? args[0] : undefined;
  const parse =
    args.length === 2 ? args[0] : !Array.isArray(args[0]) ? args[0] : undefined;

  const result = pipe(
    queryRaw(queryText, values),
    Effect.map(({ rows }) => rows as unknown[])
  );

  if (!parse) {
    return result;
  }

  return Effect.flatMap(result, (rows) =>
    Effect.forEach(rows, (row) =>
      Effect.mapError(parse(row), postgresValidationError)
    )
  );
};

export const queryOne: {
  <E, A>(
    queryText: string,
    parse: Parser<E, A>,
    values?: unknown[]
  ): Effect.Effect<
    pg.ClientBase,
    | PostgresQueryError
    | PostgresUnexpectedNumberOfRowsError
    | PostgresValidationError<E>,
    A
  >;
  (
    queryText: string,
    values?: unknown[]
  ): Effect.Effect<
    pg.ClientBase,
    PostgresQueryError | PostgresUnexpectedNumberOfRowsError,
    unknown
  >;
} = <E, A>(
  queryText: string,
  ...args: [parse: Parser<E, A>, values?: unknown[]] | [values?: unknown[]]
): Effect.Effect<pg.ClientBase, any, unknown | A> => {
  const values =
    args.length === 2 ? args[1] : Array.isArray(args[0]) ? args[0] : undefined;
  const parse =
    args.length === 2 ? args[0] : !Array.isArray(args[0]) ? args[0] : undefined;

  const result = pipe(
    queryRaw(queryText, values),
    Effect.filterOrFail(
      ({ rows }) => rows.length === 1,
      ({ rows }) => postgresUnexpectedNumberOfRowsError(1, rows.length)
    ),
    Effect.map(({ rows }) => rows[0] as unknown)
  );

  if (!parse) {
    return result;
  }

  return pipe(
    result,
    Effect.flatMap((row) =>
      pipe(parse(row), Effect.mapError(postgresValidationError))
    )
  );
};

export const transaction = <R, E, A>(
  self: Effect.Effect<R, E, A>
): Effect.Effect<R | pg.ClientBase, E | PostgresQueryError, A> =>
  Effect.acquireUseRelease(
    queryRaw('BEGIN'),
    () => self,
    (_, exit) =>
      pipe(
        exit,
        Exit.match({
          onSuccess: () => queryRaw('COMMIT'),
          onFailure: () => queryRaw('ROLLBACK'),
        }),
        Effect.orDie
      )
  );

export const transactionRollback = <R, E, A>(
  self: Effect.Effect<R, E, A>
): Effect.Effect<R | pg.ClientBase, E | PostgresQueryError, A> =>
  Effect.acquireUseRelease(
    queryRaw('BEGIN'),
    () => self,
    () => Effect.orDie(queryRaw('ROLLBACK'))
  );
