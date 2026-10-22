import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables.");
}

const client = postgres(connectionString, {
  max: 10,
  prepare: false,
});

export const db = drizzle(client);