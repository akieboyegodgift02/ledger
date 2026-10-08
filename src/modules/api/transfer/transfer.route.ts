import type { FastifyInstance } from "fastify";

import { createTransfer } from "./transfer.service.js";
import { authenticate } from "../../auth/auth.hook.js";

type AuthUser = {
  sub: string;
  email: string;
};

export async function transferRoutes(app: FastifyInstance) {
  app.post(
    "/transfers",
    {
      preHandler: authenticate,
      schema: {
        headers: {
          type: "object",
          required: ["idempotency-key"],
          properties: {
            "idempotency-key": {
              type: "string",
              minLength: 1,
            },
          },
        },

        body: {
          type: "object",
          required: ["fromWalletId", "toWalletId", "amount"],
          properties: {
            fromWalletId: { type: "integer" },
            toWalletId: { type: "integer" },
            amount: { type: "string" },
          },
        },
      },
    },

    async (request, reply) => {
      const body = request.body as {
        fromWalletId: number;
        toWalletId: number;
        amount: string;
      };

      const user = request.user as AuthUser;

      const idempotencyKey = request.headers["idempotency-key"] as string;

      const result = await createTransfer(
        Number(user.sub),
        Number(body.fromWalletId),
        Number(body.toWalletId),
        BigInt(body.amount),
        idempotencyKey,
      );

      return reply.code(201).send(result);
    },
  );
}