import { PrismaClient } from '@prisma/client';

export interface BaseRepository<T, K = string> {
  findAll(filter?: Partial<T>): Promise<T[]>;
  findById(id: K): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: K, data: Partial<Omit<T, 'id'>>): Promise<T | null>;
  delete(id: K): Promise<boolean>;
}

export abstract class BaseRepositoryImpl<T, K = string> implements BaseRepository<T, K> {
  constructor(protected prisma: PrismaClient) {}

  abstract findAll(filter?: Partial<T>): Promise<T[]>;
  abstract findById(id: K): Promise<T | null>;
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract update(id: K, data: Partial<Omit<T, 'id'>>): Promise<T | null>;
  abstract delete(id: K): Promise<boolean>;
}