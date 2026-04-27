import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import DataTable, { Column } from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { couponService } from '../../services/couponService'
import type { Coupon } from '../../types'

interface CouponForm {
  description: string
  code: string; discountType: 'percentage' | 'fixed'; discountValue: number
  minOrderAmount: number; maxDiscount?: number; usageLimit?: number; expiryDate: string; isActive: boolean
}
const EMPTY_FORM: CouponForm = { description: '', code: '', discountType: 'percentage', discountValue: 0, minOrderAmount: 0, maxDiscount: undefined, usageLimit: undefined, expiryDate: '', isActive: true }

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

const normalizeCoupon = (raw: Record<string, unknown>): Coupon => ({
  _id: String(raw._id || ''),
  code: String(raw.code || ''),
  discountType: (raw.discountType === 'fixed' ? 'fixed' : 'percentage'),
  discountValue: Number(raw.discountValue || 0),
  minOrderAmount: Number(raw.minOrderAmount || 0),
  maxDiscount: raw.maxDiscount !== undefined
    ? Number(raw.maxDiscount)
    : (raw.maxDiscountAmount !== undefined ? Number(raw.maxDiscountAmount) : undefined),
  usageLimit: raw.usageLimit !== undefined ? Number(raw.usageLimit) : undefined,
  usedCount: raw.usedCount !== undefined ? Number(raw.usedCount) : Number(raw.usageCount || 0),
  expiryDate: raw.expiryDate ? String(raw.expiryDate) : undefined,
  isActive: typeof raw.isActive === 'boolean' ? raw.isActive : Boolean(raw.active ?? true),
  createdAt: String(raw.createdAt || new Date().toISOString()),
})

const extractCouponList = (payload: unknown): Coupon[] => {
  const body = payload as { data?: unknown; coupons?: unknown }
  const source = body?.data && typeof body.data === 'object'
    ? ((body.data as { coupons?: unknown; data?: unknown }).coupons || (body.data as { data?: unknown }).data || body.data)
    : (body?.coupons || body?.data || payload)

  if (!Array.isArray(source)) return []
  return source
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map(normalizeCoupon)
}

const extractCouponItem = (payload: unknown): Coupon | null => {
  const body = payload as { data?: unknown; coupon?: unknown }
  const source = body?.data && typeof body.data === 'object'
    ? ((body.data as { coupon?: unknown; data?: unknown }).coupon || (body.data as { data?: unknown }).data || body.data)
    : (body?.coupon || body?.data || payload)

  if (!source || typeof source !== 'object') return null
  return normalizeCoupon(source as Record<string, unknown>)
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await couponService.getAll()
        const data = extractCouponList(res.data)
        setCoupons(data)
      } catch (error) {
        setCoupons([])
        toast.error(getErrorMessage(error))
      }
      finally { setIsLoading(false) }
    }
    load()
  }, [])

  const openCreate = () => { setEditCoupon(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (c: Coupon) => {
    setEditCoupon(c)
    setForm({
      description: '',
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || 0,
      maxDiscount: c.maxDiscount,
      usageLimit: c.usageLimit,
      expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : '',
      isActive: c.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.discountValue) return toast.error('Code and discount value required')
    setIsSaving(true)
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      maxDiscountAmount: form.maxDiscount,
    }
    try {
      if (editCoupon) {
        const res = await couponService.update(editCoupon._id, payload)
        const updated = extractCouponItem(res.data)
        if (!updated) throw new Error('Invalid coupon response from server')
        setCoupons(prev => prev.map(c => c._id === editCoupon._id ? updated : c))
        toast.success('Coupon updated')
      } else {
        const res = await couponService.create(payload)
        const nc = extractCouponItem(res.data)
        if (!nc) throw new Error('Invalid coupon response from server')
        setCoupons(prev => [nc, ...prev])
        toast.success('Coupon created')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally { setIsSaving(false); setModalOpen(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await couponService.delete(deleteId)
      setCoupons(prev => prev.filter(c => c._id !== deleteId))
      toast.success('Coupon deleted')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
    setDeleteId(null)
  }

  const isExpired = (c: Coupon) => c.expiryDate ? new Date(c.expiryDate) < new Date() : false
  const isExhausted = (c: Coupon) => c.usageLimit !== undefined && c.usedCount >= c.usageLimit

  const columns: Column<Coupon>[] = [
    {
      key: 'code', header: 'Code', sortable: true, render: row => (
        <div className="flex items-center gap-2">
          <code className="font-mono font-bold text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">{row.code}</code>
          <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(row.code); toast.success('Copied!') }} className="text-gray-400 hover:text-gray-600">
            <ClipboardDocumentIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'discountValue', header: 'Discount', sortable: true, render: row => (
        <span className="font-semibold text-primary-600">
          {row.discountType === 'percentage' ? `${row.discountValue}% OFF` : `₹${row.discountValue} OFF`}
        </span>
      ),
    },
    { key: 'minOrderAmount', header: 'Min Order', render: row => row.minOrderAmount ? formatCurrency(row.minOrderAmount) : <span className="text-gray-400">No min</span> },
    {
      key: 'usedCount', header: 'Usage', render: row => (
        <div>
          <span className="font-medium text-gray-900 dark:text-white">{row.usedCount}</span>
          {row.usageLimit && <span className="text-gray-400"> / {row.usageLimit}</span>}
        </div>
      ),
    },
    { key: 'expiryDate', header: 'Expiry', render: row => row.expiryDate ? <span className={`text-xs ${isExpired(row) ? 'text-red-500' : 'text-gray-500'}`}>{formatDate(row.expiryDate)}</span> : <span className="text-gray-400 text-xs">No expiry</span> },
    {
      key: 'isActive', header: 'Status', render: row => {
        if (isExpired(row)) return <Badge variant="danger" dot>Expired</Badge>
        if (isExhausted(row)) return <Badge variant="neutral" dot>Exhausted</Badge>
        return row.isActive ? <Badge variant="success" dot>Active</Badge> : <Badge variant="neutral" dot>Inactive</Badge>
      },
    },
    {
      key: 'actions', header: '', render: row => (
        <div className="flex items-center gap-1.5">
          <button onClick={e => { e.stopPropagation(); openEdit(row) }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><PencilIcon className="w-4 h-4" /></button>
          <button onClick={e => { e.stopPropagation(); setDeleteId(row._id) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><TrashIcon className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" subtitle={`${coupons.length} coupons`} actions={
        <button onClick={openCreate} className="btn-primary text-sm"><PlusIcon className="w-4 h-4" />Create Coupon</button>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: coupons.length, color: 'text-blue-600' },
          { label: 'Active', value: coupons.filter(c => c.isActive && !isExpired(c) && !isExhausted(c)).length, color: 'text-green-600' },
          { label: 'Expired', value: coupons.filter(c => isExpired(c)).length, color: 'text-red-600' },
          { label: 'Total Used', value: coupons.reduce((s, c) => s + c.usedCount, 0), color: 'text-primary-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={coupons as unknown as Record<string, unknown>[]} isLoading={isLoading} searchable searchPlaceholder="Search coupons..." pageSize={10} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCoupon ? 'Edit Coupon' : 'Create Coupon'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : editCoupon ? 'Update' : 'Create'}</button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Coupon Code *</label>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="input-field font-mono" placeholder="SAVE20" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" placeholder="Optional coupon description" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value === 'fixed' ? 'fixed' : 'percentage' }))} className="input-field">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Value *</label>
              <input type="number" value={form.discountValue || ''} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} className="input-field" min="0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Min Order (₹)</label>
              <input type="number" value={form.minOrderAmount || ''} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))} className="input-field" min="0" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Discount (₹)</label>
              <input type="number" value={form.maxDiscount || ''} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value ? Number(e.target.value) : undefined }))} className="input-field" placeholder="Optional" min="0" disabled={form.discountType === 'fixed'} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Usage Limit</label>
              <input type="number" value={form.usageLimit || ''} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : undefined }))} className="input-field" placeholder="Unlimited" min="1" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date</label>
            <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="input-field" /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600" /><span className="text-sm text-gray-700 dark:text-gray-300">Active</span></label>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Coupon" message="Delete this coupon?" confirmText="Delete" variant="danger" />
    </div>
  )
}
