import { Client, Pool } from 'pg';

import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';

import { postgresConnectionError } from './errors';
import { ClientService, ConfigService, PoolService } from './services';

export const clientLayer = pipe(
  Effect.map(ConfigService, (config) => new Client(config)),
  Effect.flatMap((client) =>
    Effect.acquireRelease(
      pipe(
        Effect.tryPromise(() => client.connect()),
        Effect.mapError(postgresConnectionError),
        Effect.as(client),
        Effect.tap(() => Effect.logTrace('Postgres connection acquired'))
      ),
      (client) =>
        pipe(
          Effect.sync(() => client.end()),
          Effect.tap(() => Effect.logDebug('Postgres connection released'))
        )
    )
  ),
  Effect.toLayerScoped(ClientService)
);

export const poolLayer = pipe(
  Effect.acquireRelease(
    pipe(
      Effect.map(ConfigService, (config) => new Pool(config)),
      Effect.tap(() => Effect.logTrace('Postgres pool initialized'))
    ),
    (pool) =>
      pipe(
        Effect.logDebug('Releasing postgres pool'),
        Effect.as([pool.idleCount, pool.waitingCount]),
        Effect.tap(() => Effect.tryPromise(() => pool.end())),
        Effect.tap(([idle, waiting]) =>
          pipe(
            Effect.logDebug('Postgres pool ended'),
            Effect.logAnnotate('idleConnectionsCounts', `${idle}`),
            Effect.logAnnotate('waitingConnectionsCounts', `${waiting}`)
          )
        ),
        Effect.orDie
      )
  ),
  Effect.toLayerScoped(PoolService)
);

export const poolClientLayer = pipe(
  Effect.flatMap(PoolService, (pool) =>
    Effect.acquireRelease(
      pipe(
        Effect.tryPromise(() => pool.connect()),
        Effect.mapError(postgresConnectionError),
        Effect.tap(() =>
          Effect.logTrace('Postgres connection acquired from pool')
        )
      ),
      (client) =>
        pipe(
          Effect.sync(() => client.release()),
          Effect.tap(() =>
            Effect.logTrace('Postgres connection released to pool')
          )
        )
    )
  ),
  Effect.toLayerScoped(ClientService)
);
