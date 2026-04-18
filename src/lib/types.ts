export type Role = 'owner' | 'professional' | 'admin';
export type ProfessionalType = 'walker' | 'sitter' | 'trainer' | 'groomer' | 'boarding';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  email_verified: boolean;
  phone_verified: boolean;
  avatar_url: string;
  role: Role;
  location_text: string;
  latitude: number;
  longitude: number;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  photo_url: string;
  vaccinated: boolean;
  aggressive: boolean;
  medical_notes: string;
}

export interface Professional {
  id: string;
  professional_type: ProfessionalType;
  bio: string;
  zone_text: string;
  latitude: number;
  longitude: number;
  coverage_radius_km: number;
  starting_price: number;
  cover_photo_url: string;
  approved: boolean;
  rating: number;
  review_count: number;
}

export interface Service {
  id: string;
  professional_id: string;
  service_type: string;
  name: string;
  description: string;
  price: number;
  duration_kind: string;
  duration_minutes: number;
  active: boolean;
}

export interface Booking {
  id: string;
  owner_id: string;
  professional_id: string;
  service_id: string | null;
  resource_id: string | null;
  start_at: string;
  end_at: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'declined';
  is_group: boolean;
  price: number;
  notes: string;
  created_at: string;
}
