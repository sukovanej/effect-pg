import { ParseError } from '@effect/schema/ParseResult';

export type PostgresUnknownError = {
  _tag: 'PostgresUnknownError';
  error: unknown;
};

export type PostgresConnectionError = {
  _tag: 'PostgresConnectionError';
  error: unknown;
};

export type PostgresTableDoesntExistError = {
  _tag: 'PostgresTableDoesntExistError';
  error: unknown;
};

export type PostgresValidationError = {
  _tag: 'PostgresValidationError';
  error: ParseError;
};

export type PostgresUnexpectedNumberOfRowsError = {
  _tag: 'PostgresUnexpectedNumberOfRowsError';
  expected: number;
  actual: number;
};

export const postgresUnknownError = (error: unknown): PostgresUnknownError =>
  ({ _tag: 'PostgresUnknownError', error } as const);

export const postgresConnectionError = (
  error: unknown
): PostgresConnectionError =>
  ({ _tag: 'PostgresConnectionError', error } as const);

export const postgresTableDoesntExistError = <E>(
  error: E
): PostgresTableDoesntExistError =>
  ({ _tag: 'PostgresTableDoesntExistError', error } as const);

export const postgresValidationError = (
  error: ParseError
): PostgresValidationError =>
  ({ _tag: 'PostgresValidationError', error } as const);

export const postgresUnexpectedNumberOfRowsError = (
  expected: number,
  actual: number
): PostgresUnexpectedNumberOfRowsError =>
  ({ _tag: 'PostgresUnexpectedNumberOfRowsError', expected, actual } as const);
