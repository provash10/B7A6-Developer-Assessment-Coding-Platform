import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function run() {
  const attempts = await prisma.candidateAttempt.findMany({
    include: {
      assessment: true,
      submissions: true,
      candidate: {
        include: { user: true }
      }
    }
  });

  console.log("=== CANDIDATE ATTEMPTS IN DB ===");
  console.log(JSON.stringify(attempts, null, 2));

  const submissions = await prisma.submission.findMany({
    include: {
      attempt: {
        include: {
          candidate: { include: { user: true } },
          assessment: true
        }
      }
    }
  });

  console.log("=== SUBMISSIONS IN DB ===");
  console.log(JSON.stringify(submissions, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);

