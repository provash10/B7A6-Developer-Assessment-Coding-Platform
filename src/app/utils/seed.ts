import bcrypt from "bcryptjs";
import config from "../config.js";
import { prisma } from "../lib/prisma.js";

const sampleQuestions = [
	{
		title: "Two Sum Problem",
		description:
			"Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
		type: "CODING" as const,
		difficulty: "EASY" as const,
		marks: 20,
		testCases: [
			{ input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]", isHidden: false },
			{ input: "[3, 2, 4], 6", expectedOutput: "[1, 2]", isHidden: false },
			{ input: "[3, 3], 6", expectedOutput: "[0, 1]", isHidden: true },
		],
	},
	{
		title: "Valid Palindrome String",
		description:
			"A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Return true if it is a palindrome, or false otherwise.",
		type: "CODING" as const,
		difficulty: "EASY" as const,
		marks: 20,
		testCases: [
			{ input: '"racecar"', expectedOutput: "true", isHidden: false },
			{ input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false },
			{ input: '"race a car"', expectedOutput: "false", isHidden: false },
		],
	},
	{
		title: "Reverse a String",
		description:
			"Write a function that reverses a given string. The input string is given as a sequence of characters. Return the reversed string with exact casing preserved.",
		type: "CODING" as const,
		difficulty: "EASY" as const,
		marks: 15,
		testCases: [
			{ input: '"hello"', expectedOutput: '"olleh"', isHidden: false },
			{ input: '"OpenAI"', expectedOutput: '"IAnepO"', isHidden: false },
		],
	},
	{
		title: "FizzBuzz Number Evaluator",
		description:
			'Given an integer n, return "FizzBuzz" if n is divisible by 3 and 5, "Fizz" if n is divisible by 3, "Buzz" if n is divisible by 5, or return the number as a string if none apply.',
		type: "CODING" as const,
		difficulty: "EASY" as const,
		marks: 20,
		testCases: [
			{ input: "15", expectedOutput: '"FizzBuzz"', isHidden: false },
			{ input: "9", expectedOutput: '"Fizz"', isHidden: false },
			{ input: "10", expectedOutput: '"Buzz"', isHidden: false },
			{ input: "7", expectedOutput: '"7"', isHidden: false },
		],
	},
	{
		title: "Maximum Subarray Sum (Kadane's Algorithm)",
		description:
			"Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
		type: "CODING" as const,
		difficulty: "MEDIUM" as const,
		marks: 25,
		testCases: [
			{ input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", expectedOutput: "6", isHidden: false },
			{ input: "[1]", expectedOutput: "1", isHidden: false },
			{ input: "[5, 4, -1, 7, 8]", expectedOutput: "23", isHidden: false },
		],
	},
];

async function seed() {
	try {
		console.log("🌱 Seeding initial database records...");

		const adminPassword = await bcrypt.hash(config.admin_password, 10);
		const recruiterPassword = await bcrypt.hash(config.recruiter_password, 10);
		const candidatePassword = await bcrypt.hash(config.candidate_password, 10);

		// seed admin user
		const adminUser = await prisma.user.upsert({
			where: { email: config.admin_email },
			update: { passwordHash: adminPassword },
			create: {
				email: config.admin_email,
				passwordHash: adminPassword,
				name: config.admin_name,
				phone: "+8801700000000",
				role: "ADMIN",
			},
		});
		console.log(`✅ Admin User Seeded: ${adminUser.email}`);

		// seed recruiter user and profile
		const recruiterUser = await prisma.user.upsert({
			where: { email: config.recruiter_email },
			update: { passwordHash: recruiterPassword },
			create: {
				email: config.recruiter_email,
				passwordHash: recruiterPassword,
				name: config.recruiter_name,
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

		// seed candidate user and profile
		const candidateUser = await prisma.user.upsert({
			where: { email: config.candidate_email },
			update: { passwordHash: candidatePassword },
			create: {
				email: config.candidate_email,
				passwordHash: candidatePassword,
				name: config.candidate_name,
				phone: "+8801722222222",
				role: "CANDIDATE",
				candidateProfile: {
					create: {
						skills: [
							"TypeScript",
							"Node.js",
							"Express",
							"Prisma",
							"PostgreSQL",
						],
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

		// seed sample questions
		const seededQuestions = [];
		for (const q of sampleQuestions) {
			let questionRecord = await prisma.question.findFirst({
				where: { title: q.title },
			});
			if (!questionRecord) {
				questionRecord = await prisma.question.create({
					data: q,
				});
			}
			seededQuestions.push(questionRecord);
		}
		console.log("✅ 5 Sample Coding Questions Seeded.");

		// seed sample assessment
		if (recruiterUser.recruiterProfile) {
			let sampleAssessment = await prisma.assessment.findFirst({
				where: { title: "Full-Stack Developer Coding Assessment" },
			});

			if (!sampleAssessment) {
				sampleAssessment = await prisma.assessment.create({
					data: {
						recruiterId: recruiterUser.recruiterProfile.id,
						title: "Full-Stack Developer Coding Assessment",
						description:
							"Comprehensive technical assessment evaluating data structures, algorithms, and JavaScript/TypeScript problem-solving skills.",
						durationMinutes: 90,
						passMarks: 70,
						totalMarks: 100,
						status: "PUBLISHED",
						assessmentQuestions: {
							create: seededQuestions.map((q, idx) => ({
								questionId: q.id,
								orderIndex: idx + 1,
							})),
						},
					},
				});
				console.log(`✅ Sample Assessment Seeded: ${sampleAssessment.title}`);
			}
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
