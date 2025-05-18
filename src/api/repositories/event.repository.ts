import { prisma } from '../db/client';
import { AuditLevel } from '../../enums/enumsRepo';
import { services } from '../services/container';
import { Event } from "../../types/typesRepo";
import { PrismaClient } from '.prisma/client';

export class EventService  {
  
  constructor(private readonly prisma: PrismaClient) {
  }
  
  async getAllEvents(): Promise<Event[]> {
    try {
      return await prisma.event.findMany({
        where: { 
          eventActive: true,
          eventPrivate: false
        }
      });
    } catch (error) {
      console.error('Error Fetching Events :', error);
      await services.auditLogger.auditLog(
        `Error Fetching Events : ${error}`,
        AuditLevel.Error,
        'SYSTEM'
      );
      return [];
    }
  }
  
  async getEventById(id: string): Promise<Event | null> {
    try {
      return await prisma.event.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error(`Error Fetching Event-${id} :`, error);
      await services.auditLogger.auditLog(
        `Error Fetching Event-${id} : ${error}`,
        AuditLevel.Error,
        'SYSTEM'
      );
      return null;
    }
  }
  
  async deleteEvent(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id }
      });
      
      if (!event) {
        return { success: false, message: 'Event Not Found' };
      }
      
      if (event.eventLocked) {
        return { success: false, message: 'Locked Event Cannot Be Deleted' };
      }
      
      await prisma.event.delete({
        where: { id }
      });
      
      await services.auditLogger.auditLog(
        `Deleted Event ${event.title} - ${id}`,
        AuditLevel.Delete,
        userId
      );
      
      return { success: true, message: 'Event Deleted Successfully' };
    } catch (error) {
      console.error(`Error Deleting Event With ID ${id}:`, error);
      await services.auditLogger.auditLog(
        `Error Deleting Event With ID ${id}: ${error}`,
        AuditLevel.Error,
        userId
      );
      return { success: false, message: 'Failed To Delete Event' };
    }
  }
  
  async lockEvent(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id }
      });
      
      if (!event) {
        return { success: false, message: 'Event Not Found' };
      }
      
      await prisma.event.update({
        where: { id },
        data: { eventLocked: true }
      });
      
      await services.auditLogger.auditLog(
        `Locked Event ${event.title} With ID ${id}`,
        AuditLevel.Update,
        userId
      );
      
      return { success: true, message: 'Event Successfully Locked' };
    } catch (error) {
      console.error(`Error Locking Event With ID ${id}:`, error);
      await services.auditLogger.auditLog(
        `Error Locking Event With ID ${id}: ${error}`,
        AuditLevel.Error,
        userId
      );
      return { success: false, message: 'Failed To Lock Event' };
    }
  }
  
  async privateEvent(id: string, setPrivate: boolean, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id }
      });
      
      if (!event) {
        return { success: false, message: 'Event Not Found' };
      }
      
      await prisma.event.update({
        where: { id },
        data: { eventPrivate: setPrivate }
      });
      
      const action = setPrivate ? true : false;
      
      await services.auditLogger.auditLog(
        `Set Event ${event.title} - ID ${id} To ${action}`,
        setPrivate ? AuditLevel.Deactivate : AuditLevel.Activate,
        userId
      );
      
      return { success: true, message: `Successfully Set EventID : ${id} To ${action}` };
    } catch (error) {
      console.error(`Failed To Set Event-${id} Privacy Level:`, error);
      await services.auditLogger.auditLog(
        `Error Setting Event-${id} Privacy: ${error}`,
        AuditLevel.Error,
        userId
      );
      return { success: false, message: 'Failed To Update Event Privacy Level' };
    }
  }
  
  async getEventStats(): Promise<{ totalEvents: number; activeEvents: number; totalAttendees: number }> {
    try {
      const [totalEvents, activeEvents] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({
          where: { eventActive: true }
        })
      ]);
      
      //  Place holder until I add an attendees table && functionality
      const totalAttendees = 0;
      
      return {
        totalEvents,
        activeEvents,
        totalAttendees
      };
    } catch (error) {
      console.error('Error getting event stats:', error);
      await services.auditLogger.auditLog(
        `Error getting event stats: ${error}`,
        AuditLevel.Error,
        'SYSTEM'
      );
      return { totalEvents: 0, activeEvents: 0, totalAttendees: 0 };
    }
  }
}