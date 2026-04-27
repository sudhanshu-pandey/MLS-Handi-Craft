import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PhotoIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { productService } from '../../services/productService'
import { MOCK_PRODUCTS } from '../../utils/mockData'
import type { ProductFormData } from '../../types'

const DEFAULT_CATEGORIES = ['Paintings', 'Pottery', 'Textiles', 'Metalcraft', 'Woodcraft', 'Jewelry', 'Handicrafts']

const INITIAL_FORM: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  images: [],
  category: '',
  stock: 0,
  artisan: { name: '', region: '', craftType: '' },
  specifications: {},
  tags: [],
}

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await productService.getById(id)
        const p = res.data?.product || res.data
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price || 0,
          originalPrice: p.originalPrice || 0,
          images: p.images || [],
          category: p.category || '',
          stock: p.stock || 0,
          artisan: p.artisan || p.artisanInfo || { name: '', region: '', craftType: '' },
          specifications: p.specifications || {},
          tags: p.tags || [],
        })
      } catch {
        const mock = (MOCK_PRODUCTS as any[]).find(p => p._id === id)
        if (mock) {
          setForm({
            name: mock.name, description: mock.description, price: mock.price,
            originalPrice: mock.originalPrice, images: mock.images, category: mock.category,
            stock: mock.stock, artisan: mock.artisan || { name: '', region: '', craftType: '' },
            specifications: mock.specifications || {}, tags: mock.tags || [],
          })
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.category || form.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }
    setIsSaving(true)
    try {
      if (isEdit) {
        await productService.update(id, form)
      } else {
        await productService.create(form)
      }
      toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`)
      navigate('/products')
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save product'
      toast.error(`Error: ${errorMsg}`)
      console.error('Product save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const addImage = () => {
    if (!imageUrl.trim()) return
    setForm(f => ({ ...f, images: [...(f.images || []), imageUrl.trim()] }))
    setImageUrl('')
  }

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images?.filter((_, i) => i !== idx) }))
  }

  const addTag = () => {
    if (!tagInput.trim()) return
    setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }))
    setTagInput('')
  }

  const set = (field: keyof ProductFormData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }))

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 skeleton w-48 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Product' : 'Add New Product'}
        subtitle={isEdit ? `Editing: ${form.name}` : 'Fill in the details to add a new product'}
        actions={
          <button onClick={() => navigate('/products')} className="btn-secondary text-sm">
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main fields */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Madhubani Painting - Village Scene"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Describe the product, its origin, craft technique..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Selling Price (&#8377;) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.price || ''}
                    onChange={e => set('price', Number(e.target.value))}
                    className="input-field"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Original Price (&#8377;)</label>
                  <input
                    type="number"
                    value={form.originalPrice || ''}
                    onChange={e => set('originalPrice', Number(e.target.value))}
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Product Images</h3>
              <div className="flex gap-2">
                <input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="input-field"
                  placeholder="Image URL (https://...)"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <button type="button" onClick={addImage} className="btn-primary flex-shrink-0">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              {form.images?.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={img} className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-600" alt={`Product image ${i + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded">Main</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                  <PhotoIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Add image URLs above</p>
                </div>
              )}
            </div>

            {/* Artisan Info */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Artisan Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Artisan Name</label>
                  <input
                    value={form.artisan?.name || ''}
                    onChange={e => set('artisan', { ...form.artisan, name: e.target.value })}
                    className="input-field"
                    placeholder="Craftsperson name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Region</label>
                  <input
                    value={form.artisan?.region || ''}
                    onChange={e => set('artisan', { ...form.artisan, region: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Madhubani, Bihar"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Craft Type</label>
                  <input
                    value={form.artisan?.craftType || ''}
                    onChange={e => set('artisan', { ...form.artisan, craftType: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Madhubani Painting, Dhokra casting"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Tags</h3>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  className="input-field"
                  placeholder="Add a tag..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button type="button" onClick={addTag} className="btn-secondary flex-shrink-0">Add</button>
              </div>
              {form.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
                      {tag}
                      <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags?.filter((_, j) => j !== i) }))}>
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Sidebar fields */}
          <div className="space-y-5">
            {/* Status & Category */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Product Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select category</option>
                  {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.stock || ''}
                  onChange={e => set('stock', Number(e.target.value))}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Specifications */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Specifications</h3>
              {(['Dimensions', 'Weight', 'Material', 'Origin'] as const).map(spec => (
                <div key={spec}>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{spec}</label>
                  <input
                    value={(form.specifications as any)?.[spec.toLowerCase()] || ''}
                    onChange={e => set('specifications', {
                      ...(form.specifications || {}),
                      [spec.toLowerCase()]: e.target.value,
                    })}
                    className="input-field text-sm py-1.5"
                    placeholder={`e.g., ${spec === 'Dimensions' ? '30x40 cm' : spec === 'Weight' ? '500g' : spec === 'Material' ? 'Canvas, natural colors' : 'Bihar, India'}`}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="card p-5 space-y-3">
              <button type="submit" disabled={isSaving} className="btn-primary w-full justify-center">
                {isSaving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="btn-secondary w-full justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
