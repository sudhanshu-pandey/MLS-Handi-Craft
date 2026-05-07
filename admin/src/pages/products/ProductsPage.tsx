import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import DataTable, { Column } from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Loader from '../../components/common/Loader'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { productService } from '../../services/productService'
import { MOCK_PRODUCTS } from '../../utils/mockData'
import type { Product, ProductFormData } from '../../types'

export default function ProductsPage() {
  const navigate = useNavigate()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
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

  const parseListField = (value: unknown) => {
    return String(value || '')
      .split(/[|,\n]/)
      .map(item => item.trim())
      .filter(Boolean)
  }

  const mapCsvRowToProduct = (row: Record<string, unknown>) => {
    const images = parseListField(row.images || row.image)
    const tags = parseListField(row.tags)

    const product: ProductFormData = {
      name: String(row.name || '').trim(),
      description: String(row.description || '').trim(),
      price: Number(row.price || 0),
      originalPrice: Number(row.originalPrice || row.original_price || 0),
      images,
      category: String(row.category || '').trim(),
      stock: Number(row.stock || 0),
      artisan: {
        name: String(row.artisanName || row.artisan_name || '').trim(),
        region: String(row.artisanRegion || row.artisan_region || '').trim(),
        craftType: String(row.artisanCraftType || row.artisan_craft_type || '').trim(),
      },
      specifications: {
        dimensions: String(row.dimensions || '').trim(),
        weight: String(row.weight || '').trim(),
        material: String(row.material || '').trim(),
        origin: String(row.origin || '').trim(),
      },
      tags,
    }

    return product
  }

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedRows = results.data
            .map(mapCsvRowToProduct)
            .filter(item => item.name && item.category && item.price > 0)

          if (!parsedRows.length) {
            toast.error('No valid products found in CSV. Required columns: name, price, category')
            return
          }

          let importedCount = 0
          const failedRows: string[] = []

          for (const [index, product] of parsedRows.entries()) {
            try {
              await productService.create(product)
              importedCount += 1
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to import row'
              failedRows.push(`Row ${index + 2}: ${message}`)
            }
          }

          if (importedCount > 0) {
            await loadProducts()
            toast.success(`${importedCount} product${importedCount > 1 ? 's' : ''} imported successfully`)
          }

          if (failedRows.length) {
            toast.error(failedRows[0])
          }
        } finally {
          setIsImporting(false)
          event.target.value = ''
        }
      },
      error: (error) => {
        setIsImporting(false)
        event.target.value = ''
        toast.error(error.message || 'Failed to parse CSV file')
      },
    })
  }

  const downloadSampleCsv = () => {
    const headers = [
      'name',
      'description',
      'price',
      'originalPrice',
      'category',
      'stock',
      'images',
      'tags',
      'artisanName',
      'artisanRegion',
      'artisanCraftType',
      'dimensions',
      'weight',
      'material',
      'origin',
    ]

    const sampleRows = [
      [
        'Madhubani Painting',
        'Traditional folk art painting from Bihar',
        '2499',
        '2999',
        'Paintings',
        '12',
        'https://example.com/madhubani-1.jpg|https://example.com/madhubani-2.jpg',
        'folk art|wall decor|handmade',
        'Sita Devi',
        'Madhubani, Bihar',
        'Madhubani Painting',
        '30x40 cm',
        '500g',
        'Handmade paper, natural colors',
        'Bihar, India',
      ],
    ]

    const csv = [headers.join(','), ...sampleRows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'product-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return <Loader message="Loading products..." />
  }

  return (
    <div className="space-y-6">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImportCsv}
      />
      <PageHeader
        title="Products"
        subtitle={`${stats.total} total products`}
        actions={
          <>
            <button
              className="btn-secondary text-sm"
              type="button"
              onClick={downloadSampleCsv}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Sample CSV
            </button>
            <button
              className="btn-secondary text-sm"
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Import CSV'}
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
