import { ClientBase, Pool, PoolConfig } from 'pg';

import * as Context from '@effect/data/Context';

export const PostgresConfigService = Context.Tag<PoolConfig>();
export const PostgresClientService = Context.Tag<ClientBase>();
export const PostgresPoolService = Context.Tag<Pool>();
