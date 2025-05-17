/**
 * Utility function to safely cast Prisma results to our application types
 * @param data The data returned from Prisma
 * @returns The data cast to the specified type
 */

export function mapPrismaModel<T>(data: any): T {
  return data as T;
}