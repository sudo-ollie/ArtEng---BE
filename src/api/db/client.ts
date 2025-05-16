import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv'

// Singleton for DB Connection
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const envLocal = dotenv.config({ path: '.env.local' })

console.log(envLocal);

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    console.error('Prisma error:', error);
    throw error;
  }
});

// Dev Mode => Keep Alive Between Reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;