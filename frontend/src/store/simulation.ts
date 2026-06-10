import { create } from 'zustand'
import type { SimMode, SimulationParams, Particle, ViewType, ViewLayout, TrailConfig } from '../types'

const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c084fc','#f472b6','#38bdf8']

function randomParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ] as [number, number, number],
    velocity: [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ] as [number, number, number],
    mass: 0.5 + Math.random() * 2,
    color: COLORS[i % COLORS.length],
    radius: 0.15 + Math.random() * 0.35,
  }))
}

interface SimStore extends SimulationParams {
  particles: Particle[]
  particleHistory: [number, number, number][][]
  fps: number
  totalEnergy: number
  viewLayout: ViewLayout
  singleView: ViewType
  trail: TrailConfig
  setMode: (mode: SimMode) => void
  setParticleCount: (count: number) => void
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void
  reset: () => void
  setFps: (fps: number) => void
  setTotalEnergy: (e: number) => void
  applyPreset: (preset: Partial<SimulationParams>) => void
  setViewLayout: (layout: ViewLayout) => void
  setSingleView: (view: ViewType) => void
  setTrail: (trail: Partial<TrailConfig>) => void
  recordHistory: () => void
}

function initHistory(count: number, length: number): [number, number, number][][] {
  return Array.from({ length: count }, () =>
    Array.from({ length }, () => [0, 0, 0] as [number, number, number])
  )
}

export const useSimStore = create<SimStore>((set, get) => ({
  mode: 'gravity',
  particleCount: 300,
  gravity: 9.8,
  damping: 0.02,
  bounce: 0.7,
  attractorStrength: 5,
  slowMotion: false,
  paused: false,
  particles: randomParticles(300),
  particleHistory: initHistory(300, 120),
  fps: 0,
  totalEnergy: 0,
  viewLayout: 'single',
  singleView: 'free',
  trail: { enabled: true, length: 120, opacity: 0.6 },
  setMode: (mode) => set({ mode }),
  setParticleCount: (count) => set({
    particleCount: count,
    particles: randomParticles(count),
    particleHistory: initHistory(count, get().trail.length),
  }),
  setParam: (key, value) => set({ [key]: value } as any),
  reset: () => {
    const { particleCount, trail } = get()
    set({
      particles: randomParticles(particleCount),
      particleHistory: initHistory(particleCount, trail.length),
    })
  },
  setFps: (fps) => set({ fps }),
  setTotalEnergy: (e) => set({ totalEnergy: e }),
  applyPreset: (preset) => {
    set({ ...preset } as any)
    const { particleCount, trail } = get()
    set({
      particles: randomParticles(particleCount),
      particleHistory: initHistory(particleCount, trail.length),
    })
  },
  setViewLayout: (layout) => set({ viewLayout: layout }),
  setSingleView: (view) => set({ singleView: view }),
  setTrail: (trail) => {
    const prev = get().trail
    const next = { ...prev, ...trail }
    const updates: Partial<SimStore> = { trail: next }
    if (trail.length !== undefined && trail.length !== prev.length) {
      updates.particleHistory = initHistory(get().particleCount, next.length)
    }
    set(updates as any)
  },
  recordHistory: () => {
    const { particles, particleHistory, trail } = get()
    const len = trail.length
    const newHistory = particleHistory.map((history, i) => {
      const next = history.slice()
      const p = particles[i]
      if (!p) return next
      next.shift()
      next.push([...p.position] as [number, number, number])
      return next
    })
    set({ particleHistory: newHistory })
  },
}))
