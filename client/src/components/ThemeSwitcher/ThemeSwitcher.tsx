import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import styles from './ThemeSwitcher.module.css'

const colorClassMap: Record<string, string> = {
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

        {extendedPalette.length > 0 && (
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

            {isMoreOpen && (
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
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.modeToggle}
        onClick={toggleThemeMode}
        aria-label="Toggle dark mode"
        title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {themeMode === 'dark' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.modeIcon}>
            <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.modeIcon}>
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default ThemeSwitcher
