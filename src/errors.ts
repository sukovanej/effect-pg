import * as Data from '@effect/data/Data';
import * as ParseResult from '@effect/schema/ParseResult';

export type PostgresUnknownError = {
  _tag: 'PostgresUnknownError';
  error: unknown;
};

export const postgresUnknownError = (error: unknown): PostgresUnknownError => ({
  _tag: 'PostgresUnknownError',
  error,
});

export type PostgresConnectionError = {
  _tag: 'PostgresConnectionError';
  error: unknown;
};

export const postgresConnectionError = (
  error: unknown
): PostgresConnectionError => ({ _tag: 'PostgresConnectionError', error });

export type PostgresTableDoesntExistError = {
  _tag: 'PostgresTableDoesntExistError';
  error: unknown;
};

export const postgresTableDoesntExistError = <E>(
  error: E
): PostgresTableDoesntExistError => ({
  _tag: 'PostgresTableDoesntExistError',
  error,
});

export type PostgresValidationError = {
  _tag: 'PostgresValidationError';
  error: ParseResult.ParseError;
};

export const postgresValidationError = (
  error: ParseResult.ParseError
): PostgresValidationError => ({ _tag: 'PostgresValidationError', error });

export type PostgresUnexpectedNumberOfRowsError = {
  _tag: 'PostgresUnexpectedNumberOfRowsError';
  expected: number;
  actual: number;
};

export const postgresUnexpectedNumberOfRowsError = (
  expected: number,
  actual: number
): PostgresUnexpectedNumberOfRowsError => ({
  _tag: 'PostgresUnexpectedNumberOfRowsError',
  expected,
  actual,
});

export type PostgresDuplicateTableError = {
  _tag: 'PostgresDuplicateTableError';
  error: unknown;
};

export const postgresDuplicateTableError = (
  error: unknown
): PostgresDuplicateTableError => ({
  _tag: 'PostgresDuplicateTableError',
  error,
});

export class PostgresInvalidParametersError extends Data.TaggedClass(
  'PostgresInvalidParametersError'
)<{ error: unknown }> {}

export type PostgresQueryError =
  | PostgresTableDoesntExistError
  | PostgresUnknownError
  | PostgresDuplicateTableError
  | PostgresInvalidParametersError;
