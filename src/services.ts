import { ClientBase, Pool, PoolConfig } from 'pg';

import * as Context from '@effect/data/Context';

export const ConfigService = Context.Tag<PoolConfig>();
export const ClientService = Context.Tag<ClientBase>();
export const PoolService = Context.Tag<Pool>();
