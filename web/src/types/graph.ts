export interface GraphDocument {
  attributes: {
    name: string
    version: string
    generatedAt: string
  }
  options: {
    type: string
    multi: boolean
    allowSelfLoops: boolean
  }
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphNode {
  key: string
  attributes: NodeAttributes
}

export interface NodeAttributes {
  label: string
  type: 'opera' | 'composer' | 'venue' | 'librettist'
  composerId?: string
  composerName?: string
  premiereYear?: number
  premiereLocation?: string
  language?: string
  genre?: string
  eraBucket?: string
  decade?: string
  birthYear?: number
  deathYear?: number
  nationality?: string
  x: number
  y: number
  size: number
  color: string
  projX?: number
  projY?: number
}

export interface GraphEdge {
  key: string
  source: string
  target: string
  attributes: EdgeAttributes
}

export interface EdgeAttributes {
  type: 'composed_by' | 'libretto_by' | 'premiered_at' | 'similar_to' | 'based_on' | 'performed_at'
  weight: number
}

export type EraBucket = 'Baroque' | 'Classical' | 'Early Romantic' | 'Late Romantic' | '20th Century' | 'Contemporary'

export const ERA_COLORS: Record<string, string> = {
  'Baroque': '#2ecc71',
  'Classical': '#3498db',
  'Early Romantic': '#9b59b6',
  'Late Romantic': '#e74c3c',
  '20th Century': '#f39c12',
  'Contemporary': '#1abc9c',
}

export const ERA_RANGES: Record<string, string> = {
  'Baroque': 'before 1750',
  'Classical': '1750 \u2013 1820',
  'Early Romantic': '1820 \u2013 1850',
  'Late Romantic': '1850 \u2013 1910',
  '20th Century': '1910 \u2013 1975',
  'Contemporary': 'after 1975',
}

export const ERA_ORDER = ['Baroque', 'Classical', 'Early Romantic', 'Late Romantic', '20th Century', 'Contemporary']

export interface PerformanceEvent {
  event_id: string
  venue_code: string
  region: string
  opera_title: string
  composer: string
  dates: string[]
  venue_name: string
  city: string
  state: string
  source_url: string
  scraped_at: string
  matched_opera_key?: string
  match_confidence?: number
}

export interface CustomSource {
  url: string
  label: string
  scraped_at: string
  event_count: number
}
