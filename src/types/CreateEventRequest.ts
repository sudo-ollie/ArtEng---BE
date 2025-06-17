export interface CreateEventRequest {
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  price: number;
  sponsor: string;
  bannerImage: string;
  thumbImage: string;
  sponsorLogo: string;
  eventActive?: boolean;
  eventPrivate?: boolean;
}