import * as pg from 'pg';

import { Context, Effect, Layer, pipe } from 'effect';
import { PostgresConnectionError } from 'effect-pg/errors';
import {
  Client,
  ClientBase,
  ClientConfig,
  Pool,
  PoolClient,
  PoolConfig,
} from 'effect-pg/services';

export const client = pipe(
  Effect.map(ClientConfig, (config) => new pg.Client(config)),
  Effect.flatMap((client) =>
    Effect.acquireRelease(
      pipe(
        Effect.tryPromise(() => client.connect()),
        Effect.mapError((error) => new PostgresConnectionError({ error })),
        Effect.as(client),
        Effect.tap(() => Effect.logDebug('Postgres connection acquired'))
      ),
      (client) =>
        pipe(
          Effect.sync(() => client.end()),
          Effect.tap(() => Effect.logDebug('Postgres connection released'))
        )
    )
  ),
  Layer.scoped(Client),
  Layer.flatMap((client) =>
    client.pipe(
      Context.add(ClientBase, Context.get(client, Client)),
      Layer.succeedContext
    )
  )
);

export const pool = pipe(
  Effect.acquireRelease(
    pipe(
      Effect.map(PoolConfig, (config) => new pg.Pool(config)),
      Effect.tap(() => Effect.logDebug('Postgres pool initialized'))
    ),
    (pool) =>
      pipe(
        Effect.logDebug('Releasing postgres pool'),
        Effect.as([pool.idleCount, pool.waitingCount]),
        Effect.tap(() => Effect.tryPromise(() => pool.end())),
        Effect.tap(([idle, waiting]) =>
          pipe(
            Effect.logDebug('Postgres pool ended'),
            Effect.annotateLogs('idleConnectionsCounts', `${idle}`),
            Effect.annotateLogs('waitingConnectionsCounts', `${waiting}`)
          )
        ),
        Effect.orDie
      )
  ),
  Layer.scoped(Pool)
);

export const poolClient = pipe(
  Effect.flatMap(Pool, (pool) =>
    Effect.acquireRelease(
      pipe(
        Effect.tryPromise(() => pool.connect()),
        Effect.mapError((error) => new PostgresConnectionError({ error })),
        Effect.tap(() =>
          Effect.logDebug('Postgres connection acquired from pool')
        )
      ),
      (client) =>
        pipe(
          Effect.sync(() => client.release()),
          Effect.tap(() =>
            Effect.logDebug('Postgres connection released to pool')
          )
        )
    )
  ),
  Layer.scoped(PoolClient),
  Layer.flatMap((poolClient) =>
    poolClient.pipe(
      Context.add(ClientBase, Context.get(poolClient, PoolClient)),
      Layer.succeedContext
    )
  )
);
