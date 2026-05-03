import api from './api'

export const uploadService = {
  /**
   * Upload a single image file to S3 via the backend.
   * Returns the public S3 URL string.
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)

    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 s for large files
    })

    return res.data.url
  },

  /**
   * Upload multiple image files (max 5).
   * Returns an array of S3 URLs.
   */
  async uploadMultiple(files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach((f) => formData.append('images', f))

    const res = await api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })

    return res.data.urls
  },
}
