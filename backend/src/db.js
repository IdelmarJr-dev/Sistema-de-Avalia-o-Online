import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definido. Copie .env.example para .env e configure.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
