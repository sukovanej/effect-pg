import { ClientBase, Pool, PoolConfig } from 'pg';

import * as Context from '@effect/data/Context';

export const ConfigService = Context.Tag<PoolConfig>(
  'effect-pg/context/ConfigService'
);
export const ClientService = Context.Tag<ClientBase>(
  'effect-pg/context/ClientService'
);
export const PoolService = Context.Tag<Pool>('effect-pg/context/PoolService');
