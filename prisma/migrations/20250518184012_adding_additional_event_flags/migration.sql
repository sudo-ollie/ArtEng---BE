-- AlterTable
ALTER TABLE "events" ADD COLUMN     "event_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "event_private" BOOLEAN NOT NULL DEFAULT false;
