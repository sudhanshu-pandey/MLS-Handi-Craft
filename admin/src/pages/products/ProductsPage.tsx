import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import DataTable, { Column } from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { productService } from '../../services/productService'
import { MOCK_PRODUCTS } from '../../utils/mockData'
import type { Product } from '../../types'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await productService.getAll({ limit: 100 })
      const data = res.data?.products || res.data?.data || res.data
      setProducts(Array.isArray(data) ? data : MOCK_PRODUCTS)
    } catch {
      setProducts(MOCK_PRODUCTS as unknown as Product[])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await productService.delete(deleteId)
      setProducts(prev => prev.filter(p => p._id !== deleteId))
      toast.success('Product deleted successfully')
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete product'
      toast.error(errorMsg)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const getStockVariant = (stock: number) => {
    if (stock === 0) return 'danger'
    if (stock < 5) return 'warning'
    return 'success'
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products.filter(p => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (filterStock === 'low' && p.stock >= 5) return false
    if (filterStock === 'out' && p.stock !== 0) return false
    return true
  })

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-3">
          <img
            src={row.images?.[0] || `https://picsum.photos/seed/${row._id}/40`}
            alt={row.name}
            className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate max-w-48">{row.name}</p>
            <p className="text-xs text-gray-500 truncate">{(row as unknown as { artisanInfo?: { region?: string } }).artisanInfo?.region || row.artisan?.region || row.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: row => <Badge variant="info">{row.category}</Badge>,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: row => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(row.price)}</p>
          {row.originalPrice > row.price && (
            <p className="text-xs text-gray-400 line-through">{formatCurrency(row.originalPrice)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-2">
          <Badge variant={getStockVariant(row.stock)} dot>
            {row.stock === 0 ? 'Out of stock' : `${row.stock} units`}
          </Badge>
          {row.stock < 5 && row.stock > 0 && (
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-1">
          <span className="text-yellow-400">★</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.rating}</span>
          <span className="text-xs text-gray-400">({row.reviewCount})</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      sortable: true,
      render: row => <span className="text-xs text-gray-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/products/edit/${row._id}`) }}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDeleteId(row._id) }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const stats = {
    total: products.length,
    outOfStock: products.filter(p => p.stock === 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 5).length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle={`${stats.total} total products`}
        actions={
          <>
            <button className="btn-secondary text-sm">
              <ArrowUpTrayIcon className="w-4 h-4" />
              Import CSV
            </button>
            <button onClick={() => navigate('/products/new')} className="btn-primary text-sm">
              <PlusIcon className="w-4 h-4" />
              Add Product
            </button>
          </>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.total, color: 'text-blue-600' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-600' },
          { label: 'Low Stock', value: stats.lowStock, color: 'text-yellow-600' },
          { label: 'Inventory Value', value: formatCurrency(stats.totalValue), color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-field py-1.5 text-sm w-40"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Stock Status</label>
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value)}
            className="input-field py-1.5 text-sm w-40"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock ({'<'}5)</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          {filteredProducts.length} products shown
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredProducts as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search products..."
        pageSize={10}
        onRowClick={row => navigate(`/products/edit/${(row as unknown as Product)._id}`)}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
