import type { FastifyInstance } from "fastify";

import { authenticate } from "../../auth/auth.hook.js";
import { getUserWallets, getUserWallet } from "./wallet.service.js";

type AuthUser = {
  sub: string;
  email: string;
};

export async function walletRoutes(app: FastifyInstance) {
  app.get(
    "/wallets",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const user = request.user as AuthUser;

      const wallets = await getUserWallets(
        Number(user.sub),
      );

      return reply.code(200).send({
        wallets,
      });
    },
  );

  app.get(
    "/wallets/:walletId",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      const user = request.user as AuthUser;

      const { walletId } = request.params as {
        walletId: string;
      };

      const wallet = await getUserWallet(
        Number(user.sub),
        Number(walletId),
      );

      return reply.code(200).send({
        wallet,
      });
    },
  );
}