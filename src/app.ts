import Fastify from "fastify";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);


const app = Fastify({
    logger: true 
});

app.get("/health", async() => {
    const result = await sql`SELECT 1 AS connected`;

    return { 
        status: "ok",
        database: result[0],
    }
});

const start = async () => {
    try {
        await app.listen({ port: 3000, host: "127.0.0.1" });
    } catch (err) {
        throw new Error(`Error starting server: ${err}`);
    }
}

start();