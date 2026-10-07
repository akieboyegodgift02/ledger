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

      const result = await createTransfer(
        Number(user.sub),
        Number(body.fromWalletId),
        Number(body.toWalletId),
        BigInt(body.amount),
      );

      return reply.code(201).send(result);
    },
  );
}