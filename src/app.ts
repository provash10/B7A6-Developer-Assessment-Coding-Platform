import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import router from "./app/routes";

const app: Application = express();

// Parsers
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application Routes
app.use("/api/v1", router);

// Root Route
app.get("/", (_req: Request, res: Response) => {
	res.send({
		message: "Developer Assessment Coding Platform API Server is Running!",
	});
});

// Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
