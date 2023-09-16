# effect-pg

[node-pg](https://github.com/brianc/node-postgres) wrapper for
[effect](https://github.com/Effect-TS).

**Under development**

## Quickstart

Install the package using

```bash
pnpm install effect-pg effect
```

The following example assumes you have a postgres running. Setup the environment
variables as follows.

```
$ export POSTGRES_USER=<USER>
$ export POSTGRES_PASSWORD=<PASSWORD>
$ export POSTGRES_DATABASE=<PASSWORD>
```

Optionally, also set `POSTGRES_HOST` and `POSTGRES_NAME`. The example below will
create a new `users` table, insert a single row and fetch the row. The persisted
row is immediately fetched and logged out.

```typescript
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
```

## Contributing

### Local development

Spawn a postgres instance.

```bash
$ docker run -d -p 5432:5432 --name test-postgres -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test postgres
```

Create a `.env` file.

```bash
TEST_POSTGRES_USER=test
TEST_POSTGRES_DATABASE=test
TEST_POSTGRES_PASSWORD=test
```

Run tests.

```bash
pnpm test
```
