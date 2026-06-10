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

function initHistory(particles: Particle[], length: number): [number, number, number][][] {
  return particles.map(p =>
    Array.from({ length }, () => [...p.position] as [number, number, number])
  )
}

export const useSimStore = create<SimStore>((set, get) => {
  const initialParticles = randomParticles(300)
  return {
    mode: 'gravity',
    particleCount: 300,
    gravity: 9.8,
    damping: 0.02,
    bounce: 0.7,
    attractorStrength: 5,
    slowMotion: false,
    paused: false,
    particles: initialParticles,
    particleHistory: initHistory(initialParticles, 120),
    fps: 0,
    totalEnergy: 0,
    viewLayout: 'single',
    singleView: 'free',
    trail: { enabled: true, length: 120, opacity: 0.6 },
    setMode: (mode) => set({ mode }),
    setParticleCount: (count) => {
      const newParticles = randomParticles(count)
      set({
        particleCount: count,
        particles: newParticles,
        particleHistory: initHistory(newParticles, get().trail.length),
      })
    },
    setParam: (key, value) => set({ [key]: value } as any),
    reset: () => {
      const { particleCount, trail } = get()
      const newParticles = randomParticles(particleCount)
      set({
        particles: newParticles,
        particleHistory: initHistory(newParticles, trail.length),
      })
    },
    setFps: (fps) => set({ fps }),
    setTotalEnergy: (e) => set({ totalEnergy: e }),
    applyPreset: (preset) => {
      set({ ...preset } as any)
      const { particleCount, trail } = get()
      const newParticles = randomParticles(particleCount)
      set({
        particles: newParticles,
        particleHistory: initHistory(newParticles, trail.length),
      })
    },
    setViewLayout: (layout) => set({ viewLayout: layout }),
    setSingleView: (view) => set({ singleView: view }),
    setTrail: (trail) => {
      const prev = get().trail
      const next = { ...prev, ...trail }
      const updates: Partial<SimStore> = { trail: next }
      if (trail.length !== undefined && trail.length !== prev.length) {
        updates.particleHistory = initHistory(get().particles, next.length)
      }
      set(updates as any)
    },
    recordHistory: () => {
      const { particles, particleHistory } = get()
      for (let i = 0; i < particles.length; i++) {
        const history = particleHistory[i]
        const p = particles[i]
        if (!history || !p) continue
        history.shift()
        history.push([...p.position] as [number, number, number])
      }
    },
  }
})
