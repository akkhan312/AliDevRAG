import { useState, useRef } from 'react'
import { X, Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

function UploadModal({ onClose, onSuccess, subjects }) {
  const [file, setFile] = useState(null)
  const [subject, setSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const predefinedSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'History', 'English', 'Computer Science', 'Geography',
  ]

  const allSubjects = [...new Set([...predefinedSubjects, ...subjects])]

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) validateAndSetFile(droppedFile)
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (f) => {
    const allowedExtensions = ['.pdf', '.docx', '.txt']
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`)
      return
    }
    setError('')
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return

    const finalSubject = customSubject.trim() || subject || 'General'
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subject', finalSubject)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Upload failed')
      }

      const data = await res.json()
      setSuccess(`"${data.filename}" processed into ${data.chunks} chunks`)
      setTimeout(() => onSuccess(), 1500)
    } catch (err) {
      setError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl glass-panel shadow-2xl shadow-black/50 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Upload Document</h3>
            <p className="text-xs text-slate-500 mt-0.5">PDF, DOCX, or TXT files</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200 ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : file
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <FileText size={24} className="text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto">
                  <Upload size={24} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-300">
                  Drop your file here or <span className="text-indigo-400">browse</span>
                </p>
                <p className="text-xs text-slate-500">Supports PDF, DOCX, and TXT</p>
              </div>
            )}
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
              Subject / Course
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allSubjects.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSubject(s); setCustomSubject('') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    subject === s && !customSubject
                      ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customSubject}
              onChange={(e) => { setCustomSubject(e.target.value); setSubject('') }}
              placeholder="Or type a custom subject..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50
                text-sm text-slate-200 placeholder-slate-500 outline-none
                focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
              btn-primary disabled:opacity-40 disabled:cursor-not-allowed
              text-white transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload & Process
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadModal
