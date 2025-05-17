import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv'

//  DB Singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };

//  Dev env
dotenv.config({ path: '.env.local' });

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

//  Base DB Logging
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    console.error('Prisma error:', error);
    throw error;
  }
});

//  Keep Alive For Dev
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;