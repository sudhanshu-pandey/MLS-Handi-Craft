import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { bannerService } from '../../services/bannerService'
import type { Banner } from '../../types'

interface BannerForm { title: string; subtitle: string; image: string; link: string; order: number; isActive: boolean }
const EMPTY_FORM: BannerForm = { title: '', subtitle: '', image: '', link: '', order: 1, isActive: true }

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

const normalizeBanner = (raw: Record<string, unknown>): Banner => ({
  _id: String(raw._id || ''),
  title: String(raw.title || ''),
  subtitle: String(raw.subtitle || raw.description || ''),
  image: String(raw.image || ''),
  link: String(raw.link || ''),
  order: Number(raw.order || 0),
  isActive: typeof raw.isActive === 'boolean' ? raw.isActive : Boolean(raw.active ?? true),
  createdAt: String(raw.createdAt || new Date().toISOString()),
})

const extractBannerList = (payload: unknown): Banner[] => {
  const body = payload as { data?: unknown; banners?: unknown }
  const source = body?.data && typeof body.data === 'object'
    ? ((body.data as { banners?: unknown; data?: unknown }).banners || (body.data as { data?: unknown }).data || body.data)
    : (body?.banners || body?.data || payload)

  if (!Array.isArray(source)) return []
  return source
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map(normalizeBanner)
}

const extractBannerItem = (payload: unknown): Banner | null => {
  const body = payload as { data?: unknown; banner?: unknown }
  const source = body?.data && typeof body.data === 'object'
    ? ((body.data as { banner?: unknown; data?: unknown }).banner || (body.data as { data?: unknown }).data || body.data)
    : (body?.banner || body?.data || payload)

  if (!source || typeof source !== 'object') return null
  return normalizeBanner(source as Record<string, unknown>)
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await bannerService.getAll()
        const data = extractBannerList(res.data)
        setBanners(data.sort((a, b) => a.order - b.order))
      } catch (error) {
        setBanners([])
        toast.error(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const openCreate = () => { setEditBanner(null); setForm({ ...EMPTY_FORM, order: banners.length + 1 }); setModalOpen(true) }
  const openEdit = (b: Banner) => { setEditBanner(b); setForm({ title: b.title, subtitle: b.subtitle || '', image: b.image, link: b.link || '', order: b.order, isActive: b.isActive }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.title || !form.image) return toast.error('Title and image are required')
    setIsSaving(true)

    const payload = {
      title: form.title,
      description: form.subtitle || form.title,
      subtitle: form.subtitle,
      image: form.image,
      link: form.link,
      order: form.order,
      active: form.isActive,
      isActive: form.isActive,
    }

    try {
      if (editBanner) {
        const res = await bannerService.update(editBanner._id, payload)
        const updated = extractBannerItem(res.data)
        if (!updated) throw new Error('Invalid banner response from server')
        setBanners(prev => prev.map(b => b._id === editBanner._id ? updated : b).sort((a, b) => a.order - b.order))
        toast.success('Banner updated')
      } else {
        const res = await bannerService.create(payload)
        const nb = extractBannerItem(res.data)
        if (!nb) throw new Error('Invalid banner response from server')
        setBanners(prev => [...prev, nb].sort((a, b) => a.order - b.order))
        toast.success('Banner created')
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
    try {
      await bannerService.delete(deleteId)
      setBanners(prev => prev.filter(b => b._id !== deleteId))
      toast.success('Banner deleted')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Banners" subtitle={`${banners.length} banners`} actions={
        <button onClick={openCreate} className="btn-primary text-sm"><PlusIcon className="w-4 h-4" />Add Banner</button>
      } />

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-4 h-24 skeleton" />)}</div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, idx) => (
            <div key={banner._id} className="card overflow-hidden flex flex-col sm:flex-row">
              <div className="w-full sm:w-48 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${banner._id}/200/100` }} />
              </div>
              <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">#{banner.order}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{banner.title}</h3>
                    {banner.isActive ? <Badge variant="success" dot>Active</Badge> : <Badge variant="neutral" dot>Inactive</Badge>}
                  </div>
                  {banner.subtitle && <p className="text-sm text-gray-500">{banner.subtitle}</p>}
                  {banner.link && <p className="text-xs text-primary-600 mt-1">&#8594; {banner.link}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(banner)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(banner._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🖼️</p>
              <p className="text-gray-500">No banners yet. Add your first banner!</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editBanner ? 'Edit Banner' : 'Add Banner'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : editBanner ? 'Update' : 'Create'}</button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subtitle</label><input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image URL *</label><input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="input-field" placeholder="https://..." /></div>
          {form.image && <img src={form.image} className="w-full h-24 object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link URL</label><input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className="input-field" placeholder="/products" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Order</label><input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className="input-field" min="1" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600" /><span className="text-sm text-gray-700 dark:text-gray-300">Active</span></label>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Banner" message="Delete this banner?" confirmText="Delete" variant="danger" />
    </div>
  )
}
