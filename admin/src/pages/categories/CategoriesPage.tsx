import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import DataTable, { Column } from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/formatters'
import { categoryService } from '../../services/categoryService'
import type { Category } from '../../types'

interface CatForm { name: string; slug: string; description: string; image: string; isActive: boolean }
const EMPTY_FORM: CatForm = { name: '', slug: '', description: '', image: '', isActive: true }

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return maybeAxiosError.response?.data?.message || maybeAxiosError.message || 'Something went wrong'
  }
  return 'Something went wrong'
}

const normalizeCategory = (raw: Record<string, unknown>): Category => ({
  _id: String(raw._id || ''),
  name: String(raw.name || ''),
  slug: String(raw.slug || ''),
  description: String(raw.description || ''),
  image: String(raw.image || ''),
  isActive: typeof raw.isActive === 'boolean' ? raw.isActive : Boolean(raw.active ?? true),
  productCount: Number(raw.productCount || 0),
  createdAt: String(raw.createdAt || new Date().toISOString()),
})

const extractCategoryList = (payload: unknown): Category[] => {
  const body = payload as { data?: unknown; categories?: unknown }
  const source = body?.data && typeof body.data === 'object'
    ? ((body.data as { categories?: unknown; data?: unknown }).categories || (body.data as { data?: unknown }).data || body.data)
    : (body?.categories || body?.data || payload)

  if (!Array.isArray(source)) return []
  return source
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map(normalizeCategory)
}

const extractCategoryItem = (payload: unknown): Category | null => {
  const body = payload as { data?: unknown; category?: unknown }
  const source = body?.data && typeof body.data === 'object'
    ? ((body.data as { category?: unknown; data?: unknown }).category || (body.data as { data?: unknown }).data || body.data)
    : (body?.category || body?.data || payload)

  if (!source || typeof source !== 'object') return null
  return normalizeCategory(source as Record<string, unknown>)
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CatForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await categoryService.getAll()
        const data = extractCategoryList(res.data)
        setCategories(data)
      } catch (error) {
        setCategories([])
        toast.error(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const openCreate = () => { setEditCat(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (cat: Category) => {
    setEditCat(cat)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', image: cat.image || '', isActive: cat.isActive })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) return toast.error('Name and slug are required')
    setIsSaving(true)

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      image: form.image,
      active: form.isActive,
      isActive: form.isActive,
    }

    try {
      if (editCat) {
        const res = await categoryService.update(editCat._id, payload)
        const updated = extractCategoryItem(res.data)
        if (!updated) throw new Error('Invalid category response from server')
        setCategories(prev => prev.map(c => c._id === editCat._id ? updated : c))
        toast.success('Category updated')
      } else {
        const res = await categoryService.create(payload)
        const newCat = extractCategoryItem(res.data)
        if (!newCat) throw new Error('Invalid category response from server')
        setCategories(prev => [...prev, newCat])
        toast.success('Category created')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
      setModalOpen(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await categoryService.delete(deleteId)
      setCategories(prev => prev.filter(c => c._id !== deleteId))
      toast.success('Category deleted')
      setDeleteId(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Name', sortable: true, render: row => <span className="font-semibold text-gray-900 dark:text-white">{row.name}</span> },
    { key: 'slug', header: 'Slug', render: row => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">{row.slug}</code> },
    { key: 'description', header: 'Description', render: row => <span className="text-sm text-gray-500 truncate max-w-52 block">{row.description || '-'}</span> },
    { key: 'productCount', header: 'Products', sortable: true, render: row => <Badge variant="info">{row.productCount || 0} products</Badge> },
    { key: 'isActive', header: 'Status', render: row => row.isActive ? <Badge variant="success" dot>Active</Badge> : <Badge variant="neutral" dot>Inactive</Badge> },
    { key: 'createdAt', header: 'Created', sortable: true, render: row => <span className="text-xs text-gray-500">{formatDate(row.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions', render: row => (
        <div className="flex items-center gap-1.5">
          <button onClick={e => { e.stopPropagation(); openEdit(row) }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><PencilIcon className="w-4 h-4" /></button>
          <button onClick={e => { e.stopPropagation(); setDeleteId(row._id) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><TrashIcon className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" subtitle={`${categories.length} categories`} actions={
        <button onClick={openCreate} className="btn-primary text-sm"><PlusIcon className="w-4 h-4" />Add Category</button>
      } />
      <DataTable columns={columns} data={categories as unknown as Record<string, unknown>[]} isLoading={isLoading} searchable searchPlaceholder="Search categories..." pageSize={10} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCat ? 'Edit Category' : 'Add Category'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : editCat ? 'Update' : 'Create'}</button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="input-field" placeholder="e.g., Paintings" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug *</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="input-field" placeholder="e.g., paintings" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field resize-none" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image URL</label>
            <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="input-field" placeholder="https://..." />
          </div>
          {form.image && (
            <img
              src={form.image}
              alt={form.name || 'Category preview'}
              className="w-full h-24 object-cover rounded-lg"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="Delete this category? Products in it will be uncategorized." confirmText="Delete" variant="danger" isLoading={isDeleting} />
    </div>
  )
}
