/**
 * Built-in context tags.
 *
 * @since 1.0.0
 */
import type * as pg from "pg"

import type * as Context from "effect/Context"
import * as internal_context from "./internal/context.js"

/**
 * @category context
 * @since 1.0.0
 */
export const ClientConfig: Context.Tag<pg.ClientConfig, pg.ClientConfig> = internal_context.ClientConfig

/**
 * @category context
 * @since 1.0.0
 */
export const Client: Context.Tag<pg.Client, pg.Client> = internal_context.Client

/**
 * @category context
 * @since 1.0.0
 */
export const PoolConfig: Context.Tag<pg.PoolConfig, pg.PoolConfig> = internal_context.PoolConfig

/**
 * @category context
 * @since 1.0.0
 */
export const PoolClient: Context.Tag<pg.PoolClient, pg.PoolClient> = internal_context.PoolClient

/**
 * @category context
 * @since 1.0.0
 */
export const Pool: Context.Tag<pg.Pool, pg.Pool> = internal_context.Pool

/**
 * @category context
 * @since 1.0.0
 */
export const ClientBase: Context.Tag<pg.ClientBase, pg.ClientBase> = internal_context.ClientBase
