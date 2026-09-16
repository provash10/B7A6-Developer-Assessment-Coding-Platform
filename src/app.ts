import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import { AuthRoutes } from "./app/modules/auth/auth.route";
import { UserRoutes } from "./app/modules/user/user.route";
import router from "./app/routes";

const app: Application = express();

// Parsers
app.use(cors());
app.use(cookieParser());
// Middleware to parse JSON bodies
app.use(express.json());
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Application Routes
app.use("/api/v1", router);

// Basic route
app.get("/", (_req: Request, res: Response) => {
	res.send({
		message: "Developer Assessment Coding Platform API Server is Running!",
	});
});

//Routes
app.use("api/users", UserRoutes);
app.use("api/users", AuthRoutes);

// Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
