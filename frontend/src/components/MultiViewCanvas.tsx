import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useSimStore } from '../store/simulation'
import { applyPhysics } from '../simulations/physics'
import type { ViewType } from '../types'
import { VIEW_CONFIGS } from '../types'

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

function CameraSetup({ viewType }: { viewType: ViewType }) {
  const { camera } = useThree()

  useMemo(() => {
    switch (viewType) {
      case 'top':
        camera.position.set(0, 35, 0.01)
        camera.up.set(0, 0, -1)
        camera.lookAt(0, 0, 0)
        break
      case 'side':
        camera.position.set(35, 5, 0)
        camera.up.set(0, 1, 0)
        camera.lookAt(0, 0, 0)
        break
      case 'front':
        camera.position.set(0, 5, 35)
        camera.up.set(0, 1, 0)
        camera.lookAt(0, 0, 0)
        break
    }
    camera.updateProjectionMatrix()
  }, [viewType, camera])

  return null
}

function ParticleInstances() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useSimStore(s => s.particles)

  const colorArray = useMemo(
    () => new Float32Array(particles.length * 3),
    [particles.length]
  )

  useMemo(() => {
    particles.forEach((p, i) => {
      tempColor.set(p.color)
      colorArray[i * 3] = tempColor.r
      colorArray[i * 3 + 1] = tempColor.g
      colorArray[i * 3 + 2] = tempColor.b
    })
  }, [particles, colorArray])

  useFrame(() => {
    if (!meshRef.current) return
    const currentParticles = useSimStore.getState().particles
    currentParticles.forEach((p, i) => {
      tempObject.position.set(...p.position)
      const scale = p.radius * 2
      tempObject.scale.set(scale, scale, scale)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>
      <meshPhongMaterial vertexColors toneMapped={false} shininess={80} />
    </instancedMesh>
  )
}

function TrailLines() {
  const particleCount = useSimStore(s => s.particleCount)
  const enabled = useSimStore(s => s.trail.enabled)
  const opacity = useSimStore(s => s.trail.opacity)
  const trailLength = useSimStore(s => s.trail.length)
  const pointsRef = useRef<THREE.Points>(null)
  const totalPoints = particleCount * trailLength

  const positions = useMemo(() => new Float32Array(totalPoints * 3), [totalPoints])
  const colors = useMemo(() => {
    const arr = new Float32Array(totalPoints * 3)
    const particles = useSimStore.getState().particles
    particles.forEach((p, i) => {
      const color = new THREE.Color(p.color)
      for (let j = 0; j < trailLength; j++) {
        const idx = (i * trailLength + j) * 3
        arr[idx] = color.r
        arr[idx + 1] = color.g
        arr[idx + 2] = color.b
      }
    })
    return arr
  }, [particleCount, trailLength])

  useFrame(() => {
    if (!enabled || !pointsRef.current) return
    const state = useSimStore.getState()
    const history = state.particleHistory
    const geom = pointsRef.current.geometry
    const posAttr = geom.attributes.position as THREE.BufferAttribute
    const count = Math.min(particleCount, history.length)

    for (let i = 0; i < count; i++) {
      const h = history[i]
      if (!h) continue
      const startIdx = Math.max(0, h.length - trailLength)
      let writePos = 0
      for (let j = startIdx; j < h.length; j++) {
        if (h[j]) {
          const idx = (i * trailLength + writePos) * 3
          posAttr.array[idx] = h[j][0]
          posAttr.array[idx + 1] = h[j][1]
          posAttr.array[idx + 2] = h[j][2]
          writePos++
        }
      }
      for (let j = writePos; j < trailLength; j++) {
        const idx = (i * trailLength + j) * 3
        const lastIdx = (i * trailLength + Math.max(0, writePos - 1)) * 3
        posAttr.array[idx] = posAttr.array[lastIdx]
        posAttr.array[idx + 1] = posAttr.array[lastIdx + 1]
        posAttr.array[idx + 2] = posAttr.array[lastIdx + 2]
      }
    }
    posAttr.needsUpdate = true
  })

  if (!enabled) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={totalPoints}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={totalPoints}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function SceneContent({ viewType }: { viewType: ViewType }) {
  return (
    <>
      <color attach="background" args={['#050510']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Stars radius={80} depth={50} count={1000} factor={3} />
      <ParticleInstances />
      <TrailLines />
      {viewType === 'free' ? (
        <OrbitControls makeDefault enableDamping />
      ) : (
        <>
          <CameraSetup viewType={viewType} />
          <OrbitControls
            enableDamping
            enablePan={true}
            enableRotate={false}
            minDistance={5}
            maxDistance={80}
          />
        </>
      )}
    </>
  )
}

function GridLines() {
  const gridSize = 12
  const divisions = 12
  return (
    <group>
      <gridHelper args={[gridSize * 2, divisions, '#1a1a3e', '#0d0d2b']} position={[0, -gridSize, 0]} />
      <gridHelper args={[gridSize * 2, divisions, '#1a1a3e', '#0d0d2b']} rotation={[0, 0, Math.PI / 2]} position={[-gridSize, 0, 0]} />
      <gridHelper args={[gridSize * 2, divisions, '#1a1a3e', '#0d0d2b']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -gridSize]} />
    </group>
  )
}

function AxisLabels({ viewType }: { viewType: ViewType }) {
  if (viewType === 'free') return null

  const labels = useMemo(() => {
    switch (viewType) {
      case 'top':
        return [
          { text: '+X', pos: [14, 0, 0] as [number, number, number] },
          { text: '-X', pos: [-14, 0, 0] as [number, number, number] },
          { text: '+Z', pos: [0, 0, 14] as [number, number, number] },
          { text: '-Z', pos: [0, 0, -14] as [number, number, number] },
        ]
      case 'side':
        return [
          { text: '+Z', pos: [0, 0, 14] as [number, number, number] },
          { text: '-Z', pos: [0, 0, -14] as [number, number, number] },
          { text: '+Y', pos: [0, 14, 0] as [number, number, number] },
          { text: '-Y', pos: [0, -14, 0] as [number, number, number] },
        ]
      case 'front':
        return [
          { text: '+X', pos: [14, 0, 0] as [number, number, number] },
          { text: '-X', pos: [-14, 0, 0] as [number, number, number] },
          { text: '+Y', pos: [0, 14, 0] as [number, number, number] },
          { text: '-Y', pos: [0, -14, 0] as [number, number, number] },
        ]
      default:
        return []
    }
  }, [viewType])

  return (
    <group>
      {labels.map(l => (
        <mesh key={l.text} position={l.pos}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#4488ff" />
        </mesh>
      ))}
    </group>
  )
}

function ViewportCanvas({
  viewType,
  className,
  showLabel = true,
}: {
  viewType: ViewType
  className?: string
  showLabel?: boolean
}) {
  const config = VIEW_CONFIGS[viewType]
  const showGrid = viewType !== 'free'

  return (
    <div className={`relative ${className || ''}`}>
      <Canvas camera={{ position: viewType === 'free' ? [0, 0, 30] : [0, 35, 0], fov: 60 }}>
        <SceneContent viewType={viewType} />
        {showGrid && <GridLines />}
        {showGrid && <AxisLabels viewType={viewType} />}
      </Canvas>
      {showLabel && (
        <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 text-xs font-mono pointer-events-none flex items-center gap-1 z-10">
          <span>{config.icon}</span>
          <span className="text-gray-300">{config.label}</span>
        </div>
      )}
    </div>
  )
}

export function usePhysicsLoop() {
  const lastTimeRef = useRef(performance.now())
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const historyCounterRef = useRef(0)

  useEffect(() => {
    let rafId: number

    const loop = () => {
      rafId = requestAnimationFrame(loop)

      const now = performance.now()
      const delta = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      const state = useSimStore.getState()
      if (state.paused) return

      const dt = state.slowMotion ? delta * 0.1 : delta
      const clampedDt = Math.min(dt, 0.05)

      const updated = applyPhysics(
        state.particles, state.mode, state.gravity,
        state.damping, state.bounce, state.attractorStrength, clampedDt
      )

      let totalEnergy = 0
      for (const p of updated) {
        totalEnergy += 0.5 * p.mass * (p.velocity[0] ** 2 + p.velocity[1] ** 2 + p.velocity[2] ** 2)
      }

      useSimStore.setState({ particles: updated, totalEnergy })

      historyCounterRef.current++
      if (historyCounterRef.current >= 2) {
        historyCounterRef.current = 0
        state.recordHistory()
      }

      frameCountRef.current++
      if (now - lastFpsTimeRef.current >= 1000) {
        state.setFps(frameCountRef.current)
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])
}

export default function MultiViewCanvas() {
  const viewLayout = useSimStore(s => s.viewLayout)
  const singleView = useSimStore(s => s.singleView)

  usePhysicsLoop()

  if (viewLayout === 'single') {
    return (
      <div className="w-full h-full relative">
        <ViewportCanvas viewType={singleView} className="w-full h-full" />
      </div>
    )
  }

  if (viewLayout === 'triple') {
    return (
      <div className="w-full h-full flex flex-col bg-gray-900 gap-1 p-1">
        <ViewportCanvas viewType="free" className="flex-1 min-h-0" />
        <div className="flex gap-1 h-1/3 min-h-0">
          <ViewportCanvas viewType="top" className="flex-1" />
          <ViewportCanvas viewType="side" className="flex-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 bg-gray-900 p-1">
      <ViewportCanvas viewType="free" className="w-full h-full" />
      <ViewportCanvas viewType="top" className="w-full h-full" />
      <ViewportCanvas viewType="side" className="w-full h-full" />
      <ViewportCanvas viewType="front" className="w-full h-full" />
    </div>
  )
}
