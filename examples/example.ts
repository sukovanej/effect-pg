import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { PgLayer, PgQuery } from "effect-pg"

const User = Schema.struct({ name: Schema.string })

const createUsersTable = PgQuery.all(
  "CREATE TABLE IF NOT EXISTS users (name TEXT NOT NULL)"
)
const insertUser = PgQuery.all("INSERT INTO users (name) VALUES ($1)")
const selectUser = PgQuery.one("SELECT * FROM users", User)

pipe(
  createUsersTable(),
  Effect.flatMap(() => insertUser("patrik")),
  Effect.flatMap(() => selectUser()),
  Effect.flatMap((result) => Effect.log(`User: ${JSON.stringify(result)}`)),
  Effect.provide(PgLayer.Client),
  Effect.provide(PgLayer.setConfig()),
  Effect.runPromise
)
