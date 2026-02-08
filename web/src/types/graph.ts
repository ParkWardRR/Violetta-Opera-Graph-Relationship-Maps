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
