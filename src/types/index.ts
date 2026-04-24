export interface Session {
  id: string
  client_name: string
  shoot_date: string
  photo_limit: number
  status: 'pending' | 'completed'
  token: string
  extra_photo_price: number | null
  message: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  photos?: Photo[]
  selections?: Selection[]
}

export interface Photo {
  id: string
  session_id: string
  url: string
  storage_path: string
  filename: string
  sort_order: number
  created_at: string
}

export interface Selection {
  id: string
  session_id: string
  photo_id: string
  created_at: string
}

export interface Stats {
  total_sessions: number
  completed_this_month: number
  photos_delivered: number
  extras_revenue: number
}
