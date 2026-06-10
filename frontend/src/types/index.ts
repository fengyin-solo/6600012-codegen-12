export type SimMode = 'gravity' | 'collision' | 'fluid' | 'vortex'

export type ViewType = 'free' | 'top' | 'side' | 'front'

export type ViewLayout = 'single' | 'quad' | 'triple'

export interface ViewConfig {
  type: ViewType
  label: string
  icon: string
}

export const VIEW_CONFIGS: Record<ViewType, ViewConfig> = {
  free: { type: 'free', label: '自由视角', icon: '🎮' },
  top: { type: 'top', label: '俯视图', icon: '⬇️' },
  side: { type: 'side', label: '侧视图', icon: '➡️' },
  front: { type: 'front', label: '前视图', icon: '🔜' },
}

export interface Particle {
  id: number
  position: [number, number, number]
  velocity: [number, number, number]
  mass: number
  color: string
  radius: number
}

export interface SimulationParams {
  mode: SimMode
  particleCount: number
  gravity: number         // -20 ~ 20
  damping: number         // 0 ~ 1
  bounce: number          // 0 ~ 1
  attractorStrength: number
  slowMotion: boolean
  paused: boolean
}

export interface Preset {
  id: string
  name: string
  params: Partial<SimulationParams>
}

export interface TrailConfig {
  enabled: boolean
  length: number
  opacity: number
}
