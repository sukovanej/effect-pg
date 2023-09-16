import * as pg from 'pg';

import * as Context from '@effect/data/Context';

export const ClientConfig = Context.Tag<pg.ClientConfig>(
  'effect-pg/ClientConfig'
);
export const Client = Context.Tag<pg.Client>('effect-pg/Client');

export const PoolConfig = Context.Tag<pg.PoolConfig>('effect-pg/PoolConfig');
export const PoolClient = Context.Tag<pg.PoolClient>('effect-pg/PoolClient');
export const Pool = Context.Tag<pg.Pool>('effect-pg/Pool');

export const ClientBase = Context.Tag<pg.ClientBase>('effect-pg/Client');
