import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import styles from './ColorPalette.module.css'

const ColorPalette: React.FC = () => {
  const { colors, activeColor, setActiveColor } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)

  // Show only first 4 colors in the main grid
  const displayColors = colors.slice(0, 4)
  const extraColors = colors.slice(4)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className={styles.paletteContainer} ref={paletteRef}>
      <button
        type="button"
        className={styles.paletteToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle color palette"
        title="Change theme color"
      >
        <div className={styles.colorGrid}>
          {displayColors.map((color) => (
            <div
              key={color.key}
              className={`${styles.colorDot} ${activeColor === color.key ? styles.activeDot : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={(e) => {
                e.stopPropagation()
                setActiveColor(color.key)
                setIsOpen(false)
              }}
              title={color.label}
            />
          ))}
        </div>
      </button>

      {isOpen && extraColors.length > 0 && (
        <div className={styles.expandedPalette}>
          <div className={styles.allColors}>
            {extraColors.map((color) => (
              <button
                key={color.key}
                className={`${styles.expandedColor} ${activeColor === color.key ? styles.activeExpandedColor : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  setActiveColor(color.key)
                  setIsOpen(false)
                }}
                title={color.label}
                aria-label={`Choose ${color.label} theme`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPalette
