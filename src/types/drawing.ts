/**
 * Drawing types for PlanetCanvas 3D
 */

export interface Bounds {
  north: number
  south: number
  east: number
  west: number
  center: {
    lat: number
    long: number
  }
}

export interface Drawing {
  id: string
  user_id: string
  image_url: string
  latitude: number
  longitude: number
  bounds: Bounds
  created_at: string
  enhanced: boolean
  original_image_url?: string
}

export interface DrawingState {
  tool: 'pencil' | 'brush' | 'eraser'
  color: string
  brushSize: number
  isDrawing: boolean
}

export interface Activity {
  id: string
  drawing_id: string
  user_id: string
  action: 'drawing_created' | 'drawing_enhanced' | 'drawing_deleted'
  metadata: {
    location?: Bounds
    [key: string]: any
  }
  created_at: string
}
