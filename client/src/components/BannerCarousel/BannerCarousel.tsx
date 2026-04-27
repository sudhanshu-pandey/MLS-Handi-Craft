import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useBanners from '../../hooks/useBanners';
import styles from './BannerCarousel.module.css';

const BannerCarousel = () => {
  const { banners, loading, error } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate banners every 3 seconds
  useEffect(() => {
    if (banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [banners.length]);

  // Handle next banner
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  // Handle previous banner
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  if (loading) {
    return (
      <section className={styles.carouselContainer}>
        <div className={styles.loadingPlaceholder}>
          <p>Loading banners...</p>
        </div>
      </section>
    );
  }

  if (error || banners.length === 0) {
    return (
      <section className={styles.carouselContainer}>
        <div className={styles.errorPlaceholder}>
          <p>{error || 'No banners available'}</p>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className={styles.carouselContainer}>
      <div className={styles.carousel}>
        {/* Banner Image */}
        <img
          src={currentBanner.image}
          alt={currentBanner.title}
          className={styles.bannerImage}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=Banner';
          }}
        />

        {/* Content Overlay */}
        <div className={styles.contentOverlay}>
          <div className={styles.content}>
            <h1 className={styles.title}>{currentBanner.title}</h1>
            <p className={styles.description}>{currentBanner.description}</p>
            <Link to={currentBanner.link} className={styles.ctaButton}>
              {currentBanner.buttonText}
            </Link>
          </div>
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev} aria-label="Previous banner">
              &#10094;
            </button>
            <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext} aria-label="Next banner">
              &#10095;
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className={styles.dotsContainer}>
            {banners.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BannerCarousel;
