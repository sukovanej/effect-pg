import * as Chunk from '@effect/data/Chunk';
import { flow, pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Match from '@effect/match';
import { ParseError } from '@effect/schema/ParseResult';

import {
  postgresTableDoesntExistError,
  postgresUnexpectedNumberOfRowsError,
  postgresUnknownError,
  postgresValidationError,
} from './errors';
import { getPostgresClient } from './services';

export const query = (queryText: string, values?: unknown[]) =>
  pipe(
    getPostgresClient,
    Effect.flatMap((client) =>
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

export const queryValidated = <A>(
  queryText: string,
  parse: (row: unknown) => Effect.Effect<never, ParseError, A>,
  values?: unknown[]
) =>
  pipe(
    query(queryText, values),
    Effect.map(({ rows }) => rows),
    Effect.flatMap(
      Effect.forEach(flow(parse, Effect.mapError(postgresValidationError)))
    ),
    Effect.map(Chunk.toReadonlyArray)
  );

export const queryOne = (queryText: string, values?: unknown[]) =>
  pipe(
    query(queryText, values),
    Effect.filterOrElseWith(
      ({ rows }) => rows.length === 1,
      ({ rows }) =>
        Effect.fail(postgresUnexpectedNumberOfRowsError(1, rows.length))
    ),
    Effect.map(({ rows }) => rows[0] as unknown)
  );

export const queryOneValidated = <A>(
  queryText: string,
  parse: (row: unknown) => Effect.Effect<never, ParseError, A>,
  values?: unknown[]
) =>
  pipe(
    query(queryText, values),
    Effect.filterOrElseWith(
      ({ rows }) => rows.length === 1,
      ({ rows }) =>
        Effect.fail(postgresUnexpectedNumberOfRowsError(1, rows.length))
    ),
    Effect.map(({ rows }) => rows[0] as unknown),
    Effect.flatMap((row) =>
      pipe(parse(row), Effect.mapError(postgresValidationError))
    )
  );
