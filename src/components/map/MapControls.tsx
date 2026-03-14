'use client'

import { useMapStore } from '@/store/mapStore'
import { Pencil, Eraser } from 'lucide-react'

export default function MapControls() {
  const { isDrawMode, drawnPolygon, setIsDrawMode, setDrawnPolygon } = useMapStore()

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {!drawnPolygon ? (
        <button
          onClick={() => setIsDrawMode(!isDrawMode)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all duration-200 ${
            isDrawMode
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Pencil size={15} />
          {isDrawMode ? 'Drawing...' : 'Draw Area'}
        </button>
      ) : (
        <button
          onClick={() => { setDrawnPolygon(null); setIsDrawMode(false) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
        >
          <Eraser size={15} />
          Clear Area
        </button>
      )}
    </div>
  )
}
