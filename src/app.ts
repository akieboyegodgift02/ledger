import Fastify from "fastify";
import "dotenv/config";
import postgres from "postgres";

import { transferRoutes } from "./modules/transfer/transfer.route.js";
import { depositRoutes } from "./modules/deposit/deposit.route.js";


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = postgres(process.env.DATABASE_URL);

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  const result = await sql`
    SELECT NOW() AS current_time
  `;

  return {
    status: "ok",
    database: result[0],
  };
});

await app.register(transferRoutes);
await app.register(depositRoutes);


const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "127.0.0.1",
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();