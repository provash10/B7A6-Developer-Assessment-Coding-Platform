import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AssessmentRoutes } from "./app/modules/assessment/assessment.route";
import { AttemptRoutes } from "./app/modules/attempt/attempt.route";
import { AuthRoutes } from "./app/modules/auth/auth.route";
import { InvitationRoutes } from "./app/modules/invitation/invitation.route";
import { PaymentRoutes } from "./app/modules/payment/payment.route";
import { QuestionRoutes } from "./app/modules/question/question.route";
import { UserRoutes } from "./app/modules/user/user.route";

const app: Application = express();

// console.log("initializing express application setup");

// cors middleware configuration
app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// enable url-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// middleware to parse json bodies
app.use(express.json());
app.use(cookieParser());

// application module routes mounted directly
// console.log("mounting application routes directly");
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/questions", QuestionRoutes);
app.use("/api/v1/assessments", AssessmentRoutes);
app.use("/api/v1/invitations", InvitationRoutes);
app.use("/api/v1/attempts", AttemptRoutes);
app.use("/api/v1/payments", PaymentRoutes);

// root route
app.get("/", async (_req: Request, res: Response) => {
	// console.log("root endpoint hit");
	res.status(200).json({
		success: true,
		message: "Welcome to Developer Assessment Coding Platform Backend",
	});
});

// global error handler and not found handler
app.use(globalErrorHandler);
app.use(notFound);

export default app;
