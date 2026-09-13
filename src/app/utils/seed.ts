import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function seed() {
	try {
		console.log("🌱 Seeding initial database records...");

		const adminPassword = await bcrypt.hash("Admin123!", 10);
		const recruiterPassword = await bcrypt.hash("Recruiter123!", 10);
		const candidatePassword = await bcrypt.hash("Candidate123!", 10);

		// 1. Seed Admin User
		const adminUser = await prisma.user.upsert({
			where: { email: "admin@assessment.com" },
			update: {},
			create: {
				email: "admin@assessment.com",
				passwordHash: adminPassword,
				name: "System Admin",
				phone: "+8801700000000",
				role: "ADMIN",
			},
		});
		console.log(`✅ Admin User Seeded: ${adminUser.email}`);

		// 2. Seed Recruiter User & Profile
		const recruiterUser = await prisma.user.upsert({
			where: { email: "recruiter@techcorp.com" },
			update: {},
			create: {
				email: "recruiter@techcorp.com",
				passwordHash: recruiterPassword,
				name: "Jane Recruiter",
				phone: "+8801711111111",
				role: "RECRUITER",
				recruiterProfile: {
					create: {
						companyName: "Tech Corp Ltd",
						companyWebsite: "https://techcorp.example.com",
						credits: 100,
					},
				},
			},
			include: {
				recruiterProfile: true,
			},
		});
		console.log(`✅ Recruiter User & Profile Seeded: ${recruiterUser.email}`);

		// 3. Seed Candidate User & Profile
		const candidateUser = await prisma.user.upsert({
			where: { email: "candidate@dev.com" },
			update: {},
			create: {
				email: "candidate@dev.com",
				passwordHash: candidatePassword,
				name: "John Developer",
				phone: "+8801722222222",
				role: "CANDIDATE",
				candidateProfile: {
					create: {
						skills: ["TypeScript", "Node.js", "Express", "Prisma", "PostgreSQL"],
						experienceYears: 3,
						resumeUrl: "https://example.com/resumes/john-dev.pdf",
					},
				},
			},
			include: {
				candidateProfile: true,
			},
		});
		console.log(`✅ Candidate User & Profile Seeded: ${candidateUser.email}`);

		// 4. Seed Sample Questions
		const mcqQuestion = await prisma.question.create({
			data: {
				title: "Prisma Multi-File Schema Support",
				description: "Which Prisma configuration file feature allows organizing schemas across multiple files?",
				type: "MCQ",
				difficulty: "EASY",
				marks: 20,
				options: [
					"prisma.config.ts with schema folder path",
					"schema.json",
					"prisma.multi.config",
					"db.prisma",
				],
			},
		});

		const codingQuestion = await prisma.question.create({
			data: {
				title: "Implement Global Error Handler",
				description: "Write an Express error handler that converts Zod validation errors to standardized JSON output.",
				type: "CODING",
				difficulty: "MEDIUM",
				marks: 80,
				testCases: [
					{ input: "{ email: 'invalid' }", expectedOutput: "status 400 with errorSources" },
				],
			},
		});

		console.log("✅ Sample Questions Seeded.");

		// 5. Seed Sample Assessment (if recruiter profile exists)
		if (recruiterUser.recruiterProfile) {
			const sampleAssessment = await prisma.assessment.create({
				data: {
					recruiterId: recruiterUser.recruiterProfile.id,
					title: "Full-Stack Node.js & Prisma Developer Assessment",
					description: "Comprehensive technical assessment evaluating Express, TypeScript, and Prisma ORM skills.",
					durationMinutes: 60,
					passMarks: 60,
					totalMarks: 100,
					status: "PUBLISHED",
					assessmentQuestions: {
						create: [
							{ questionId: mcqQuestion.id, orderIndex: 1 },
							{ questionId: codingQuestion.id, orderIndex: 2 },
						],
					},
				},
			});
			console.log(`✅ Sample Assessment Seeded: ${sampleAssessment.title}`);
		}

		console.log("🎉 Database Seeding Completed Successfully!");
	} catch (error) {
		console.error("❌ Database Seeding Failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

seed();
