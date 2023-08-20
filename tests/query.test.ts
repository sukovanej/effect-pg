import * as pg from 'pg';

import * as Either from '@effect/data/Either';
import { pipe } from '@effect/data/Function';
import * as RA from '@effect/data/ReadonlyArray';
import * as Config from '@effect/io/Config';
import * as Effect from '@effect/io/Effect';
import * as Pg from 'effect-pg';

export const postgresConfig = Config.all({
  host: Config.withDefault(Config.string('POSTGRES_HOST'), 'localhost'),
  port: Config.integer('POSTGRES_PORT'),
  user: Config.string('POSTGRES_USER'),
  password: Config.string('POSTGRES_PASSWORD'),
  database: Config.withDefault(Config.string('POSTGRES_NAME'), 'postgres'),
});

const run = (self: Effect.Effect<pg.ClientBase, unknown, unknown>) =>
  pipe(
    self,
    Pg.transactionRollback,
    Effect.provideLayer(Pg.clientLayer),
    Effect.provideServiceEffect(Pg.Config, Effect.config(postgresConfig))
  );

test('Simple test 1', async () => {
  await pipe(
    Pg.queryRaw('CREATE TABLE users (name TEXT NOT NULL)'),
    Effect.flatMap(() =>
      Pg.queryRaw("INSERT INTO users (name) VALUES ('milan')")
    ),
    Effect.flatMap(() => Pg.queryOne('SELECT * FROM users')),
    Effect.flatMap((row) =>
      Effect.sync(() => {
        expect(row).toEqual({ name: 'milan' });
      })
    ),
    Effect.flatMap(() => Pg.queryArray('SELECT * FROM users')),
    Effect.map((rows) => {
      expect(rows).toEqual([{ name: 'milan' }]);
    }),
    run,
    Effect.runPromise
  );
});

test('Simple test 2', async () => {
  const result = await pipe(
    Pg.queryRaw('CREATE TABLE users (name TEXT NOT NULL)'),
    Effect.flatMap(() =>
      Effect.all(
        RA.replicate(
          Pg.queryRaw("INSERT INTO users (name) VALUES ('milan')"),
          3
        )
      )
    ),
    Effect.flatMap(() => Pg.queryOne('SELECT * FROM users')),
    run,
    Effect.either,
    Effect.runPromise
  );

  expect(result).toEqual(
    Either.left({
      _tag: 'PostgresUnexpectedNumberOfRowsError',
      expected: 1,
      actual: 3,
    })
  );
});

test('Table doesnt exist error', async () => {
  await pipe(
    Pg.queryRaw('SELECT * FROM users'),
    Effect.map(() => {
      assert.fail('Expected failure');
    }),
    Effect.catchAll((error) => {
      expect(error._tag).toEqual('PostgresTableDoesntExistError');
      return Effect.unit;
    }),
    run,
    Effect.runPromise
  );
});

test('Duplicate table error', async () => {
  await pipe(
    Pg.queryRaw('CREATE TABLE users (name TEXT NOT NULL)'),
    Effect.flatMap(() =>
      Pg.queryRaw('CREATE TABLE users (name TEXT NOT NULL)')
    ),
    Effect.map(() => {
      assert.fail('Expected failure');
    }),
    Effect.catchAll((error) => {
      expect(error._tag).toEqual('PostgresDuplicateTableError');
      return Effect.unit;
    }),
    run,
    Effect.runPromise
  );
});

test('Pool', async () => {
  await pipe(
    Pg.queryRaw('CREATE TABLE users (name TEXT NOT NULL)'),
    Effect.flatMap(() =>
      Pg.queryRaw('CREATE TABLE users (name TEXT NOT NULL)')
    ),
    Effect.map(() => {
      assert.fail('Expected failure');
    }),
    Effect.catchAll((error) => {
      expect(error._tag).toEqual('PostgresDuplicateTableError');
      return Effect.unit;
    }),
    Pg.transactionRollback,
    Effect.provideLayer(Pg.poolClientLayer),
    Effect.provideLayer(Pg.poolLayer),
    Effect.provideServiceEffect(Pg.Config, Effect.config(postgresConfig)),
    Effect.runPromise
  );
});
