# MohanJodero - E-Commerce Store

A modern React + Vite e-commerce website built with TypeScript, React Router, and CSS Modules.

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.12.2 or higher)
- npm (v10.5.0 or higher)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
handicraft/
├── src/
│   ├── components/
│   │   ├── TopHeader/          # Welcome banner
│   │   ├── Header/             # Logo & branding
│   │   ├── Navbar/             # Navigation menu
│   │   ├── Footer/             # Footer section
│   │   └── ProductCard/        # Product card component
│   ├── pages/
│   │   ├── Home.tsx            # Homepage
│   │   ├── Products.tsx        # Products listing
│   │   ├── ProductDetails.tsx  # Product details page
│   │   └── Cart.tsx            # Shopping cart
│   ├── styles/
│   │   └── globals.css         # Global styles with CSS variables
│   ├── utils/                  # Utility functions
│   ├── hooks/                  # Custom React hooks
│   ├── assets/                 # Images, fonts, etc.
│   ├── App.tsx                 # Main App component with routing
│   └── main.tsx                # Entry point
├── public/                      # Static files
├── index.html                   # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies

## 🎨 Color Theme

The project uses CSS variables for consistent styling:

```css
--primary-color: #603115        /* Brown/Terracotta */
--primary-dark: #4a2410
--primary-light: #8b4513
--secondary-color: #d4a574      /* Tan/Beige */
--secondary-light: #e8c4a0
```

## 📂 File Naming Conventions

- **Components:** PascalCase (e.g., `ProductCard.tsx`, `Header.tsx`)
- **Files:** Same as folder name for component files
- **CSS Modules:** `ComponentName.module.css`
- **Assets:** lowercase with hyphens (e.g., `product-image.jpg`)

## 🧩 Component Structure

Each component follows this pattern:

```
ComponentName/
├── ComponentName.tsx          # Main component logic
└── ComponentName.module.css   # Component styles
```

## 📝 Usage Examples

### Using useState Hook
```tsx
const [count, setCount] = useState(0)
```

### Using useEffect Hook
```tsx
useEffect(() => {
  // Side effect logic here
  return () => {
    // Cleanup if needed
  }
}, [dependencies])
```

### React Router Navigation
```tsx
import { Link } from 'react-router-dom'

<Link to="/products">Products</Link>
```

### Styling with CSS Modules
```tsx
import styles from './Component.module.css'

<div className={styles.container}>Content</div>
```

## 🛣️ Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Homepage with featured products |
| `/products` | Products | Product listing page |
| `/products/:id` | ProductDetails | Individual product details |
| `/cart` | Cart | Shopping cart page |

## 🚀 Best Practices Used

✅ Functional components only
✅ TypeScript for type safety
✅ React Router for navigation
✅ CSS Modules for scoped styling
✅ CSS Variables for theming
✅ Responsive design (Mobile-first)
✅ Modular and reusable components
✅ Proper state management with hooks
✅ PascalCase for component names
✅ ESM modules

## 💡 Next Steps

1. **Add products data:** Update mock data in `Products.tsx`
2. **Implement Cart Logic:** Add state management (Context API or Redux)
3. **API Integration:** Connect to backend API for products
4. **Authentication:** Add user login/signup
5. **Payment Integration:** Add payment gateway
6. **Image Optimization:** Replace placeholder images
7. **SEO:** Add meta tags and structured data
8. **Testing:** Add unit and integration tests

## 📚 Useful Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [CSS Modules](https://github.com/css-modules/css-modules)

## 📄 License

ISC

## 👨‍💻 Author

Your Name

---

**Happy Coding! 🎉**
