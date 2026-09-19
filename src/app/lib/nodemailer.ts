import ejs from "ejs";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import config from "../config";

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: config.smtp_user,
		pass: config.smtp_password,
	},
});

export type TSendEmailOptions = {
	to: string;
	subject: string;
	html?: string;
	templateName?: string;
	templateData?: Record<string, unknown>;
};

export const sendEmail = async ({
	to,
	subject,
	html,
	templateName,
	templateData,
}: TSendEmailOptions) => {
	let mailHtml = html;

	if (templateName && templateData) {
		const templatePath = path.join(
			process.cwd(),
			"src",
			"app",
			"templates",
			`${templateName}.ejs`,
		);

		if (fs.existsSync(templatePath)) {
			const templateSource = fs.readFileSync(templatePath, "utf-8");
			mailHtml = ejs.render(templateSource, templateData);
		}
	}

	const mailOptions = {
		from: config.email_sender,
		to,
		subject,
		html: mailHtml || "",
	};

	const info = await transporter.sendMail(mailOptions);
	return info;
};

export default {
	transporter,
	sendEmail,
};
