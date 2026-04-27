import styles from './TopHeader.module.css'

const TopHeader = () => {
  return (
    <div className={styles.topHeader}>
      <div className={styles.tickerWrapper}>
        <p className={styles.promotionText}>
          🎉&nbsp; Prepaid Orders Get Extra 5% OFF &nbsp;|&nbsp; Faster Dispatch &nbsp;|&nbsp; No COD Hassles &nbsp;🎉
        </p>
      </div>
    </div>
  )
}

export default TopHeader
