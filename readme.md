# effect-pg

[node-pg](https://github.com/brianc/node-postgres) wrapper for
[effect](https://github.com/Effect-TS).

**Under development**

## Quickstart

Install the package using

```bash
pnpm install effect-pg
```

The following example assumes you have a postgres running. Setup the environment
variables as follows.

```
$ export POSTGRES_PORT=<PORT>
$ export POSTGRES_USER=<USER>
$ export POSTGRES_PASSWORD=<PASSWORD>
```

Optionally, also set `POSTGRES_HOST` and `POSTGRES_NAME`. The example below will
create a new `users` table, insert a single row and fetch the row. The persisted
row is immediately fetched and logged out.

```typescript
import * as Pg from 'effect-pg';

import { pipe } from '@effect/data/Function';
import * as Config from '@effect/io/Config';
import * as Effect from '@effect/io/Effect';

export const postgresConfig = Config.all({
  host: Config.withDefault(Config.string('POSTGRES_HOST'), 'localhost'),
  port: Config.integer('POSTGRES_PORT'),
  user: Config.string('POSTGRES_USER'),
  password: Config.string('POSTGRES_PASSWORD'),
  database: Config.withDefault(Config.string('POSTGRES_NAME'), 'postgres'),
});

pipe(
  Pg.queryRaw('CREATE TABLE IF NOT EXISTS users (name TEXT NOT NULL)'),
  Effect.flatMap(() =>
    Pg.queryRaw("INSERT INTO users (name) VALUES ('patrik')")
  ),
  Effect.flatMap(() => Pg.queryOne('SELECT * FROM users')),
  Effect.flatMap((result) => Effect.log(`User: ${JSON.stringify(result)}`)),
  Effect.provideLayer(Pg.clientLayer),
  Effect.provideServiceEffect(Pg.ConfigService, Effect.config(postgresConfig)),
  Effect.runPromise
);
```
