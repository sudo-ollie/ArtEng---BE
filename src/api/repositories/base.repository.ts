export interface BaseRepository<T, K = string> {
  findAll(filter?: Partial<T>): Promise<T[]>;
  findById(id: K): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: K, data: Partial<Omit<T, 'id'>>): Promise<T | null>;
  delete(id: K): Promise<boolean>;
}