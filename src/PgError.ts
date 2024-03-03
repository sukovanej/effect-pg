/**
 * Pg errors
 * @since 1.0.0
 */
import type * as ParseResult from "@effect/schema/ParseResult"
import * as Data from "effect/Data"

/**
 * @category models
 * @since 1.0.0
 */
export class PostgresUnknownError extends Data.TaggedError(
  "PostgresUnknownError"
)<{ error: unknown }> {}

/**
 * @category models
 * @since 1.0.0
 */
export class PostgresConnectionError extends Data.TaggedError(
  "PostgresConnectionError"
)<{ error: unknown }> {}

/**
 * @category models
 * @since 1.0.0
 */
export class PostgresTableDoesntExistError extends Data.TaggedError(
  "PostgresTableDoesntExistError"
)<{ error: unknown }> {}

/**
 * @category models
 * @since 1.0.0
 */
export class PostgresValidationError extends Data.TaggedError(
  "PostgresValidationError"
)<{ error: ParseResult.ParseError }> {}

/**
 * @category models
 * @since 1.0.0
 */
export class PostgresUnexpectedNumberOfRowsError extends Data.TaggedError(
  "PostgresUnexpectedNumberOfRowsError"
)<{ expectedRows: number; receivedRows: number }> {}

/**
 * @category models
 * @since 1.0.0
 */
export class PostgresDuplicateTableError extends Data.TaggedError(
  "PostgresDuplicateTableError"
)<{ error: unknown }> {}

/**
 * @category models
 * @since 1.0.0
 */
export class PostgresInvalidParametersError extends Data.TaggedError(
  "PostgresInvalidParametersError"
)<{ error: unknown }> {}

/**
 * @category models
 * @since 1.0.0
 */
export type PostgresQueryError =
  | PostgresTableDoesntExistError
  | PostgresUnknownError
  | PostgresDuplicateTableError
  | PostgresInvalidParametersError
