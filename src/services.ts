import * as pg from 'pg';

import * as Context from '@effect/data/Context';

export const Config = Context.Tag<pg.PoolConfig>(
  'effect-pg/context/ConfigService'
);
export const Client = Context.Tag<pg.ClientBase>(
  'effect-pg/context/ClientService'
);
export const Pool = Context.Tag<pg.Pool>('effect-pg/context/PoolService');
