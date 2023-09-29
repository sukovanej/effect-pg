import { ParseResult } from '@effect/schema';
import { Data } from 'effect';

export class PostgresUnknownError extends Data.TaggedClass(
  'PostgresUnknownError'
)<{ error: unknown }> {}

export class PostgresConnectionError extends Data.TaggedClass(
  'PostgresConnectionError'
)<{ error: unknown }> {}

export class PostgresTableDoesntExistError extends Data.TaggedClass(
  'PostgresTableDoesntExistError'
)<{ error: unknown }> {}

export class PostgresValidationError extends Data.TaggedClass(
  'PostgresValidationError'
)<{ error: ParseResult.ParseError }> {}

export class PostgresUnexpectedNumberOfRowsError extends Data.TaggedClass(
  'PostgresUnexpectedNumberOfRowsError'
)<{ expectedRows: number; receivedRows: number }> {}

export class PostgresDuplicateTableError extends Data.TaggedClass(
  'PostgresDuplicateTableError'
)<{ error: unknown }> {}

export class PostgresInvalidParametersError extends Data.TaggedClass(
  'PostgresInvalidParametersError'
)<{ error: unknown }> {}

export type PostgresQueryError =
  | PostgresTableDoesntExistError
  | PostgresUnknownError
  | PostgresDuplicateTableError
  | PostgresInvalidParametersError;
