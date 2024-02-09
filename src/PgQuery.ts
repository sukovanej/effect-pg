/**
 * Querying
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"
import type * as Effect from "effect/Effect"
import type * as Stream from "effect/Stream"
import type * as pg from "pg"
import * as internal_query from "./internal/query.js"
import type * as PgError from "./PgError.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface QueryStreamOptions {
  maxRowsPerRead: number
}

/**
 * @category querying
 * @since 1.0.0
 */
export const all: {
  <R, _, A = unknown>(
    sql: string,
    schema: Schema.Schema<A, _, R>
  ): (
    ...values: Array<unknown>
  ) => Effect.Effect<Array<A>, PgError.PostgresQueryError | PgError.PostgresValidationError, pg.ClientBase | R>

  (
    sql: string
  ): (
    ...values: Array<unknown>
  ) => Effect.Effect<Array<unknown>, PgError.PostgresQueryError, pg.ClientBase>
} = internal_query.all

/**
 * @category querying
 * @since 1.0.0
 */
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
} = internal_query.one

/**
 * @category querying
 * @since 1.0.0
 */
export const stream: {
  <R, _, A>(
    queryText: string,
    schema: Schema.Schema<A, _, R>,
    options?: Partial<QueryStreamOptions>
  ): (
    ...values: Array<unknown>
  ) => Stream.Stream<
    A,
    PgError.PostgresQueryError | PgError.PostgresValidationError,
    pg.ClientBase | R
  >

  (
    queryText: string,
    options?: Partial<QueryStreamOptions>
  ): (
    ...values: Array<unknown>
  ) => Stream.Stream<unknown, PgError.PostgresQueryError, pg.ClientBase>
} = internal_query.stream

/**
 * @category transactions
 * @since 1.0.0
 */
export const begin: Effect.Effect<void, PgError.PostgresQueryError, pg.ClientBase> = internal_query.begin

/**
 * @category transactions
 * @since 1.0.0
 */
export const commit: Effect.Effect<void, PgError.PostgresQueryError, pg.ClientBase> = internal_query.commit

/**
 * @category transactions
 * @since 1.0.0
 */
export const rollback: Effect.Effect<void, PgError.PostgresQueryError, pg.ClientBase> = internal_query.rollback

/**
 * @category transactions
 * @since 1.0.0
 */
export const transaction: <R, E, A>(
  self: Effect.Effect<A, E, R>
) => Effect.Effect<A, E | PgError.PostgresQueryError, R | pg.ClientBase> = internal_query.transaction

/**
 * @category transactions
 * @since 1.0.0
 */
export const transactionRollback: <R, E, A>(
  self: Effect.Effect<A, E, R>
) => Effect.Effect<A, E | PgError.PostgresQueryError, R | pg.ClientBase> = internal_query.transactionRollback
