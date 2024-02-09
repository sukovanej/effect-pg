import type * as pg from "pg"

import * as Context from "effect/Context"

/** @internal */
export const ClientConfig = Context.GenericTag<pg.ClientConfig>(
  "effect-pg/ClientConfig"
)

/** @internal */
export const Client = Context.GenericTag<pg.Client>("effect-pg/Client")

/** @internal */
export const PoolConfig = Context.GenericTag<pg.PoolConfig>("effect-pg/PoolConfig")

/** @internal */
export const PoolClient = Context.GenericTag<pg.PoolClient>("effect-pg/PoolClient")

/** @internal */
export const Pool = Context.GenericTag<pg.Pool>("effect-pg/Pool")

/** @internal */
export const ClientBase = Context.GenericTag<pg.ClientBase>("effect-pg/Client")
