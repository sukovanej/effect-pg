import * as Config from "effect/Config"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as internal_context from "./context.js"

import type { ConfigOptions } from "../PgLayer.js"

/** @internal */
const defaultOptions: ConfigOptions = {
  namePrefix: "POSTGRES",
  defaultPort: 5432,
  defaultHost: "localhost"
}

/** @internal */
const withDefault = <A>(defaultValue: A | undefined) => (c: Config.Config<A>) => {
  if (defaultValue === undefined) {
    return c
  }

  return pipe(c, Config.withDefault(defaultValue))
}

/** @internal */
export const makeConfig = (options?: Partial<ConfigOptions>) => {
  const { namePrefix, ...defaults } = { ...defaultOptions, ...options }

  return Config.all({
    host: Config.string(`${namePrefix}_HOST`).pipe(
      withDefault(defaults.defaultHost)
    ),
    port: Config.integer(`${namePrefix}_PORT`).pipe(
      withDefault(defaults.defaultPort)
    ),
    user: Config.string(`${namePrefix}_USER`).pipe(
      withDefault(defaults.defaultUser)
    ),
    password: Config.string(`${namePrefix}_PASSWORD`).pipe(
      withDefault(defaults.defaultPassword)
    ),
    database: Config.string(`${namePrefix}_DATABASE`).pipe(
      withDefault(defaults.defaultDatabase)
    )
  })
}

/** @internal */
export const setConfig = (options?: Partial<ConfigOptions>) =>
  pipe(
    makeConfig(options),
    Effect.map((config) =>
      pipe(
        Context.make(internal_context.PoolConfig, config),
        Context.add(internal_context.ClientConfig, config)
      )
    ),
    Layer.effectContext
  )
