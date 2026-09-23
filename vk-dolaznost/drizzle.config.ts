import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { bazaKonfig } from "./src/db/konfig";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: bazaKonfig(),
});
