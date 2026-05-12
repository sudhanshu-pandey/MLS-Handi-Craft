import { useEffect, useState, useCallback } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import announcementService from '../../services/announcementService'

interface Announcement {
  _id: string
  text: string
  active: boolean
  createdAt: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ text: '', active: true })
  const [settings, setSettings] = useState({ separator: '  |  ', speed: 20, spacing: 50 })
  const [savingSettings, setSavingSettings] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const res = await announcementService.getAll()
      const data = res.data?.data || res.data || []
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch {
      console.error('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await announcementService.getSettings()
      const data = res.data?.data || res.data
      if (data) setSettings({ separator: data.separator ?? '  |  ', speed: data.speed ?? 20, spacing: data.spacing ?? 50 })
    } catch {
      // use defaults
    }
  }, [])

  useEffect(() => { fetchAnnouncements(); fetchSettings() }, [fetchAnnouncements, fetchSettings])

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true)
      await announcementService.updateSettings(settings)
      setToast('Settings saved successfully!')
      setTimeout(() => setToast(null), 3000)
    } catch {
      console.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const resetForm = () => {
    setForm({ text: '', active: true })
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        await announcementService.update(editId, form)
      } else {
        await announcementService.create(form)
      }
      resetForm()
      fetchAnnouncements()
    } catch {
      console.error('Failed to save announcement')
    }
  }

  const handleEdit = (a: Announcement) => {
    setForm({ text: a.text, active: a.active })
    setEditId(a._id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await announcementService.delete(id)
      fetchAnnouncements()
    } catch {
      console.error('Failed to delete announcement')
    }
  }

  const handleToggle = async (a: Announcement) => {
    try {
      await announcementService.update(a._id, { active: !a.active })
      fetchAnnouncements()
    } catch {
      console.error('Failed to toggle announcement')
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Announcement
        </button>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ticker Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Separator between announcements
            </label>
            <input
              type="text"
              value={settings.separator}
              onChange={e => setSettings(s => ({ ...s, separator: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g.  |  or  •  or  ✦  "
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scroll speed (seconds for one cycle) — lower = faster
            </label>
            <input
              type="range"
              min={5}
              max={60}
              value={settings.speed}
              onChange={e => setSettings(s => ({ ...s, speed: Number(e.target.value) }))}
              className="w-full"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">{settings.speed}s</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Spacing between announcements (px)
            </label>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={settings.spacing}
              onChange={e => setSettings(s => ({ ...s, spacing: Number(e.target.value) }))}
              className="w-full"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">{settings.spacing}px</span>
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editId ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Announcement Text
            </label>
            <textarea
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="e.g. 🎉 Prepaid Orders Get Extra 5% OFF | Faster Dispatch 🎉"
              required
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              {editId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No announcements yet. Add one to display in the top header.</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Text</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {announcements.map(a => (
                <tr key={a._id}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-md truncate">{a.text}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(a)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${a.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'}`}
                    >
                      {a.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5 inline" /></button>
                    <button onClick={() => handleDelete(a._id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
