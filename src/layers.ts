import { Client, Pool } from 'pg';

import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Layer from '@effect/io/Layer';

import { postgresConnectionError } from './errors';
import {
  PostgresClientService,
  PostgresConfigService,
  PostgresPoolService,
} from './services';

export const client = pipe(
  Effect.map(PostgresConfigService, (config) => new Client(config)),
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
  Effect.toLayerScoped(PostgresClientService)
);

export const pool = pipe(
  Effect.map(PostgresConfigService, (config) => new Pool(config)),
  Effect.tap(() => Effect.logTrace('Postgres pool initialized')),
  Effect.toLayerScoped(PostgresPoolService)
);

export const poolClient = pipe(
  Effect.flatMap(PostgresPoolService, (pool) =>
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
  Effect.toLayerScoped(PostgresClientService)
);
