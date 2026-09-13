import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	env: process.env.NODE_ENV || "development",
	port: process.env.PORT || 5000,
	jwt: {
		jwt_secret: process.env.JWT_SECRET || "verysecretkey",
		expires_in: process.env.JWT_EXPIRES_IN || "7d",
		refresh_token_secret:
			process.env.REFRESH_TOKEN_SECRET || "verysecretrefreshkey",
		refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
	},
};
