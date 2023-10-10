import { ParseResult } from '@effect/schema';
import { Data } from 'effect';

export class PostgresUnknownError extends Data.TaggedError(
  'PostgresUnknownError'
)<{ error: unknown }> {}

export class PostgresConnectionError extends Data.TaggedError(
  'PostgresConnectionError'
)<{ error: unknown }> {}

export class PostgresTableDoesntExistError extends Data.TaggedError(
  'PostgresTableDoesntExistError'
)<{ error: unknown }> {}

export class PostgresValidationError extends Data.TaggedError(
  'PostgresValidationError'
)<{ error: ParseResult.ParseError }> {}

export class PostgresUnexpectedNumberOfRowsError extends Data.TaggedError(
  'PostgresUnexpectedNumberOfRowsError'
)<{ expectedRows: number; receivedRows: number }> {}

export class PostgresDuplicateTableError extends Data.TaggedError(
  'PostgresDuplicateTableError'
)<{ error: unknown }> {}

export class PostgresInvalidParametersError extends Data.TaggedError(
  'PostgresInvalidParametersError'
)<{ error: unknown }> {}

export type PostgresQueryError =
  | PostgresTableDoesntExistError
  | PostgresUnknownError
  | PostgresDuplicateTableError
  | PostgresInvalidParametersError;
