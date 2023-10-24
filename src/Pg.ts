import * as pg from 'pg';

import type * as Schema from '@effect/schema/Schema';
import type * as PgError from 'effect-pg/PgError';
import * as internal_config from 'effect-pg/internal/config';
import * as internal_context from 'effect-pg/internal/context';
import * as internal_layers from 'effect-pg/internal/layers';
import * as internal_query from 'effect-pg/internal/query';
import type * as _Config from 'effect/Config';
import type * as ConfigError from 'effect/ConfigError';
import type * as Context from 'effect/Context';
import type * as Effect from 'effect/Effect';
import type * as Layer from 'effect/Layer';
import type * as Stream from 'effect/Stream';

/**
 * @category models
 * @since 1.0.0
 */
export interface ConfigOptions {
  namePrefix: string;
  defaultHost?: string;
  defaultPort?: number;
  defaultUser?: string;
  defaultPassword?: string;
  defaultDatabase?: string;
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Config {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * @category config
 * @since 1.0.0
 */
export const makeConfig: (
  options?: Partial<ConfigOptions>
) => _Config.Config<Config> = internal_config.makeConfig;

/**
 * @category config
 * @since 1.0.0
 */
export const setConfig: (
  options?: Partial<ConfigOptions>
) => Layer.Layer<
  never,
  ConfigError.ConfigError,
  pg.PoolConfig | pg.ClientConfig
> = internal_config.setConfig;

/**
 * @category layer
 * @since 1.0.0
 */
export const client: Layer.Layer<
  pg.ClientConfig,
  PgError.PostgresConnectionError,
  pg.ClientBase
> = internal_layers.client;

/**
 * @category layer
 * @since 1.0.0
 */
export const pool: Layer.Layer<pg.PoolConfig, never, pg.Pool> =
  internal_layers.pool;

/**
 * @category layer
 * @since 1.0.0
 */
export const poolClient: Layer.Layer<
  pg.Pool,
  PgError.PostgresConnectionError,
  pg.PoolClient | pg.ClientBase
> = internal_layers.poolClient;

/**
 * @category models
 * @since 1.0.0
 */
export interface QueryStreamOptions {
  maxRowsPerRead: number;
}

/**
 * @category querying
 * @since 1.0.0
 */
export const query: {
  <_, A = unknown>(
    sql: string,
    schema: Schema.Schema<_, A>
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    PgError.PostgresQueryError | PgError.PostgresValidationError,
    A[]
  >;

  (
    sql: string
  ): (
    ...values: unknown[]
  ) => Effect.Effect<pg.ClientBase, PgError.PostgresQueryError, unknown[]>;
} = internal_query.query;

/**
 * @category querying
 * @since 1.0.0
 */
export const queryOne: {
  (
    sql: string
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    PgError.PostgresQueryError | PgError.PostgresUnexpectedNumberOfRowsError,
    unknown
  >;

  <_, A = unknown>(
    sql: string,
    schema?: Schema.Schema<_, A>
  ): (
    ...values: unknown[]
  ) => Effect.Effect<
    pg.ClientBase,
    | PgError.PostgresQueryError
    | PgError.PostgresValidationError
    | PgError.PostgresUnexpectedNumberOfRowsError,
    A
  >;
} = internal_query.queryOne;

/**
 * @category querying
 * @since 1.0.0
 */
export const queryStream: {
  <_, A>(
    queryText: string,
    schema: Schema.Schema<_, A>,
    options?: Partial<QueryStreamOptions>
  ): (
    ...values: unknown[]
  ) => Stream.Stream<
    pg.ClientBase,
    PgError.PostgresQueryError | PgError.PostgresValidationError,
    A
  >;

  (
    queryText: string,
    options?: Partial<QueryStreamOptions>
  ): (
    ...values: unknown[]
  ) => Stream.Stream<pg.ClientBase, PgError.PostgresQueryError, unknown>;
} = internal_query.queryStream;

/**
 * @category transactions
 * @since 1.0.0
 */
export const begin: Effect.Effect<
  pg.ClientBase,
  PgError.PostgresQueryError,
  void
> = internal_query.begin;

/**
 * @category transactions
 * @since 1.0.0
 */
export const commit: Effect.Effect<
  pg.ClientBase,
  PgError.PostgresQueryError,
  void
> = internal_query.commit;

/**
 * @category transactions
 * @since 1.0.0
 */
export const rollback: Effect.Effect<
  pg.ClientBase,
  PgError.PostgresQueryError,
  void
> = internal_query.rollback;

/**
 * @category transactions
 * @since 1.0.0
 */
export const transaction: <R, E, A>(
  self: Effect.Effect<R, E, A>
) => Effect.Effect<R | pg.ClientBase, E | PgError.PostgresQueryError, A> =
  internal_query.transaction;

/**
 * @category transactions
 * @since 1.0.0
 */
export const transactionRollback: <R, E, A>(
  self: Effect.Effect<R, E, A>
) => Effect.Effect<R | pg.ClientBase, E | PgError.PostgresQueryError, A> =
  internal_query.transactionRollback;

/**
 * @category context
 * @since 1.0.0
 */
export const ClientConfig: Context.Tag<pg.ClientConfig, pg.ClientConfig> =
  internal_context.ClientConfig;

/**
 * @category context
 * @since 1.0.0
 */
export const Client: Context.Tag<pg.Client, pg.Client> =
  internal_context.Client;

/**
 * @category context
 * @since 1.0.0
 */
export const PoolConfig: Context.Tag<pg.PoolConfig, pg.PoolConfig> =
  internal_context.PoolConfig;

/**
 * @category context
 * @since 1.0.0
 */
export const PoolClient: Context.Tag<pg.PoolClient, pg.PoolClient> =
  internal_context.PoolClient;

/**
 * @category context
 * @since 1.0.0
 */
export const Pool: Context.Tag<pg.Pool, pg.Pool> = internal_context.Pool;

/**
 * @category context
 * @since 1.0.0
 */
export const ClientBase: Context.Tag<pg.ClientBase, pg.ClientBase> =
  internal_context.ClientBase;
