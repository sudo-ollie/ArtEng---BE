
import { prisma } from '../db/client';
import { BaseRepositoryImpl } from './base.repository';
import { Event } from '../../types/event';
import { mapPrismaModel } from '../../types/prisma-utils';

export class EventRepository extends BaseRepositoryImpl<Event> {
  constructor(prisma: prisma) {
    super(prisma);
  }

  async findAll(filter?: Partial<Event>): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: filter as any
    });
    return events.map((event: Event) => mapPrismaModel<Event>(event));
  }

  async findById(id: string): Promise<Event | null> {
    const event = await this.prisma.event.findUnique({
      where: { id }
    });
    return event ? mapPrismaModel<Event>(event as Event) : null;
  }

  async create(data: Omit<Event, 'id'>): Promise<Event> {
    const event = await this.prisma.event.create({
      data: data as any
    });
    return mapPrismaModel<Event>(event as Event);
  }

  async update(id: string, data: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
    const event = await this.prisma.event.update({
      where: { id },
      data: data as any
    });
    return mapPrismaModel<Event>(event as Event);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.event.delete({
      where: { id }
    });
    return true;
  }
}