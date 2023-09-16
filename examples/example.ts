import * as Schema from '@effect/schema/Schema';
import { Effect, pipe } from 'effect';
import { Pg } from 'effect-pg';

const User = Schema.struct({ name: Schema.string });

const createUsersTable = Pg.query(
  'CREATE TABLE IF NOT EXISTS users (name TEXT NOT NULL)'
);
const insertUser = Pg.query('INSERT INTO users (name) VALUES ($1)');
const selectUser = Pg.queryOne('SELECT * FROM users', User);

pipe(
  createUsersTable(),
  Effect.flatMap(() => insertUser('patrik')),
  Effect.flatMap(() => selectUser()),
  Effect.flatMap((result) => Effect.log(`User: ${JSON.stringify(result)}`)),
  Effect.provideLayer(Pg.client),
  Effect.provideLayer(Pg.setConfig()),
  Effect.runPromise
);
