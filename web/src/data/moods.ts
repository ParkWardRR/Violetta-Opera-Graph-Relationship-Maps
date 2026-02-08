import type { GraphNode } from '@/types/graph'

export interface Mood {
  id: string
  label: string
  tagline: string
  color: string
  colorRGB: [number, number, number]
  angle: number
}

export const MOODS: Mood[] = [
  {
    id: 'passionate',
    label: 'Passionate & Dramatic',
    tagline: 'Fiery emotions, soaring arias',
    color: '#ef4444',
    colorRGB: [239, 68, 68],
    angle: 0,
  },
  {
    id: 'ornate',
    label: 'Ornate & Majestic',
    tagline: 'Baroque grandeur, courtly elegance',
    color: '#f59e0b',
    colorRGB: [245, 158, 11],
    angle: Math.PI / 3,
  },
  {
    id: 'mystical',
    label: 'Mystical & Dark',
    tagline: 'Shadow, tension, the uncanny',
    color: '#8b5cf6',
    colorRGB: [139, 92, 246],
    angle: (2 * Math.PI) / 3,
  },
  {
    id: 'lyrical',
    label: 'Intimate & Lyrical',
    tagline: 'Refinement, bel canto, tenderness',
    color: '#3b82f6',
    colorRGB: [59, 130, 246],
    angle: Math.PI,
  },
  {
    id: 'revolutionary',
    label: 'Bold & Revolutionary',
    tagline: 'Breaking boundaries, new forms',
    color: '#10b981',
    colorRGB: [16, 185, 129],
    angle: (4 * Math.PI) / 3,
  },
  {
    id: 'folk',
    label: 'Folk & Cultural',
    tagline: 'National traditions, roots music',
    color: '#ec4899',
    colorRGB: [236, 72, 153],
    angle: (5 * Math.PI) / 3,
  },
]

export const MOOD_MAP = new Map(MOODS.map((m) => [m.id, m]))

const COMPOSER_MOODS: Record<string, string[]> = {
  'Giuseppe Verdi':       ['passionate', 'lyrical'],
  'Francesco Cilea':      ['passionate', 'lyrical'],
  'Giovanni Pacini':      ['passionate'],
  'Antonio Vivaldi':      ['ornate'],
  'George Frideric Handel': ['ornate'],
  'Thomas Arne':          ['ornate', 'lyrical'],
  'Arnold Schoenberg':    ['mystical', 'revolutionary'],
  'Hans Werner Henze':    ['mystical', 'revolutionary'],
  'Friedrich Schenker':   ['mystical'],
  'Béla Bartók':          ['mystical', 'folk'],
  'Nicolas Dalayrac':     ['lyrical'],
  'François Adrien Boieldieu': ['lyrical'],
  'Antoine Louis Clapisson':   ['lyrical'],
  'Henry Février':        ['lyrical', 'passionate'],
  'Auguste Chapuis':      ['lyrical'],
  'Gian Carlo Menotti':   ['revolutionary', 'lyrical'],
  'Bohuslav Martinů':     ['revolutionary', 'folk'],
  'Lukas Foss':           ['revolutionary'],
  'Norman Dello Joio':    ['revolutionary'],
  'Otto Ketting':         ['revolutionary'],
  'Leonid Klinichev':     ['revolutionary'],
  'Germaine Tailleferre': ['revolutionary', 'lyrical'],
  'Carlo Galante':        ['lyrical', 'revolutionary'],
  'Marisa Manchado':      ['revolutionary'],
  'Uzeyir Hajibeyov':     ['folk'],
  'Zulfugar Hajibeyov':   ['folk'],
  'Sayed Mekawy':         ['folk'],
  'Giuseppe Mosca':       ['ornate', 'lyrical'],
  'Giuseppe Mulè':        ['folk', 'passionate'],
  'Niccolò Antonio Zingarelli': ['ornate'],
  'Victorin de Joncières': ['lyrical', 'passionate'],
  'Daniel François Esprit Auber': ['ornate', 'lyrical'],
  'François Bazin':       ['lyrical'],
  'Félix Máximo López':   ['folk'],
}

const ERA_MOODS: Record<string, string[]> = {
  'Baroque':        ['ornate'],
  'Classical':      ['ornate', 'lyrical'],
  'Early Romantic': ['passionate', 'lyrical'],
  'Late Romantic':  ['passionate'],
  '20th Century':   ['revolutionary'],
  'Contemporary':   ['revolutionary'],
}

const LANG_MOOD_HINTS: Record<string, string> = {
  'German':      'mystical',
  'Azerbaijani': 'folk',
  'Walloon':     'folk',
  'Spanish':     'folk',
}

export function assignMoods(node: GraphNode): string[] {
  const { composerName, eraBucket, language } = node.attributes

  if (composerName && COMPOSER_MOODS[composerName]) {
    return COMPOSER_MOODS[composerName]
  }

  const moods = new Set<string>()

  if (eraBucket && ERA_MOODS[eraBucket]) {
    for (const m of ERA_MOODS[eraBucket]) moods.add(m)
  }

  if (language && LANG_MOOD_HINTS[language]) {
    moods.add(LANG_MOOD_HINTS[language])
  }

  if (moods.size === 0) {
    if (language === 'Italian') moods.add('passionate')
    else if (language === 'French') moods.add('lyrical')
    else if (language === 'English') moods.add('revolutionary')
    else moods.add('lyrical')
  }

  return [...moods].slice(0, 2)
}

export interface MoodNode {
  key: string
  label: string
  composerName: string
  premiereYear: number | undefined
  eraBucket: string
  language: string
  moods: string[]
  primaryMood: string
  x: number
  y: number
}

export interface MoodEdge {
  source: string
  target: string
  sharedMood: string
}

function stableHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function buildMoodGraph(nodes: GraphNode[]): { moodNodes: MoodNode[]; moodEdges: MoodEdge[] } {
  const operas = nodes.filter((n) => n.attributes.type === 'opera')

  const moodNodes: MoodNode[] = operas.map((node) => {
    const moods = assignMoods(node)
    const primaryMood = moods[0]
    const mood = MOOD_MAP.get(primaryMood)!
    const h = stableHash(node.key)

    const clusterRadius = 12
    const cx = Math.cos(mood.angle) * clusterRadius
    const cy = Math.sin(mood.angle) * clusterRadius

    const r = ((h % 1000) / 1000) * 5 + 1
    const theta = ((h % 997) / 997) * Math.PI * 2
    const x = cx + Math.cos(theta) * r
    const y = cy + Math.sin(theta) * r

    return {
      key: node.key,
      label: node.attributes.label,
      composerName: node.attributes.composerName ?? 'Unknown',
      premiereYear: node.attributes.premiereYear,
      eraBucket: node.attributes.eraBucket ?? '',
      language: node.attributes.language ?? '',
      moods,
      primaryMood,
      x,
      y,
    }
  })

  const moodEdges: MoodEdge[] = []
  const byMood = new Map<string, MoodNode[]>()
  for (const node of moodNodes) {
    for (const m of node.moods) {
      if (!byMood.has(m)) byMood.set(m, [])
      byMood.get(m)!.push(node)
    }
  }

  for (const [mood, members] of byMood) {
    if (members.length < 2) continue
    for (const node of members) {
      const others = members
        .filter((m) => m.key !== node.key)
        .map((m) => ({
          node: m,
          dist: Math.hypot(m.x - node.x, m.y - node.y),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2)

      for (const { node: other } of others) {
        const edgeKey = [node.key, other.key].sort().join('-')
        if (!moodEdges.find((e) => [e.source, e.target].sort().join('-') === edgeKey)) {
          moodEdges.push({ source: node.key, target: other.key, sharedMood: mood })
        }
      }
    }
  }

  return { moodNodes, moodEdges }
}
