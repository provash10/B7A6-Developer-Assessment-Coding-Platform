import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV,
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,

	backend_url: process.env.BACKEND_URL,
	frontend_url: process.env.FRONTEND_URL,

	bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
	jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
	jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
	jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
	jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,

	google_client_id: process.env.GOOGLE_CLIENT_ID!,

	smtp_user: process.env.SMTP_USER!,
	smtp_password: process.env.SMTP_PASSWORD!,
	email_sender: process.env.EMAIL_SENDER!,

	redis_user: process.env.REDIS_USER || "default",
	redis_password: process.env.REDIS_PASSWORD!,
	redis_host: process.env.REDIS_HOST!,
	redis_port: process.env.REDIS_PORT || "6379",

	cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
	cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
	cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,

	bkash_base_url: process.env.BKASH_BASE_URL!,
	bkash_username: process.env.BKASH_USERNAME!,
	bkash_password: process.env.BKASH_PASSWORD!,
	bkash_app_key: process.env.BKASH_APP_KEY!,
	bkash_app_secret: process.env.BKASH_APP_SECRET!,
	bkash_callback_url: process.env.BKASH_CALLBACK_URL!,

	admin_name: process.env.ADMIN_NAME || "System Admin",
	admin_email: process.env.ADMIN_EMAIL || "admin@100.com",
	admin_password: process.env.ADMIN_PASSWORD || "Password@100",

	recruiter_name: process.env.RECRUITER_NAME || "Jane Recruiter",
	recruiter_email: process.env.RECRUITER_EMAIL || "recruiter@100.com",
	recruiter_password: process.env.RECRUITER_PASSWORD || "Password@100",

	candidate_name: process.env.CANDIDATE_NAME || "John Developer",
	candidate_email: process.env.CANDIDATE_EMAIL || "candidate@100.com",
	candidate_password: process.env.CANDIDATE_PASSWORD || "Password@100",
};
