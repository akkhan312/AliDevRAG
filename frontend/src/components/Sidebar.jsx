import { BrainCircuit, Upload, FileText, Trash2, ChevronLeft, BookOpen, Filter } from 'lucide-react'

function Sidebar({
  documents,
  subjects,
  selectedSubject,
  onSubjectChange,
  onUploadClick,
  onDeleteDocument,
  isOpen,
  onToggle,
}) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onToggle}
        />
      )}
      <aside
        className={`fixed md:relative z-50 h-full transition-all duration-300 ease-in-out flex-shrink-0 ${
          isOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0 w-80 md:w-0'
        }`}
      >
        <div className="w-80 h-full flex flex-col glass border-r border-slate-700/50 bg-slate-900/95 md:bg-transparent">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <BrainCircuit size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">AliDevRAG</h1>
                <p className="text-xs text-slate-500">Document Assistant</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <div className="px-4 pt-4">
          <button
            onClick={onUploadClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
              btn-primary text-white font-medium text-sm"
          >
            <Upload size={18} />
            Upload Document
          </button>
        </div>

        {/* Subject Filter */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">
            <Filter size={12} />
            Filter by Subject
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSubjectChange('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedSubject === 'All'
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              All
            </button>
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => onSubjectChange(subject)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedSubject === subject
                    ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 uppercase tracking-wider font-medium">
            <BookOpen size={12} />
            Documents ({documents.length})
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">No documents yet</p>
              <p className="text-xs text-slate-600 mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="group p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60
                    border border-slate-700/30 hover:border-slate-600/50
                    transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300">
                          {doc.subject}
                        </span>
                        <span className="text-xs text-slate-500">
                          {doc.chunks} chunks
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{formatDate(doc.uploaded_at)}</p>
                    </div>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                        hover:bg-red-500/20 text-slate-500 hover:text-red-400
                        transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            RAG Engine Active
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
