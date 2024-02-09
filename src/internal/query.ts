import type * as pg from "pg"
import Cursor from "pg-cursor"

import * as Schema from "@effect/schema/Schema"
import type * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { flow, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import * as Stream from "effect/Stream"
import * as PgError from "../PgError.js"
import type * as PgQuery from "../PgQuery.js"
import * as internal_context from "./context.js"

/** @internal */
const isObjectWithCode = (code: string, object: unknown) =>
  Predicate.isRecord(object) && "code" in object && object["code"] === code

/** @internal */
const convertError = (exception: Cause.UnknownException) => {
  const error = exception.error

  if (isObjectWithCode("42P01", error)) {
    return new PgError.PostgresTableDoesntExistError({ error })
  } else if (isObjectWithCode("42P07", error)) {
    return new PgError.PostgresDuplicateTableError({ error })
  } else if (isObjectWithCode("08P01", error)) {
    return new PgError.PostgresInvalidParametersError({ error })
  }

  return new PgError.PostgresUnknownError({ error })
}

/** @internal */
export const all: {
  <R, _, A = unknown>(
    sql: string,
    schema: Schema.Schema<A, _, R>
  ): (
    ...values: Array<unknown>
  ) => Effect.Effect<Array<A>, PgError.PostgresQueryError | PgError.PostgresValidationError, R | pg.ClientBase>

  (
    sql: string
  ): (
    ...values: Array<unknown>
  ) => Effect.Effect<Array<unknown>, PgError.PostgresQueryError, pg.ClientBase>
} = (sql: string, schema?: Schema.Schema<unknown, unknown, any>) => {
  const parse = schema ? Schema.decodeUnknown(schema) : undefined

  return (...values: Array<unknown>): Effect.Effect<any, any, pg.ClientBase> =>
    pipe(
      Effect.flatMap(internal_context.ClientBase, (client) => Effect.tryPromise(() => client.query(sql, values))),
      Effect.mapError(convertError),
      Effect.flatMap((result) => {
        if (parse === undefined) {
          return Effect.succeed(result.rows)
        }

        return pipe(
          result.rows,
          Effect.forEach((row) => parse(row)),
          Effect.mapError(
            (error) => new PgError.PostgresValidationError({ error })
          )
        )
      })
    )
}

/** @internal */
export const one: {
  (
    sql: string
  ): (
    ...values: Array<unknown>
  ) => Effect.Effect<unknown, PgError.PostgresQueryError | PgError.PostgresUnexpectedNumberOfRowsError, pg.ClientBase>

  <R, _, A = unknown>(
    sql: string,
    schema?: Schema.Schema<A, _, R>
  ): (
    ...values: Array<unknown>
  ) => Effect.Effect<
    A,
    | PgError.PostgresQueryError
    | PgError.PostgresValidationError
    | PgError.PostgresUnexpectedNumberOfRowsError,
    pg.ClientBase | R
  >
} = (sql: string, schema?: Schema.Schema<unknown, unknown, any>) => {
  const runQuery = schema ? all(sql, schema) : all(sql)

  return (...values: Array<unknown>): Effect.Effect<any, any, pg.ClientBase> =>
    runQuery(...values).pipe(
      Effect.filterOrFail(
        (rows) => rows.length === 1,
        (rows) =>
          new PgError.PostgresUnexpectedNumberOfRowsError({
            expectedRows: 1,
            receivedRows: rows.length
          })
      ),
      Effect.map((rows) => rows[0] as unknown)
    )
}

/** @internal */
const defaultQueryStreamOptions: PgQuery.QueryStreamOptions = {
  maxRowsPerRead: 10
}

/** @internal */
export const stream: {
  <R, _, A>(
    queryText: string,
    schema: Schema.Schema<A, _, R>,
    options?: Partial<PgQuery.QueryStreamOptions>
  ): (
    ...values: Array<unknown>
  ) => Stream.Stream<A, PgError.PostgresQueryError | PgError.PostgresValidationError, pg.ClientBase | R>

  (
    queryText: string,
    options?: Partial<PgQuery.QueryStreamOptions>
  ): (
    ...values: Array<unknown>
  ) => Stream.Stream<unknown, PgError.PostgresQueryError, pg.ClientBase>
} = (
  sql: string,
  ...args:
    | [
      schema: Schema.Schema<any, any, any>,
      options?: Partial<PgQuery.QueryStreamOptions> | undefined
    ]
    | [options?: Partial<PgQuery.QueryStreamOptions> | undefined]
) => {
  const { options, parse } = Schema.isSchema(args[0])
    ? {
      parse: Schema.decodeUnknown(args[0]),
      options: { ...defaultQueryStreamOptions, ...args[1] }
    }
    : {
      parse: undefined,
      options: { ...defaultQueryStreamOptions, ...args[0] }
    }

  return (...values: Array<unknown>) =>
    pipe(
      Effect.flatMap(internal_context.ClientBase, (client) =>
        Effect.acquireRelease(
          Effect.succeed(client.query(new Cursor(sql, values))),
          (cursor) => Effect.tryPromise(() => cursor.close()).pipe(Effect.orDie)
        )),
      Effect.map((cursor) =>
        pipe(
          Effect.tryPromise(() => cursor.read(options.maxRowsPerRead)),
          Effect.mapError(flow(convertError, Option.some)),
          Effect.flatMap((rows) => {
            if (parse === undefined) {
              return Effect.succeed(rows)
            }

            return pipe(
              rows,
              Effect.forEach((row) => parse(row)),
              Effect.mapError((error) =>
                Option.some(
                  new PgError.PostgresValidationError({
                    error
                  }) as unknown as PgError.PostgresUnknownError
                )
              )
            )
          }),
          Effect.map(Chunk.fromIterable),
          Effect.filterOrFail(Chunk.isNonEmpty, () => Option.none())
        )
      ),
      Stream.fromPull
    )
}

/** @internal */
export const begin = all("BEGIN")()

/** @internal */
export const commit = all("COMMIT")()

/** @internal */
export const rollback = all("ROLLBACK")()

/** @internal */
export const transaction = <R, E, A>(
  self: Effect.Effect<A, E, R>
): Effect.Effect<A, E | PgError.PostgresQueryError, R | pg.ClientBase> =>
  Effect.acquireUseRelease(
    begin,
    () => self,
    (_, exit) =>
      pipe(
        exit,
        Exit.match({
          onSuccess: () => commit,
          onFailure: () => rollback
        }),
        Effect.orDie
      )
  )

/** @internal */
export const transactionRollback = <R, E, A>(
  self: Effect.Effect<A, E, R>
): Effect.Effect<A, E | PgError.PostgresQueryError, R | pg.ClientBase> =>
  Effect.acquireUseRelease(
    begin,
    () => self,
    () => Effect.orDie(rollback)
  )
