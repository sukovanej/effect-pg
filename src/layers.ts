import { Client, Pool } from 'pg';

import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Layer from '@effect/io/Layer';

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
        Effect.tap(() => Effect.log('Postgres connection acquired', 'Trace'))
      ),
      (client) =>
        pipe(
          Effect.sync(() => client.end()),
          Effect.tap(() => Effect.log('Postgres connection released', 'Debug'))
        )
    )
  ),
  Layer.scoped(ClientService)
);

export const poolLayer = pipe(
  Effect.acquireRelease(
    pipe(
      Effect.map(ConfigService, (config) => new Pool(config)),
      Effect.tap(() => Effect.log('Postgres pool initialized', 'Trace'))
    ),
    (pool) =>
      pipe(
        Effect.log('Releasing postgres pool', 'Debug'),
        Effect.as([pool.idleCount, pool.waitingCount]),
        Effect.tap(() => Effect.tryPromise(() => pool.end())),
        Effect.tap(([idle, waiting]) =>
          pipe(
            Effect.log('Postgres pool ended', 'Debug'),
            Effect.annotateLogs('idleConnectionsCounts', `${idle}`),
            Effect.annotateLogs('waitingConnectionsCounts', `${waiting}`)
          )
        ),
        Effect.orDie
      )
  ),
  Layer.scoped(PoolService)
);

export const poolClientLayer = pipe(
  Effect.flatMap(PoolService, (pool) =>
    Effect.acquireRelease(
      pipe(
        Effect.tryPromise(() => pool.connect()),
        Effect.mapError(postgresConnectionError),
        Effect.tap(() =>
          Effect.log('Postgres connection acquired from pool', 'Trace')
        )
      ),
      (client) =>
        pipe(
          Effect.sync(() => client.release()),
          Effect.tap(() =>
            Effect.log('Postgres connection released to pool', 'Trace')
          )
        )
    )
  ),
  Layer.scoped(ClientService)
);
