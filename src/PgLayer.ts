/**
 * Main module
 *
 * @since 1.0.0
 */
import type * as _Config from "effect/Config"
import type * as ConfigError from "effect/ConfigError"
import type * as Layer from "effect/Layer"
import type * as pg from "pg"
import * as internal_config from "./internal/config.js"
import * as internal_layers from "./internal/layers.js"
import type * as PgError from "./PgError.js"

/**
 * @category models
 * @since 1.0.0
 */
export interface ConfigOptions {
  namePrefix: string
  defaultHost?: string
  defaultPort?: number
  defaultUser?: string
  defaultPassword?: string
  defaultDatabase?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export interface Config {
  host: string
  port: number
  user: string
  password: string
  database: string
}

/**
 * @category config
 * @since 1.0.0
 */
export const makeConfig: (
  options?: Partial<ConfigOptions>
) => _Config.Config<Config> = internal_config.makeConfig

/**
 * @category config
 * @since 1.0.0
 */
export const setConfig: (
  options?: Partial<ConfigOptions>
) => Layer.Layer<pg.PoolConfig | pg.ClientConfig, ConfigError.ConfigError> = internal_config.setConfig

/**
 * @category layer
 * @since 1.0.0
 */
export const Pool: Layer.Layer<pg.Pool, never, pg.PoolConfig> = internal_layers.pool

/**
 * @category layer
 * @since 1.0.0
 */
export const Client: Layer.Layer<
  pg.ClientBase,
  PgError.PostgresConnectionError,
  pg.ClientConfig
> = internal_layers.client

/**
 * @category layer
 * @since 1.0.0
 */
export const PoolClient: Layer.Layer<pg.PoolClient | pg.ClientBase, PgError.PostgresConnectionError, pg.Pool> =
  internal_layers.poolClient
