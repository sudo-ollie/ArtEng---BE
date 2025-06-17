export interface CreateEventResponse {
  success: boolean;
  message: string;
  event?: Event;
  error?: string;
}