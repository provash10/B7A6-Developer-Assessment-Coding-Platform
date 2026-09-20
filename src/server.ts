import type { Server } from "http";
import app from "./app.js";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";

let server: Server;

async function main() {
	try {
		await prisma.$connect();
		console.log("Connected to the database successfully.");

		await redisClient.connect();
		console.log("Redis Connected Successfully !!!");

		server = app.listen(config.port, () => {
			console.log(`Server is running on http://localhost:${config.port}`);
		});
	} catch (err) {
		console.error("Failed to start server:", err);
		await prisma.$disconnect();
		if (redisClient.isOpen) {
			await redisClient.disconnect();
		}
		process.exit(1);
	}
}

main();

process.on("unhandledRejection", async (err) => {
	console.error("Unhandled Rejection detected, shutting down server...", err);
	if (redisClient.isOpen) {
		await redisClient.disconnect();
	}
	if (server) {
		server.close(() => {
			process.exit(1);
		});
	} else {
		process.exit(1);
	}
});

process.on("uncaughtException", async (err) => {
	console.error("Uncaught Exception detected, shutting down server...", err);
	if (redisClient.isOpen) {
		await redisClient.disconnect();
	}
	process.exit(1);
});

// export default express application
export default app;
