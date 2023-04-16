import { ClientBase } from 'pg';

import * as Chunk from '@effect/data/Chunk';
import { flow, pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Match from '@effect/match';
import { ParseError } from '@effect/schema/ParseResult';

import {
  PostgresQueryError,
  PostgresUnexpectedNumberOfRowsError,
  PostgresValidationError,
  postgresTableDoesntExistError,
  postgresUnexpectedNumberOfRowsError,
  postgresUnknownError,
  postgresValidationError,
} from './errors';
import { PostgresClientService } from './services';

export const queryRaw = (queryText: string, values?: unknown[]) =>
  pipe(
    Effect.flatMap(PostgresClientService, (client) =>
      Effect.tryPromise(() => client.query(queryText, values))
    ),
    Effect.mapError((error) =>
      pipe(
        Match.value(error),
        Match.when({ code: '42P01' }, (error) =>
          postgresTableDoesntExistError(error)
        ),
        Match.orElse(postgresUnknownError)
      )
    )
  );

type Parser<A> = (row: unknown) => Effect.Effect<never, ParseError, A>;

export const queryArray: {
  <A>(
    queryText: string,
    parse: (row: unknown) => Effect.Effect<never, ParseError, A>,
    values?: unknown[]
  ): Effect.Effect<ClientBase, PostgresQueryError, readonly A[]>;
  (queryText: string, values?: unknown[]): Effect.Effect<
    ClientBase,
    PostgresQueryError | PostgresValidationError,
    readonly unknown[]
  >;
} = <A>(
  queryText: string,
  ...args: [parse: Parser<A>, values?: unknown[]] | [values?: unknown[]]
): Effect.Effect<ClientBase, any, unknown[] | readonly A[]> => {
  const values =
    args.length === 2 ? args[1] : Array.isArray(args[0]) ? args[0] : undefined;
  const parse =
    args.length === 2 ? args[0] : !Array.isArray(args[0]) ? args[0] : undefined;

  const result = pipe(
    queryRaw(queryText, values),
    Effect.map(({ rows }) => rows)
  );

  if (!parse) {
    return result;
  }

  return pipe(
    result,
    Effect.flatMap((rows) =>
      Effect.forEach(
        rows,
        flow(parse, Effect.mapError(postgresValidationError))
      )
    ),
    Effect.map(Chunk.toReadonlyArray),
    (x) => x
  );
};

export const queryOne: {
  <A>(
    queryText: string,
    parse: (row: unknown) => Effect.Effect<never, ParseError, A>,
    values?: unknown[]
  ): Effect.Effect<
    ClientBase,
    | PostgresQueryError
    | PostgresUnexpectedNumberOfRowsError
    | PostgresValidationError,
    readonly A[]
  >;
  (queryText: string, values?: unknown[]): Effect.Effect<
    ClientBase,
    | PostgresQueryError
    | PostgresUnexpectedNumberOfRowsError
    | PostgresValidationError,
    readonly unknown[]
  >;
} = <A>(
  queryText: string,
  ...args: [parse: Parser<A>, values?: unknown[]] | [values?: unknown[]]
): Effect.Effect<ClientBase, any, unknown[] | readonly A[]> => {
  const values =
    args.length === 2 ? args[1] : Array.isArray(args[0]) ? args[0] : undefined;
  const parse =
    args.length === 2 ? args[0] : !Array.isArray(args[0]) ? args[0] : undefined;

  const result = pipe(
    queryRaw(queryText, values),
    Effect.filterOrElseWith(
      ({ rows }) => rows.length === 1,
      ({ rows }) =>
        Effect.fail(postgresUnexpectedNumberOfRowsError(1, rows.length))
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
