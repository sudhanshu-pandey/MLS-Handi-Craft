import { useState, useEffect } from 'react'
import { ArrowUpTrayIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { bannerService } from '../../services/bannerService'
import type { Banner } from '../../types'

interface BannerForm { title: string; subtitle: string; image: string; images: string[]; link: string; order: number; isActive: boolean }
const EMPTY_FORM: BannerForm = { title: '', subtitle: '', image: '', images: [], link: '', order: 1, isActive: true }

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
  images: Array.isArray(raw.images) ? raw.images.map(item => String(item || '')).filter(Boolean) : [],
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
  const [bulkImageUrls, setBulkImageUrls] = useState('')
  const [imageOptions, setImageOptions] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
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

  const openCreate = () => {
    setEditBanner(null)
    setForm({ ...EMPTY_FORM, order: banners.length + 1 })
    setModalOpen(true)
  }

  const openEdit = (b: Banner) => {
    setEditBanner(b)
    setForm({ title: b.title, subtitle: b.subtitle || '', image: b.image || '', images: b.image ? [b.image] : [], link: b.link || '', order: b.order, isActive: b.isActive })
    setModalOpen(true)
  }

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unable to read selected file'))
    }
    reader.onerror = () => reject(new Error('File upload failed while reading image'))
    reader.readAsDataURL(file)
  })

  const handleBannerImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files || [])
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please upload an image smaller than 5MB')
      event.target.value = ''
      return
    }

    setIsUploadingImages(true)
    try {
      const uploadedImage = await readFileAsDataUrl(file)
      setForm(current => ({
        ...current,
        image: uploadedImage,
        images: [uploadedImage],
      }))
      setImageOptions([uploadedImage])
      toast.success('Banner image uploaded from laptop')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload selected images'
      toast.error(message)
    } finally {
      setIsUploadingImages(false)
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.image) return toast.error('Title and image are required')
    
    setIsSaving(true)

    const payload = {
      title: form.title,
      description: form.subtitle || form.title,
      subtitle: form.subtitle,
      image: form.image,
      images: form.image ? [form.image] : [],
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
              <div className="group relative w-full sm:w-48 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                <img
                  src={(banner.images?.[0] || banner.image)}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${banner._id}/200/100` }}
                />
                {(banner.images?.length || 0) > 1 && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                    +{(banner.images?.length || 1) - 1}
                  </span>
                )}

                {(banner.images?.length || 0) > 1 && (
                  <div className="pointer-events-none absolute inset-x-2 bottom-2 hidden items-center gap-1 rounded-md bg-black/60 p-1 group-hover:flex">
                    {banner.images?.slice(1, 4).map((img, imgIdx) => (
                      <img
                        key={`${banner._id}-hover-${imgIdx}`}
                        src={img}
                        alt={`${banner.title} preview ${imgIdx + 1}`}
                        className="h-7 w-7 rounded object-cover ring-1 ring-white/40"
                        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${banner._id}-${imgIdx}/80` }}
                      />
                    ))}
                  </div>
                )}
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
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image URL *</label><input value={form.image} onChange={e => { const value = e.target.value; setForm(f => ({ ...f, image: value, images: value ? [value] : [] })); setImageOptions(value ? [value] : []) }} className="input-field" placeholder="https://..." /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Upload Banner Image</label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-2">
                <ArrowUpTrayIcon className="w-4 h-4" />
                {isUploadingImages ? 'Uploading...' : 'Upload From Laptop'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingImages}
                  onChange={handleBannerImageUpload}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Only one banner image can be selected at a time.</p>
          </div>
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
