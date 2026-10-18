#!/usr/bin/env node
/**
 * Create the empty database used as Prisma's migrate-diff shadow database.
 * Connects with DATABASE_URL and creates plan2026_shadow on the same server.
 * Does not print the URL.
 */
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const name = "plan2026_shadow";
const client = new Client({ connectionString });
await client.connect();
try {
  const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (found.rowCount === 0) {
    await client.query(`CREATE DATABASE ${name}`);
  }
} finally {
  await client.end();
}
