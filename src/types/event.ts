export interface Event {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  date: Date;
  location: string;
  capacity: number;
  price: number;
  sponsor: string;
  bannerImage: string;
  thumbImage: string;
  sponsorLogo: string;
  publishDate: Date;
  eventActive: boolean;
  eventPrivate: boolean;
  eventLocked: boolean;
}
