import MultiViewCanvas from './components/MultiViewCanvas'
import ControlPanel from './components/ControlPanel'
import StatsOverlay from './components/StatsOverlay'

export default function App() {
  return (
    <div className="flex w-full h-full">
      <div className="flex-1 relative">
        <MultiViewCanvas />
        <StatsOverlay />
      </div>
      <ControlPanel />
    </div>
  )
}
