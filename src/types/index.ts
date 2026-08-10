export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  address?: string
  role: 'resident' | 'staff' | 'admin'
  barangay_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface IncidentCategory {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
  default_department?: string
  sort_order: number
  is_active: boolean
}

export interface IncidentReport {
  id: string
  report_number: string
  title: string
  description: string
  category_id?: string
  category_name?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'ai_reviewing' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
  lat?: number
  lng?: number
  address?: string
  landmark?: string
  is_anonymous: boolean
  incident_date?: string
  reporter_id?: string
  reporter_name?: string
  reporter_contact?: string
  assigned_staff_id?: string
  ai_summary?: string
  ai_keywords?: string[]
  ai_severity?: string
  ai_department?: string
  ai_processed: boolean
  resolution_notes?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  incident_images?: IncidentImage[]
}

export interface IncidentImage {
  id: string
  report_id: string
  image_url: string
  file_path?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  related_report_id?: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  author_id?: string
  author_name: string
  is_pinned: boolean
  is_active: boolean
  publish_date: string
  expiry_date?: string
  created_at: string
}

export interface Staff {
  id: string
  user_id: string
  full_name: string
  position?: string
  department?: string
  contact_number?: string
  is_active: boolean
  assigned_areas?: string[]
  created_at: string
}

export interface SystemSettings {
  id: number
  barangay_name: string
  city_municipality?: string
  province?: string
  region?: string
  contact_number?: string
  email?: string
  office_hours: string
  emergency_hotline?: string
  ai_enabled: boolean
  ai_model: string
  map_default_lat: number
  map_default_lng: number
  map_default_zoom: number
  allow_anonymous: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
