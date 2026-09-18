import config from "../../config";
import { getBkashAuthHeaders, getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
	IExecutePaymentResponse,
	IInitiatePaymentResponse,
	IPaymentFilterParams,
} from "./payment.interface";

/**
 * Step 1: getBkashToken
 * Retrieves a valid authentication id_token from bKash.
 */
export const getBkashToken = async (): Promise<string> => {
	const token = await getBkashIdToken();
	return token;
};

/**
 * Step 2: initiatePayment
 * Initiates bKash payment session for buying recruiter assessment credits.
 * Calculates cost (1 credit = 5 BDT) and saves a PENDING PaymentTransaction record.
 */
export const initiatePayment = async (
	userId: string,
	credits: number,
): Promise<IInitiatePaymentResponse> => {
	// verify user has a recruiter profile
	const recruiterProfile = await prisma.recruiterProfile.findUnique({
		where: { userId },
		include: {
			user: {
				select: {
					email: true,
					name: true,
				},
			},
		},
	});

	if (!recruiterProfile) {
		throw new AppError(
			404,
			"Recruiter profile not found. Only recruiters can purchase assessment credits.",
		);
	}

	// 1 Credit = 5 BDT
	const pricePerCredit = 5;
	const amount = credits * pricePerCredit;

	// fetch authorized bKash headers
	const headers = await getBkashAuthHeaders();

	const merchantInvoiceNumber = `INV-${Date.now()}`;
	const payerReference =
		recruiterProfile.user.email || recruiterProfile.companyName || "recruiter";

	// request bKash checkout/create endpoint
	const createResponse = await fetch(
		`${config.bkash.base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				mode: "0011",
				payerReference,
				callbackURL: config.bkash.callback_url,
				amount: amount.toString(),
				currency: "BDT",
				intent: "sale",
				merchantInvoiceNumber,
			}),
		},
	);

	if (!createResponse.ok) {
		const errorText = await createResponse.text();
		throw new AppError(
			500,
			`Failed to communicate with bKash: ${createResponse.status} ${errorText}`,
		);
	}

	const createResult = (await createResponse.json()) as {
		statusCode?: string;
		statusMessage?: string;
		paymentID?: string;
		bkashURL?: string;
		customerMsisdn?: string;
		merchantInvoiceNumber?: string;
	};

	if (
		createResult.statusCode !== "0000" ||
		!createResult.paymentID ||
		!createResult.bkashURL
	) {
		throw new AppError(
			500,
			createResult.statusMessage || "bKash Payment Initiation Failed",
		);
	}

	// persist pending transaction into database
	const paymentTransaction = await prisma.paymentTransaction.create({
		data: {
			userId,
			amount,
			currency: "BDT",
			provider: "BKASH",
			transactionId: createResult.paymentID,
			status: "PENDING",
			paymentDetails: {
				credits,
				merchantInvoiceNumber,
				payerReference,
				bkashPaymentId: createResult.paymentID,
				createResult,
			},
		},
	});

	return {
		transactionId: paymentTransaction.transactionId,
		paymentUrl: createResult.bkashURL,
		amount,
		currency: "BDT",
		credits,
		status: paymentTransaction.status,
	};
};

/**
 * Step 3: executePayment / handleCallback
 * Handles bKash payment verification, final execution, and credit allocation.
 */
export const executePayment = async (
	paymentId: string,
	status: string,
): Promise<IExecutePaymentResponse> => {
	if (!paymentId) {
		throw new AppError(400, "bKash Payment ID is missing from callback.");
	}

	// fetch transaction from database
	const transaction = await prisma.paymentTransaction.findUnique({
		where: { transactionId: paymentId },
	});

	if (!transaction) {
		throw new AppError(404, "Payment transaction record not found.");
	}

	// handle idempotent call if already processed
	if (transaction.status === "SUCCESS") {
		return {
			transactionId: transaction.transactionId,
			status: "SUCCESS",
			message: "Payment has already been processed successfully.",
			amount: Number(transaction.amount),
		};
	}

	// handle user cancellation
	if (status === "cancel") {
		await prisma.paymentTransaction.update({
			where: { transactionId: paymentId },
			data: { status: "CANCELLED" },
		});

		return {
			transactionId: paymentId,
			status: "CANCELLED",
			message: "bKash payment was cancelled by the user.",
			amount: Number(transaction.amount),
		};
	}

	// handle checkout failure
	if (status === "failure") {
		await prisma.paymentTransaction.update({
			where: { transactionId: paymentId },
			data: { status: "FAILED" },
		});

		return {
			transactionId: paymentId,
			status: "FAILED",
			message: "bKash payment processing failed.",
			amount: Number(transaction.amount),
		};
	}

	// status is success -> execute bKash payment
	const headers = await getBkashAuthHeaders();

	const executeResponse = await fetch(
		`${config.bkash.base_url}/tokenized/checkout/execute`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				paymentID: paymentId,
			}),
		},
	);

	if (!executeResponse.ok) {
		const errText = await executeResponse.text();
		throw new AppError(
			500,
			`Failed to execute bKash payment: ${executeResponse.status} ${errText}`,
		);
	}

	const executedResult = (await executeResponse.json()) as {
		statusCode?: string;
		statusMessage?: string;
		paymentID?: string;
		trxID?: string;
		transactionStatus?: string;
		paymentExecuteTime?: string;
		amount?: string;
	};

	// verify bKash execution success
	if (
		executedResult.statusCode !== "0000" &&
		executedResult.transactionStatus !== "Completed"
	) {
		await prisma.paymentTransaction.update({
			where: { transactionId: paymentId },
			data: {
				status: "FAILED",
				paymentDetails: {
					...(typeof transaction.paymentDetails === "object" &&
					transaction.paymentDetails !== null
						? transaction.paymentDetails
						: {}),
					executedResult,
				},
			},
		});

		throw new AppError(
			400,
			executedResult.statusMessage || "bKash payment execution failed.",
		);
	}

	// extract purchased credits
	const details =
		typeof transaction.paymentDetails === "object" &&
		transaction.paymentDetails !== null
			? (transaction.paymentDetails as Record<string, unknown>)
			: {};

	const creditsPurchased =
		typeof details.credits === "number"
			? details.credits
			: Math.round(Number(transaction.amount) / 5);

	// execute database transaction: update status & credit recruiter account
	const result = await prisma.$transaction(async (tx) => {
		const updatedTx = await tx.paymentTransaction.update({
			where: { transactionId: paymentId },
			data: {
				status: "SUCCESS",
				paymentDetails: {
					...details,
					executedResult,
					trxID: executedResult.trxID,
					paymentExecuteTime: executedResult.paymentExecuteTime,
				},
			},
		});

		const updatedRecruiter = await tx.recruiterProfile.update({
			where: { userId: transaction.userId },
			data: {
				credits: {
					increment: creditsPurchased,
				},
			},
		});

		return {
			transactionId: updatedTx.transactionId,
			status: "SUCCESS",
			message:
				"bKash payment executed successfully. Credits have been added to your profile.",
			creditsPurchased,
			newTotalCredits: updatedRecruiter.credits,
			trxID: executedResult.trxID,
			amount: Number(transaction.amount),
		};
	});

	return result;
};

/**
 * Step 4: getMyTransactions
 * Retrieves paginated list of payment transactions made by the logged-in user.
 */
export const getMyTransactions = async (
	userId: string,
	query: IPaymentFilterParams,
) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

	const whereConditions: Record<string, unknown> = {
		userId,
	};

	if (query.status) {
		whereConditions.status = query.status;
	}

	if (query.provider) {
		whereConditions.provider = query.provider;
	}

	const [transactions, total] = await Promise.all([
		prisma.paymentTransaction.findMany({
			where: whereConditions,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
		}),
		prisma.paymentTransaction.count({
			where: whereConditions,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: transactions,
	};
};

/**
 * getAllTransactions (Admin only)
 * Retrieves all platform transactions with user details, filters, and pagination.
 */
export const getAllTransactions = async (query: IPaymentFilterParams) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

	const whereConditions: Record<string, unknown> = {};

	if (query.status) {
		whereConditions.status = query.status;
	}

	if (query.provider) {
		whereConditions.provider = query.provider;
	}

	const [transactions, total] = await Promise.all([
		prisma.paymentTransaction.findMany({
			where: whereConditions,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
			},
		}),
		prisma.paymentTransaction.count({
			where: whereConditions,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: transactions,
	};
};

/**
 * Step 5: getSingleTransaction
 * Retrieves detailed receipt/invoice for a specific transaction by id or transactionId.
 */
export const getSingleTransaction = async (
	idOrTxId: string,
	userId: string,
	userRole: string,
) => {
	const transaction = await prisma.paymentTransaction.findFirst({
		where: {
			OR: [{ id: idOrTxId }, { transactionId: idOrTxId }],
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		},
	});

	if (!transaction) {
		throw new AppError(404, "Payment transaction record not found.");
	}

	// role-based scoping: only admin or the user who made the payment can view it
	if (userRole !== "ADMIN" && transaction.userId !== userId) {
		throw new AppError(
			403,
			"You are not authorized to view this payment transaction.",
		);
	}

	return transaction;
};

export const PaymentService = {
	getBkashToken,
	initiatePayment,
	executePayment,
	getMyTransactions,
	getAllTransactions,
	getSingleTransaction,
};
