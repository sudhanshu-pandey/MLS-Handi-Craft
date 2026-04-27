import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import styles from './ThemeSwitcher.module.css'

const colorClassMap = {
  brown: styles.dotBrown,
  terracotta: styles.dotTerracotta,
  olive: styles.dotOlive,
  blue: styles.dotBlue,
  green: styles.dotGreen,
  purple: styles.dotPurple,
  orange: styles.dotOrange,
  teal: styles.dotTeal,
  crimson: styles.dotCrimson,
  indigo: styles.dotIndigo,
  cocoa: styles.dotCocoa,
  mustard: styles.dotMustard,
  wine: styles.dotWine,
}

const ThemeSwitcher = () => {
  const { colors, activeColor, setActiveColor, themeMode, toggleThemeMode } = useTheme()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const primaryPalette = colors.slice(0, 3)
  const extendedPalette = colors.slice(3)

  return (
    <div className={styles.wrapper} aria-label="Theme switcher">
      <div className={styles.palette} role="group" aria-label="Choose theme color">
        {primaryPalette.map((color) => {
          const isActive = activeColor === color.key
          return (
            <button
              key={color.key}
              type="button"
              className={`${styles.colorDot} ${colorClassMap[color.key]} ${isActive ? styles.active : ''}`.trim()}
              onClick={() => setActiveColor(color.key)}
              aria-label={color.label}
              aria-pressed={isActive}
            />
          )
        })}

        {extendedPalette.length > 0 ? (
          <div className={styles.moreWrap}>
            <button
              type="button"
              className={styles.moreButton}
              onClick={() => setIsMoreOpen((prev) => !prev)}
              aria-label="Show more theme colors"
              aria-expanded={isMoreOpen}
            >
              +
            </button>

            {isMoreOpen ? (
              <div className={styles.extraPalette} role="group" aria-label="More theme colors">
                {extendedPalette.map((color) => {
                  const isActive = activeColor === color.key
                  return (
                    <button
                      key={color.key}
                      type="button"
                      className={`${styles.colorDot} ${colorClassMap[color.key]} ${isActive ? styles.active : ''}`.trim()}
                      onClick={() => {
                        setActiveColor(color.key)
                        setIsMoreOpen(false)
                      }}
                      aria-label={color.label}
                      aria-pressed={isActive}
                    />
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={`${styles.modeToggle} ${themeMode === 'dark' ? styles.dark : ''}`.trim()}
        onClick={toggleThemeMode}
        aria-label="Toggle dark mode"
      >
        <span className={styles.toggleThumb} />
      </button>

      <span className={styles.modeText}>{themeMode === 'dark' ? 'Dark' : 'Light'}</span>
    </div>
  )
}

export default ThemeSwitcher
