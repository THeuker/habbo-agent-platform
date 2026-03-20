import { useState, useEffect } from 'react'

const DIRECTIONS = [2, 3, 4, 3, 2, 1, 0, 1]
// Unique directions to preload (avoid duplicates)
const UNIQUE_DIRS = [...new Set(DIRECTIONS)] // [2, 3, 4, 1, 0]

export function HabboFigure({ figure, size = 'md', animate = true, className = '' }) {
  const [dirIndex, setDirIndex] = useState(0)

  const sizes = {
    sm: { width: 40, height: 64 },
    md: { width: 64, height: 110 },
    lg: { width: 80, height: 140 },
  }
  const { width, height } = sizes[size] || sizes.md

  useEffect(() => {
    if (!animate || !figure) return
    const id = setInterval(() => setDirIndex(i => (i + 1) % DIRECTIONS.length), 600)
    return () => clearInterval(id)
  }, [animate, figure])

  const currentDir = animate ? DIRECTIONS[dirIndex] : 2

  if (!figure) return (
    <div style={{ width, height }} className={`rounded bg-muted flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="text-muted-foreground text-xs">?</span>
    </div>
  )

  // Render all unique directions stacked — only current one is visible.
  // This preloads every frame so direction changes are instant with no flash.
  return (
    <div style={{ width, height, position: 'relative' }} className={`flex-shrink-0 ${className}`}>
      {UNIQUE_DIRS.map(dir => (
        <img
          key={dir}
          src={`/api/figure?figure=${encodeURIComponent(figure)}&direction=${dir}&head_direction=${dir}&v=3`}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width,
            height,
            imageRendering: 'pixelated',
            opacity: dir === currentDir ? 1 : 0,
            transition: 'opacity 0.06s ease',
          }}
        />
      ))}
    </div>
  )
}
