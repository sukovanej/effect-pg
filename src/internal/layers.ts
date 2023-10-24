import * as pg from 'pg';

import * as PgError from 'effect-pg/PgError';
import * as internal_context from 'effect-pg/internal/context';
import * as _Config from 'effect/Config';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';

export const client = pipe(
  Effect.map(internal_context.ClientConfig, (config) => new pg.Client(config)),
  Effect.flatMap((client) =>
    Effect.acquireRelease(
      pipe(
        Effect.tryPromise(() => client.connect()),
        Effect.mapError(
          (error) => new PgError.PostgresConnectionError({ error })
        ),
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
  Layer.scoped(internal_context.Client),
  Layer.flatMap((client) =>
    client.pipe(
      Context.add(
        internal_context.ClientBase,
        Context.get(client, internal_context.Client)
      ),
      Layer.succeedContext
    )
  )
);

export const pool = pipe(
  Effect.acquireRelease(
    pipe(
      Effect.map(internal_context.PoolConfig, (config) => new pg.Pool(config)),
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
  Layer.scoped(internal_context.Pool)
);

export const poolClient = pipe(
  Effect.flatMap(internal_context.Pool, (pool) =>
    Effect.acquireRelease(
      pipe(
        Effect.tryPromise(() => pool.connect()),
        Effect.mapError(
          (error) => new PgError.PostgresConnectionError({ error })
        ),
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
  Layer.scoped(internal_context.PoolClient),
  Layer.flatMap((poolClient) =>
    poolClient.pipe(
      Context.add(
        internal_context.ClientBase,
        Context.get(poolClient, internal_context.PoolClient)
      ),
      Layer.succeedContext
    )
  )
);
