import type { FastifyInstance } from "fastify";
import { registerUser, loginUser } from "./auth.service.js";
import { authenticate } from "./auth.hook.js";

export async function authRoutes(app: FastifyInstance) {
    app.post(
        "/auth/register",
        {
        schema: {
            body: {
            type: "object",
            required: ["email", "name", "password"],
            properties: {
                email: { type: "string", minLength: 3 },
                name: { type: "string", minLength: 1 },
                password: { type: "string", minLength: 8 },
            },
            },
        },
        },
        async (request, reply) => {
        const body = request.body as {
            email: string;
            name: string;
            password: string;
        };

        const user = await registerUser(
            body.email,
            body.name,
            body.password,
        );

        return reply.code(201).send(user);
        },
    );

    app.post(
    "/auth/login",
    {
        schema: {
        body: {
            type: "object",
            required: ["email", "password"],
            properties: {
            email: { type: "string", minLength: 3 },
            password: { type: "string", minLength: 8 },
            },
        },
        },
    },
    async (request, reply) => {
            const body = request.body as {
            email: string;
            password: string;
        };

        const user = await loginUser(
            body.email,
            body.password,
        );

        const token = await app.jwt.sign({
            sub: String(user.id),
            email: user.email,
        })

        return reply.code(200).send({user, token});
        },
    );

    app.get(
        "/auth/me", {
            preHandler: authenticate,
        },
        async (request, reply) => {
            return reply.code(200).send({
                user: request.user,
            })
        }
    )
}