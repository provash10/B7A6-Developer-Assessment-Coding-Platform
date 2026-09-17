import type { Server } from "http";
import app from "./app";
import config from "./app/config";

let server: Server;

async function main() {
	try {
		server = app.listen(config.port, () => {
			console.log(`Server is running on http://localhost:${config.port}`);
		});
	} catch (err) {
		console.error("Failed to start server:", err);
	}
}

main();

process.on("unhandledRejection", (err) => {
	// console.log("Unhandled Rejection detected, shutting down server...", err);
	if (server) {
		server.close(() => {
			process.exit(1);
		});
	} else {
		process.exit(1);
	}
});

process.on("uncaughtException", (err) => {
	// console.log("Uncaught Exception detected, shutting down server...", err);
	process.exit(1);
});
