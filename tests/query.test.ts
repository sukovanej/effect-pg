import { pipe } from '@effect/data/Function';
import * as Config from '@effect/io/Config';
import * as Effect from '@effect/io/Effect';

import * as Pg from '../src';

export const postgresConfig = Config.all({
  host: Config.withDefault(Config.string('POSTGRES_HOST'), 'localhost'),
  port: Config.integer('POSTGRES_PORT'),
  user: Config.string('POSTGRES_USER'),
  password: Config.string('POSTGRES_PASSWORD'),
  database: Config.withDefault(Config.string('POSTGRES_NAME'), 'postgres'),
});

test('Simple test', async () => {
  await pipe(
    Pg.queryRaw('CREATE TABLE users (name TEXT NOT NULL)'),
    Effect.flatMap(() =>
      Pg.queryRaw("INSERT INTO users (name) VALUES ('milan')")
    ),
    Effect.flatMap(() => Pg.queryOne('SELECT * FROM users')),
    Effect.map((row) => {
      expect(row).toEqual({ name: 'milan' });
    }),
    Effect.flatMap(() => Pg.queryArray('SELECT * FROM users')),
    Effect.map((rows) => {
      expect(rows).toEqual([{ name: 'milan' }]);
    }),
    Pg.transactionRollback,
    Effect.provideLayer(Pg.clientLayer),
    Effect.provideServiceEffect(
      Pg.ConfigService,
      Effect.config(postgresConfig)
    ),
    Effect.runPromise
  );
});
