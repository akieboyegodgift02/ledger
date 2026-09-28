import Fastify from "fastify";

const app = Fastify({
    logger: true 
});

app.get("/health", async() => {
    console.log("Health check endpoint called");
    return { status: "ok" }
});

const start = async () => {
    try {
        await app.listen({ port: 3000, host: "127.0.0.1" });
    } catch (err) {
        throw new Error(`Error starting server: ${err}`);
    }
}

start();