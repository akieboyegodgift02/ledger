import Fastify, {type FastifyError } from "fastify";
import "dotenv/config";
import postgres from "postgres";
import fastifyJwt from "@fastify/jwt";

// Error Handlers
import { EmailAlreadyExistsError } from "./errors/email-already-exists-error.js";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error.js";
import { WalletOwnershipError } from "./errors/wallet-ownership-error.js";

// Routes
import { authRoutes } from "./modules/auth/auth.route.js"
import { transferRoutes } from "./modules/api/transfer/transfer.route.js";
import { depositRoutes } from "./modules/api/deposit/deposit.route.js";
import { InsufficientBalanceError } from "./errors/insufficient-balance-error.js";


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = postgres(process.env.DATABASE_URL);

const app = Fastify({
  logger: true,
});

if(!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
};

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

  if (error instanceof EmailAlreadyExistsError) {
    return reply.status(409).send({
      statusCode: 409,
      error: "Conflict",
      message: error.message,
    })
  }

  if (error instanceof InvalidCredentialsError) {
    return reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: error.message,
    })
  }

  if (error instanceof WalletOwnershipError) {
    return reply.status(403).send({
      statusCode: 403,
      error: "Forbidden",
      message: error.message,
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

await app.register(authRoutes);
await app.register(transferRoutes);
await app.register(depositRoutes);

await app.register(fastifyJwt,{
  secret: process.env.JWT_SECRET,
});

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