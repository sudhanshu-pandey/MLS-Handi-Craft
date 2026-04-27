import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { setCategories } from '../../store/slices/filterSlice'
import styles from './CategoryGrid.module.css'

interface Category {
  _id?: string
  id?: number
  name: string
  slug: string
  image: string
}

interface CategoryGridProps {
  categories: Category[]
}

const CategoryGrid = memo(({ categories }: CategoryGridProps) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleCategoryClick = (category: Category) => {
    // Set the category filter
    dispatch(setCategories([category.name]))
    // Navigate to products page
    navigate('/products')
  }

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>Shop by Categories</h2>
        <div className={styles.grid}>
          {categories.map((category) => (
            <button
              key={category._id || category.id}
              onClick={() => handleCategoryClick(category)}
              className={styles.categoryCard}
              style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={category.image || `https://picsum.photos/seed/${category.slug}/240/240`}
                  alt={category.name}
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${category.slug}/240/240`
                  }}
                />
              </div>
              <h3>{category.name}</h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
})

CategoryGrid.displayName = 'CategoryGrid'

export default CategoryGrid