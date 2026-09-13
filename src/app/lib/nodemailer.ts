import fs from "fs";
import path from "path";
import ejs from "ejs";
import nodemailer from "nodemailer";
import config from "../config";

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: config.email.user,
		pass: config.email.pass,
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
		from: config.email.from,
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
