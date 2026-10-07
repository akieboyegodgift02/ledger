import type { FastifyInstance } from 'fastify';
import { createDeposit  } from './deposit.service.js'

export async function depositRoutes(app: FastifyInstance) {
    app.post('/deposits', async (request, reply) => {

        const body = request.body as {
            walletId: number;
            amount: string;
        }

        const result = await createDeposit(
            String(body.walletId),
            BigInt(body.amount),
        );

        return reply.code(201).send(result)
    })

}