import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS) || 10_000;

neonConfig.fetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> =>
  fetch(input, { ...init, signal: AbortSignal.timeout(DB_QUERY_TIMEOUT_MS) });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
