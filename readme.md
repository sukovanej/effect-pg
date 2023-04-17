# effect-pg

[node-pg](https://github.com/brianc/node-postgres) wrapper for
[effect](https://github.com/Effect-TS).

**Under development**

## Quickstart

Install the package using

```bash
pnpm install effect-pg
```

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
