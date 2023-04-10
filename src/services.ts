import { ClientBase, Pool, PoolConfig } from 'pg';

import * as Context from '@effect/data/Context';
import * as Effect from '@effect/io/Effect';

export const PostgresConfigService = Context.Tag<PoolConfig>();
export const PostgresClientService = Context.Tag<ClientBase>();
export const PostgresPoolService = Context.Tag<Pool>();

export const getPostgresClient = Effect.serviceFunction(
  PostgresClientService,
  (client) => () => client
)();

export const getPostgresPool = Effect.serviceFunction(
  PostgresPoolService,
  (pool) => () => pool
)();

export const getPostgresConfig = Effect.serviceFunction(
  PostgresConfigService,
  (config) => () => config
)();
