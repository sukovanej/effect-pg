import { Client, Pool } from 'pg';

import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Layer from '@effect/io/Layer';

import { postgresConnectionError } from './errors';
import {
  PostgresClientService,
  getPostgresConfig,
  getPostgresPool,
} from './services';

export const client = pipe(
  getPostgresConfig,
  Effect.map((config) => new Client(config)),
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
  (self) => Layer.scoped(PostgresClientService, self)
);

export const pool = pipe(
  getPostgresConfig,
  Effect.map((config) => new Pool(config))
);

export const poolClient = pipe(
  getPostgresPool,
  Effect.flatMap((pool) =>
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
  (self) => Layer.scoped(PostgresClientService, self)
);
