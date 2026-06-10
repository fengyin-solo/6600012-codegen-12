import { useSimStore } from '../store/simulation'
import type { SimMode, ViewType } from '../types'
import { VIEW_CONFIGS } from '../types'

const MODES: { value: SimMode; label: string; icon: string }[] = [
  { value: 'gravity', label: '重力吸引', icon: '🌍' },
  { value: 'collision', label: '弹性碰撞', icon: '💥' },
  { value: 'fluid', label: '流体模拟', icon: '💧' },
  { value: 'vortex', label: '漩涡旋转', icon: '🌀' },
]

const PRESETS = [
  { id: 'solar', name: '太阳系', params: { mode: 'gravity' as SimMode, gravity: 5, attractorStrength: 8, damping: 0.01, particleCount: 200 } },
  { id: 'billiards', name: '台球碰撞', params: { mode: 'collision' as SimMode, gravity: 0, damping: 0.005, bounce: 0.95, particleCount: 50 } },
  { id: 'lava', name: '熔岩灯', params: { mode: 'fluid' as SimMode, gravity: 3, damping: 0.05, particleCount: 150 } },
  { id: 'tornado', name: '龙卷风', params: { mode: 'vortex' as SimMode, gravity: 2, attractorStrength: 12, damping: 0.02, particleCount: 400 } },
]

export default function ControlPanel() {
  const store = useSimStore()

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto flex flex-col gap-4">
      <h2 className="text-lg font-bold text-white">粒子物理模拟器</h2>

      {/* View Layout */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">视角布局</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => store.setViewLayout('single')}
            className={`px-2 py-2 rounded text-sm font-medium transition ${
              store.viewLayout === 'single'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            单视角
          </button>
          <button
            onClick={() => store.setViewLayout('triple')}
            className={`px-2 py-2 rounded text-sm font-medium transition ${
              store.viewLayout === 'triple'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            三视角
          </button>
          <button
            onClick={() => store.setViewLayout('quad')}
            className={`px-2 py-2 rounded text-sm font-medium transition ${
              store.viewLayout === 'quad'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            四视角
          </button>
        </div>
      </div>

      {/* Trail Controls */}
      <div className="bg-gray-800/50 rounded p-3 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-200">
            ✨ 运动轨迹
          </label>
          <button
            onClick={() => store.setTrail({ enabled: !store.trail.enabled })}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              store.trail.enabled
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            {store.trail.enabled ? '开启' : '关闭'}
          </button>
        </div>
        {store.trail.enabled && (
          <>
            <div>
              <label className="text-xs text-gray-400">轨迹长度: {store.trail.length}</label>
              <input type="range" min={20} max={300} step={10}
                value={store.trail.length}
                onChange={e => store.setTrail({ length: Number(e.target.value) })}
                className="w-full accent-green-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400">轨迹透明度: {store.trail.opacity.toFixed(2)}</label>
              <input type="range" min={0.1} max={1} step={0.05}
                value={store.trail.opacity}
                onChange={e => store.setTrail({ opacity: Number(e.target.value) })}
                className="w-full accent-green-500" />
            </div>
          </>
        )}
      </div>

      {/* Single View Selector */}
      {store.viewLayout === 'single' && (
        <div>
          <label className="text-xs text-gray-400 block mb-1">当前视角</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(VIEW_CONFIGS) as ViewType[]).map(vt => (
              <button
                key={vt}
                onClick={() => store.setSingleView(vt)}
                className={`px-3 py-2 rounded text-sm font-medium transition ${
                  store.singleView === vt
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {VIEW_CONFIGS[vt].icon} {VIEW_CONFIGS[vt].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">模拟模式</label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => store.setMode(m.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                store.mode === m.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">预设场景</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => store.applyPreset(p.params)}
              className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-full"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Particle Count */}
      <div>
        <label className="text-xs text-gray-400">粒子数量: {store.particleCount}</label>
        <input type="range" min={10} max={800} step={10}
          value={store.particleCount}
          onChange={e => store.setParticleCount(Number(e.target.value))}
          className="w-full accent-blue-500" />
      </div>

      {/* Gravity */}
      <div>
        <label className="text-xs text-gray-400">重力: {store.gravity.toFixed(1)}</label>
        <input type="range" min={-20} max={20} step={0.5}
          value={store.gravity}
          onChange={e => store.setParam('gravity', Number(e.target.value))}
          className="w-full accent-green-500" />
      </div>

      {/* Damping */}
      <div>
        <label className="text-xs text-gray-400">阻尼: {store.damping.toFixed(3)}</label>
        <input type="range" min={0} max={0.5} step={0.005}
          value={store.damping}
          onChange={e => store.setParam('damping', Number(e.target.value))}
          className="w-full accent-yellow-500" />
      </div>

      {/* Bounce */}
      <div>
        <label className="text-xs text-gray-400">弹性: {store.bounce.toFixed(2)}</label>
        <input type="range" min={0} max={1} step={0.05}
          value={store.bounce}
          onChange={e => store.setParam('bounce', Number(e.target.value))}
          className="w-full accent-orange-500" />
      </div>

      {/* Attractor */}
      <div>
        <label className="text-xs text-gray-400">吸引力: {store.attractorStrength.toFixed(1)}</label>
        <input type="range" min={0} max={20} step={0.5}
          value={store.attractorStrength}
          onChange={e => store.setParam('attractorStrength', Number(e.target.value))}
          className="w-full accent-pink-500" />
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => store.setParam('paused', !store.paused)}
          className={`flex-1 py-2 rounded font-medium text-sm ${store.paused ? 'bg-green-600' : 'bg-red-600'} text-white`}
        >
          {store.paused ? '▶ 继续' : '⏸ 暂停'}
        </button>
        <button
          onClick={() => store.setParam('slowMotion', !store.slowMotion)}
          className={`flex-1 py-2 rounded font-medium text-sm ${store.slowMotion ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
        >
          🐌 慢动作
        </button>
      </div>
      <button
        onClick={() => store.reset()}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
      >
        🔄 重置粒子
      </button>
    </div>
  )
}
