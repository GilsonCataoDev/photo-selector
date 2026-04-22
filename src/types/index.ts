export interface Session {
  id: string
  client_name: string
  shoot_date: string
  photo_limit: number
  status: 'pending' | 'completed'
  token: string
  extra_photo_price: number | null
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
  created_at: string
}

export interface Selection {
  id: string
  session_id: string
  photo_id: string
  created_at: string
}

export interface SessionWithCounts extends Session {
  photos_count: number
  selections_count: number
}
