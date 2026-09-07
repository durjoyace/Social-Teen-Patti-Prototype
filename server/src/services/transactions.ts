import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
export async function serializable<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        // Settlement updates several accounts and the audit snapshot atomically.
        maxWait: 5_000,
        timeout: 15_000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        attempt >= 4
      )
        throw error;
      await new Promise((r) => setTimeout(r, 10 * (attempt + 1)));
    }
  }
}
