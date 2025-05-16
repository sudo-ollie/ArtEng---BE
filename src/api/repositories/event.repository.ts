import { Event } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '../db/client';

export class EventRepository implements BaseRepository<Event> {

  //    Get All Events
  async findAll(filter?: Partial<Event>): Promise<Event[]> {
    return prisma.event.findMany({
      where: filter
    });
  }

  //    Get Event By Id
  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id }
    });
  }

  //    Create Event
  async create(data: Omit<Event, 'id'>): Promise<Event> {
    return prisma.event.create({
      data
    });
  }

  //    Edit Event
  async update(id: string, data: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
    return prisma.event.update({
      where: { id },
      data
    });
  }

  //    Delete Event
  async delete(id: string): Promise<boolean> {
    await prisma.event.delete({
      where: { id }
    });
    return true;
  }
}