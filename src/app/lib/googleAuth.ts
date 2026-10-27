import { OAuth2Client } from "google-auth-library";
import config from "../config.js";

export const googleClient = new OAuth2Client({
	clientId: config.google_client_id,
});

export default googleClient;
