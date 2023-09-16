import * as pg from 'pg';

import * as Chunk from '@effect/data/Chunk';
import * as Either from '@effect/data/Either';
import { pipe } from '@effect/data/Function';
import * as ReadonlyArray from '@effect/data/ReadonlyArray';
import * as RA from '@effect/data/ReadonlyArray';
import * as Effect from '@effect/io/Effect';
import * as Schema from '@effect/schema/Schema';
import * as Stream from '@effect/stream/Stream';
import DotEnv from 'effect-dotenv';
import Pg from 'effect-pg';

export const setTestConfig = Pg.setConfig({ namePrefix: 'TEST_POSTGRES' });

const runTest = <E, A>(self: Effect.Effect<pg.ClientBase, E, A>) =>
  pipe(
    self,
    Pg.transactionRollback,
    Effect.provideLayer(Pg.client),
    Effect.provideLayer(setTestConfig),
    Effect.provideSomeLayer(DotEnv.setConfigProvider()),
    Effect.runPromise
  );

const User = Schema.struct({ id: Schema.number, name: Schema.string });

const createUsersTable = Pg.query(
  'CREATE TABLE users (id SERIAL, name TEXT NOT NULL)'
);
const insertUser = Pg.query('INSERT INTO users (name) VALUES ($1::TEXT)', User);
const selectUser = Pg.queryOne('SELECT * FROM users', User);
const selectUsers = Pg.query('SELECT * FROM users', User);

test('Simple test 1', async () => {
  await pipe(
    createUsersTable(),
    Effect.flatMap(() => insertUser('milan')),
    Effect.flatMap(() => selectUser()),
    Effect.flatMap((row) =>
      Effect.sync(() => {
        expect(row.name).toEqual('milan');
      })
    ),
    Effect.flatMap(() => selectUsers()),
    Effect.map((rows) => {
      expect(rows.map((user) => user.name)).toEqual(['milan']);
    }),
    runTest
  );
});

test('Simple test 2', async () => {
  const result = await pipe(
    createUsersTable(),
    Effect.flatMap(() => Effect.all(RA.replicate(insertUser('milan'), 3))),
    Effect.flatMap(() => selectUser()),
    Effect.either,
    runTest
  );

  expect(result).toEqual(
    Either.left({
      _tag: 'PostgresUnexpectedNumberOfRowsError',
      expectedRows: 1,
      receivedRows: 3,
    })
  );
});

test('Table doesnt exist error', async () => {
  await pipe(
    selectUsers(),
    Effect.map(() => {
      assert.fail('Expected failure');
    }),
    Effect.catchAll((error) => {
      expect(error._tag).toEqual('PostgresTableDoesntExistError');
      return Effect.unit;
    }),
    runTest
  );
});

test('Duplicate table error', async () => {
  await pipe(
    createUsersTable(),
    Effect.flatMap(() => createUsersTable()),
    Effect.map(() => {
      assert.fail('Expected failure');
    }),
    Effect.catchAll((error) => {
      expect(error._tag).toEqual('PostgresDuplicateTableError');
      return Effect.unit;
    }),
    runTest
  );
});

test('Pool', async () => {
  await pipe(
    createUsersTable(),
    Effect.flatMap(() => createUsersTable()),
    Effect.map(() => {
      assert.fail('Expected failure');
    }),
    Effect.catchAll((error) => {
      expect(error._tag).toEqual('PostgresDuplicateTableError');
      return Effect.unit;
    }),
    Pg.transactionRollback,
    Effect.provideLayer(Pg.poolClient),
    Effect.provideLayer(Pg.pool),
    Effect.provideLayer(setTestConfig),
    Effect.provideSomeLayer(DotEnv.setConfigProvider()),
    Effect.runPromise
  );
});

describe('streaming', () => {
  test('sequence', async () => {
    const queryNumSequence = Pg.queryStream(
      'SELECT * FROM generate_series(1, $1) n',
      Schema.struct({ n: Schema.number })
    );

    const result = await pipe(
      queryNumSequence(10),
      Stream.map(({ n }) => n),
      Stream.runCollect,
      runTest
    );

    expect(Chunk.toReadonlyArray(result)).toEqual(ReadonlyArray.range(1, 10));
  });
});
