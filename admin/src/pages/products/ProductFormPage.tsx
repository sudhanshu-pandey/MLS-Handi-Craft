import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ArrowUpTrayIcon, PhotoIcon, PlusIcon, XMarkIcon, FilmIcon, PlayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import RichTextEditor from '../../components/common/RichTextEditor'
import { productService } from '../../services/productService'
import { uploadService } from '../../services/uploadService'
import { MOCK_PRODUCTS } from '../../utils/mockData'
import { validatePrice, validateStock } from '../../utils/validation'
import type { ProductFormData } from '../../types'

const DEFAULT_CATEGORIES = ['Paintings', 'Pottery', 'Textiles', 'Metalcraft', 'Woodcraft', 'Jewelry', 'Handicrafts']

const INITIAL_FORM: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  images: [],
  videos: [],
  category: '',
  stock: 0,
  artisan: { name: '', region: '', craftType: '' },
  specifications: {},
  tags: [],
}

const normalizeSpecifications = (specifications: Record<string, any> | undefined) => {
  if (!specifications || typeof specifications !== 'object') {
    return {
      dimensions: '',
      weight: '',
      material: '',
      origin: '',
    }
  }
  
  return {
    dimensions: specifications.dimensions || specifications.dimension || '',
    weight: specifications.weight || '',
    material: specifications.material || specifications.category || '',
    origin: specifications.origin || specifications.countryOfOrigin || '',
  }
}

// Denormalize specifications for backend (map frontend names to backend schema)
const denormalizeSpecifications = (specs: Record<string, string> | undefined): Record<string, string> => {
  if (!specs) {
    return {
      dimension: '',
      weight: '',
      category: '',
      countryOfOrigin: '',
    }
  }
  
  return {
    dimension: specs.dimensions || specs.dimension || '',
    weight: specs.weight || '',
    category: specs.material || specs.category || '',
    countryOfOrigin: specs.origin || specs.countryOfOrigin || '',
  }
}

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM)
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [bulkImageUrls, setBulkImageUrls] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [bulkVideoUrls, setBulkVideoUrls] = useState('')
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isUploadingVideos, setIsUploadingVideos] = useState(false)
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await productService.getById(id)
        const p = res.data?.product || res.data
        const artisanData = p.artisan || p.artisanInfo || { name: '', region: '', craftType: '' }
        
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price || 0,
          originalPrice: p.originalPrice || 0,
          images: p.images || [],
          videos: p.videos || [],
          category: p.category || '',
          stock: p.stock || 0,
          artisan: {
            name: artisanData.name || '',
            region: artisanData.region || '',
            craftType: artisanData.craftType || '',
          },
          specifications: normalizeSpecifications(p.specifications),
          tags: p.tags || [],
        })
      } catch (err) {
        const mock = (MOCK_PRODUCTS as any[]).find(p => p._id === id)
        if (mock) {
          const artisanData = mock.artisan || mock.artisanInfo || { name: '', region: '', craftType: '' }
          setForm({
            name: mock.name,
            description: mock.description,
            price: mock.price,
            originalPrice: mock.originalPrice,
            images: mock.images,
            videos: mock.videos || [],
            category: mock.category,
            stock: mock.stock,
            artisan: {
              name: artisanData.name || '',
              region: artisanData.region || '',
              craftType: artisanData.craftType || '',
            },
            specifications: normalizeSpecifications(mock.specifications),
            tags: mock.tags || [],
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
      // Prepare form data with denormalized specifications for backend
      const submitData = {
        ...form,
        specifications: denormalizeSpecifications(form.specifications as any),
      }
      
      if (isEdit) {
        await productService.update(id, submitData)
      } else {
        await productService.create(submitData)
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

  const appendImages = (nextImages: string[]) => {
    if (!nextImages.length) return

    setForm(current => {
      const existing = current.images || []
      const uniqueNew = nextImages.filter(url => url && !existing.includes(url))
      if (!uniqueNew.length) {
        return current
      }

      return {
        ...current,
        images: [...existing, ...uniqueNew],
      }
    })
  }

  const addImage = () => {
    if (!imageUrl.trim()) return
    appendImages([imageUrl.trim()])
    setImageUrl('')
  }

  const addBulkImageUrls = () => {
    if (!bulkImageUrls.trim()) return

    const parsedUrls = bulkImageUrls
      .split(/\r?\n|,/) 
      .map(url => url.trim())
      .filter(Boolean)

    if (!parsedUrls.length) {
      toast.error('Please add at least one valid image URL')
      return
    }

    appendImages(parsedUrls)
    setBulkImageUrls('')
    toast.success(`${parsedUrls.length} image URL${parsedUrls.length > 1 ? 's' : ''} added`)
  }

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
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
  }

  const handleLaptopImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length) {
      toast.error('Please upload images smaller than 5MB each')
      event.target.value = ''
      return
    }

    setIsUploadingImages(true)
    try {
      // Upload images to AWS S3 and get URLs
      const uploadedImages = await uploadService.uploadMultiple(files)
      appendImages(uploadedImages)
      toast.success(`${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded from laptop`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload selected images'
      toast.error(message)
    } finally {
      setIsUploadingImages(false)
      event.target.value = ''
    }
  }

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images?.filter((_, i) => i !== idx) }))
  }

  const appendVideos = (nextVideos: string[]) => {
    if (!nextVideos.length) return

    setForm(current => {
      const existing = current.videos || []
      const uniqueNew = nextVideos.filter(url => url && !existing.includes(url))
      if (!uniqueNew.length) {
        return current
      }

      return {
        ...current,
        videos: [...existing, ...uniqueNew],
      }
    })
  }

  const addVideo = () => {
    if (!videoUrl.trim()) return
    appendVideos([videoUrl.trim()])
    setVideoUrl('')
  }

  const addBulkVideoUrls = () => {
    if (!bulkVideoUrls.trim()) return

    const parsedUrls = bulkVideoUrls
      .split(/\r?\n|,/)
      .map(url => url.trim())
      .filter(Boolean)

    if (!parsedUrls.length) {
      toast.error('Please add at least one valid video URL')
      return
    }

    appendVideos(parsedUrls)
    setBulkVideoUrls('')
    toast.success(`${parsedUrls.length} video URL${parsedUrls.length > 1 ? 's' : ''} added`)
  }

  const handleLaptopVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const oversizedFiles = files.filter(file => file.size > 100 * 1024 * 1024) // 100MB limit
    if (oversizedFiles.length) {
      toast.error('Please upload videos smaller than 100MB each')
      event.target.value = ''
      return
    }

    setIsUploadingVideos(true)
    try {
      // Upload videos to AWS S3 and get URLs
      const uploadedVideos = await uploadService.uploadMultipleVideos(files)
      appendVideos(uploadedVideos)
      toast.success(`${uploadedVideos.length} video${uploadedVideos.length > 1 ? 's' : ''} uploaded from laptop`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload selected videos'
      toast.error(message)
    } finally {
      setIsUploadingVideos(false)
      event.target.value = ''
    }
  }

  const removeVideo = (idx: number) => {
    setForm(f => ({ ...f, videos: f.videos?.filter((_, i) => i !== idx) }))
  }

  const getVideoThumbnail = (url: string) => {
    // Extract video ID from YouTube URL
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch?.[1]) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
    }
    // For other video types, return a placeholder
    return undefined
  }

  const addTag = () => {
    if (!tagInput.trim()) return
    setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }))
    setTagInput('')
  }

  const set = (field: keyof ProductFormData, value: unknown) => {
    // Validate numeric fields
    let sanitizedValue: any = value
    
    if ((field === 'price' || field === 'originalPrice') && typeof value === 'number') {
      sanitizedValue = validatePrice(value)
    } else if (field === 'stock' && typeof value === 'number') {
      sanitizedValue = validateStock(value)
    }
    
    setForm(f => ({ ...f, [field]: sanitizedValue }))
  }

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
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    onClick={() => setShowDescriptionPreview(prev => !prev)}
                  >
                    {showDescriptionPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
                <RichTextEditor
                  value={form.description}
                  onChange={value => set('description', value)}
                  placeholder="Describe the product, its origin, craft technique..."
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Supports bold, italic, underline, bullets, numbering, heading, quote, alignment, links, and images.
                </p>
                {showDescriptionPreview && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-900">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Live Preview</p>
                    <div
                      className="space-y-3 text-sm leading-7 text-gray-700 dark:text-slate-200 [&_a]:text-primary-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-h-52 [&_img]:rounded-md [&_img]:object-contain [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{ __html: form.description || '<p>No description yet.</p>' }}
                    />
                  </div>
                )}
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
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="input-field"
                    placeholder="Image URL (https://...)"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  />
                  <button type="button" onClick={addImage} className="btn-primary flex-shrink-0" title="Add this URL">
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  value={bulkImageUrls}
                  onChange={e => setBulkImageUrls(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Paste multiple image URLs (one per line or comma-separated)"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={addBulkImageUrls} className="btn-secondary text-sm">
                    Add Multiple URLs
                  </button>
                  <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-2">
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    {isUploadingImages ? 'Uploading...' : 'Upload From Laptop'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleLaptopImageUpload}
                      disabled={isUploadingImages}
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">You can select multiple images at once.</p>
                </div>
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

            {/* Videos */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Product Videos</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="input-field"
                    placeholder="Video URL (YouTube, Vimeo, or direct video link)"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideo())}
                  />
                  <button type="button" onClick={addVideo} className="btn-primary flex-shrink-0" title="Add this URL">
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  value={bulkVideoUrls}
                  onChange={e => setBulkVideoUrls(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Paste multiple video URLs (one per line or comma-separated)"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={addBulkVideoUrls} className="btn-secondary text-sm">
                    Add Multiple URLs
                  </button>
                  <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-2">
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    {isUploadingVideos ? 'Uploading...' : 'Upload From Laptop'}
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={handleLaptopVideoUpload}
                      disabled={isUploadingVideos}
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Max 100MB per video. Supports MP4, WebM, etc.</p>
                </div>
              </div>
              {form.videos?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.videos.map((video, i) => {
                    const thumbnail = getVideoThumbnail(video)
                    const isYoutube = video.includes('youtube.com') || video.includes('youtu.be')
                    
                    return (
                      <div key={i} className="relative group aspect-square">
                        {thumbnail ? (
                          <img src={thumbnail} className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-600" alt={`Video ${i + 1}`} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                            <FilmIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayIcon className="w-6 h-6 text-white" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVideo(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[9px] bg-primary-600 text-white px-1 py-0.5 rounded truncate max-w-[calc(100%-8px)]" title={isYoutube ? 'YouTube' : 'Video'}>
                          {isYoutube ? 'YouTube' : 'Video'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                  <FilmIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Add video URLs or upload from laptop</p>
                </div>
              )}
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
