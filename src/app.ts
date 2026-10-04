import Fastify, {type FastifyError } from "fastify";
import "dotenv/config";
import postgres from "postgres";

import { transferRoutes } from "./modules/transfer/transfer.route.js";
import { depositRoutes } from "./modules/deposit/deposit.route.js";
import { InsufficientBalanceError } from "./errors/insufficient-balance-error.js";


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = postgres(process.env.DATABASE_URL);

const app = Fastify({
  logger: true,
});

app.addHook("onRequest", async (request)=>{
  request.log.info({
    method: request.method,
    url: request.url,
  }, "Incoming request")
})

app.setErrorHandler((error: FastifyError, request, reply)=>{
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Invalid request",
    });
  }


  if (error instanceof InsufficientBalanceError) {
    return reply.status(409).send({
      statusCode: 409,
      error: "Conflict",
      message: error.message

    });
  }
  
  request.log.error(error);

  return reply.status(500).send({
    statusCode: 500,
    error: "Internal Server Error",
    message: "Internal server error",
  });

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