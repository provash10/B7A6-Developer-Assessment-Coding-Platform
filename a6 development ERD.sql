CREATE TABLE "Users"(
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) CHECK
        (
            "role" IN('ADMIN', 'RECRUITER', 'CANDIDATE')
        ) NOT NULL DEFAULT 'CANDIDATE',
        "createdAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "updatedAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "deletedAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "Users" ADD PRIMARY KEY("id");
CREATE TABLE "Recruiter Profile"(
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(0) WITH
        TIME zone NOT NULL,
        "updatedAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "deletedAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "companyName" VARCHAR(255) NOT NULL,
        "companyWebsite" VARCHAR(255) NOT NULL,
        "credits" INTEGER NOT NULL
);
ALTER TABLE
    "Recruiter Profile" ADD PRIMARY KEY("id");
CREATE TABLE "Candidate Profile"(
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resumeUrl" VARCHAR(255) NOT NULL,
    "skills" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(0) WITH
        TIME zone NOT NULL,
        "createdAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
        "updatedAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL
);
ALTER TABLE
    "Candidate Profile" ADD PRIMARY KEY("id");
CREATE TABLE "Assessments"(
    "id" UUID NOT NULL,
    "recruiterId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "passMarks" FLOAT(53) NOT NULL,
    "totalMarks" FLOAT(53) NOT NULL DEFAULT 0,
    "status" VARCHAR(255) CHECK
        (
            "status" IN(
                '"DRAFT"',
                '"PUBLISHED"',
                '"ARCHIVED"'
            )
        ) NOT NULL DEFAULT '"DRAFT"',
        "deletedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "startTime" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "endTime" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Assessments" ADD PRIMARY KEY("id");
CREATE TABLE "Questions"(
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) CHECK
        (
            "type" IN('"CODING"', '"MCQ"', '"DESCRIPTIVE"')
        ) NOT NULL,
        "difficulty" VARCHAR(255)
    CHECK
        (
            "difficulty" IN('"EASY"', '"MEDIUM"', '"HARD"')
        ) NOT NULL DEFAULT '"MEDIUM"',
        "marks" FLOAT(53) NOT NULL DEFAULT 10,
        "testCases" jsonb NOT NULL,
        "options" jsonb NOT NULL,
        "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "deletedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL);
ALTER TABLE
    "Questions" ADD PRIMARY KEY("id");
CREATE TABLE "Assessments Questions"(
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE
    "Assessments Questions" ADD PRIMARY KEY("id");
CREATE TABLE "Assessment Invitations"(
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "inviteToken" VARCHAR(255) NOT NULL,
    "status" VARCHAR(255) CHECK
        (
            "status" IN(
                '"PENDING"',
                '"ACCEPTED"',
                '"EXPIRED"'
            )
        ) NOT NULL DEFAULT '"PENDING"',
        "expiresAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "deletedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Assessment Invitations" ADD PRIMARY KEY("id");
ALTER TABLE
    "Assessment Invitations" ADD CONSTRAINT "assessment invitations_invitetoken_unique" UNIQUE("inviteToken");
CREATE TABLE "Candidate Attempts"(
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "status" VARCHAR(255) CHECK
        (
            "status" IN(
                '"NOT_STARTED"',
                '"IN_PROGRESS"',
                '"SUBMITTED"'
            )
        ) NOT NULL DEFAULT '"NOT_STARTED"',
        "startedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "submittedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "totalScore" FLOAT(53) NOT NULL,
        "isPassed" BOOLEAN NOT NULL,
        "antiCheatFlags" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "deletedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Candidate Attempts" ADD PRIMARY KEY("id");
CREATE TABLE "Submissions"(
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "submittedCode" TEXT NOT NULL,
    "selectedOption" VARCHAR(255) NOT NULL,
    "verdict" VARCHAR(255) NOT NULL,
    "scoreObtained" FLOAT(53) NOT NULL,
    "executiontime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Submissions" ADD PRIMARY KEY("id");
CREATE TABLE "Payment Transactions"(
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(8, 2) NOT NULL,
    "currency" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) CHECK
        (
            "provider" IN('"BKASH"', '"STRIPE"', '')
        ) NOT NULL,
        "transactionId" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255)
    CHECK
        (
            "status" IN(
                '"PENDING"',
                '"SUCCESS"',
                '"FAILED"',
                '"CANCELLED"'
            )
        ) NOT NULL DEFAULT '"PENDING"',
        "paymentDetails" jsonb NOT NULL,
        "createdAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "Payment Transactions" ADD PRIMARY KEY("id");
CREATE TABLE "Audit Logs"(
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(255) NOT NULL,
    "entityId" UUID NOT NULL,
    "oldValue" jsonb NOT NULL,
    "newValue" jsonb NOT NULL,
    "ipAddress" VARCHAR(255) NOT NULL,
    "createdAt" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "Audit Logs" ADD PRIMARY KEY("id");
ALTER TABLE
    "Assessment Invitations" ADD CONSTRAINT "assessment invitations_id_foreign" FOREIGN KEY("id") REFERENCES "Candidate Profile"("resumeUrl");
ALTER TABLE
    "Assessments Questions" ADD CONSTRAINT "assessments questions_questionid_foreign" FOREIGN KEY("questionId") REFERENCES "Questions"("id");
ALTER TABLE
    "Recruiter Profile" ADD CONSTRAINT "recruiter profile_id_foreign" FOREIGN KEY("id") REFERENCES "Users"("id");
ALTER TABLE
    "Questions" ADD CONSTRAINT "questions_id_foreign" FOREIGN KEY("id") REFERENCES "Assessments Questions"("assessmentId");
ALTER TABLE
    "Assessments" ADD CONSTRAINT "assessments_recruiterid_foreign" FOREIGN KEY("recruiterId") REFERENCES "Recruiter Profile"("id");
ALTER TABLE
    "Payment Transactions" ADD CONSTRAINT "payment transactions_id_foreign" FOREIGN KEY("id") REFERENCES "Users"("id");
ALTER TABLE
    "Submissions" ADD CONSTRAINT "submissions_id_foreign" FOREIGN KEY("id") REFERENCES "Candidate Profile"("resumeUrl");
ALTER TABLE
    "Candidate Profile" ADD CONSTRAINT "candidate profile_id_foreign" FOREIGN KEY("id") REFERENCES "Users"("id");
ALTER TABLE
    "Audit Logs" ADD CONSTRAINT "audit logs_id_foreign" FOREIGN KEY("id") REFERENCES "Users"("id");
ALTER TABLE
    "Candidate Profile" ADD CONSTRAINT "candidate profile_id_foreign" FOREIGN KEY("id") REFERENCES "Candidate Attempts"("id");
ALTER TABLE
    "Payment Transactions" ADD CONSTRAINT "payment transactions_id_foreign" FOREIGN KEY("id") REFERENCES "Candidate Profile"("userId");
ALTER TABLE
    "Assessments Questions" ADD CONSTRAINT "assessments questions_id_foreign" FOREIGN KEY("id") REFERENCES "Assessments"("id");