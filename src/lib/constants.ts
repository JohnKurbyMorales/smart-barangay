export const CATEGORY_COLORS: Record<string, string> = {
  'Fire': '#ef4444',
  'Flood': '#3b82f6',
  'Accident': '#eab308',
  'Theft': '#a855f7',
  'Public Disturbance': '#f97316',
  'Medical Emergency': '#ec4899',
  'Infrastructure': '#64748b',
  'Noise Complaint': '#14b8a6',
  'Other': '#6b7280',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: '#6b7280',
  ai_reviewing: '#8b5cf6',
  verified: '#3b82f6',
  assigned: '#f97316',
  in_progress: '#eab308',
  resolved: '#22c55e',
  closed: '#374151',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  ai_reviewing: 'AI Reviewing',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

export const CATEGORIES = [
  'Fire', 'Flood', 'Accident', 'Theft', 'Public Disturbance',
  'Medical Emergency', 'Infrastructure', 'Noise Complaint', 'Other',
]

export const DEFAULT_MAP_CENTER: [number, number] = [14.8261, 120.5180] // Barangay Mabiga, Hermosa, Bataan
export const DEFAULT_MAP_ZOOM = 15 // Barangay-level zoom
