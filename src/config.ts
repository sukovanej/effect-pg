import * as Context from '@effect/data/Context';
import { pipe } from '@effect/data/Function';
import * as Config from '@effect/io/Config';
import * as Effect from '@effect/io/Effect';
import * as Layer from '@effect/io/Layer';

import { ClientConfig, PoolConfig } from './services';

interface ConfigOptions {
  namePrefix: string;
  defaultHost?: string;
  defaultPort?: number;
  defaultUser?: string;
  defaultPassword?: string;
  defaultDatabase?: string;
}

const defaultOptions: ConfigOptions = {
  namePrefix: 'POSTGRES',
  defaultPort: 5432,
  defaultHost: 'localhost',
};

const withDefault =
  <A>(defaultValue: A | undefined) =>
  (c: Config.Config<A>) => {
    if (defaultValue === undefined) {
      return c;
    }

    return pipe(c, Config.withDefault(defaultValue));
  };

export const _config = (options?: Partial<ConfigOptions>) => {
  const { namePrefix, ...defaults } = { ...defaultOptions, ...options };

  return Config.all({
    host: Config.string(`${namePrefix}_HOST`).pipe(
      withDefault(defaults.defaultHost)
    ),
    port: Config.integer(`${namePrefix}_PORT`).pipe(
      withDefault(defaults.defaultPort)
    ),
    user: Config.string(`${namePrefix}_USER`).pipe(
      withDefault(defaults.defaultUser)
    ),
    password: Config.string(`${namePrefix}_PASSWORD`).pipe(
      withDefault(defaults.defaultPassword)
    ),
    database: Config.string(`${namePrefix}_DATABASE`).pipe(
      withDefault(defaults.defaultDatabase)
    ),
  });
};

export const config = (options?: Partial<ConfigOptions>) =>
  pipe(
    Effect.config(_config(options)),
    Effect.map((config) =>
      pipe(Context.make(PoolConfig, config), Context.add(ClientConfig, config))
    ),
    Layer.effectContext
  );

export { _config as Config };
