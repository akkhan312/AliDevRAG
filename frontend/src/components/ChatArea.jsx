import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, BookOpen, Menu, Trash2, Loader2 } from 'lucide-react'
import MessageBubble from './MessageBubble'

function ChatArea({
  messages,
  isLoading,
  onAsk,
  onClearChat,
  selectedSubject,
  documentCount,
  sidebarOpen,
  onToggleSidebar,
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onAsk(input.trim())
    setInput('')
  }

  const suggestions = [
    'Summarize the key concepts from the uploaded notes',
    'What are the main topics covered in the documents?',
    'Explain the most important formulas or definitions',
    'Create a study guide from the uploaded materials',
  ]

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-800/80 glass">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
          )}
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              {selectedSubject === 'All' ? 'All Subjects' : selectedSubject}
            </h2>
            <p className="text-xs text-slate-500">{documentCount} document{documentCount !== 1 ? 's' : ''} indexed</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
              text-slate-400 hover:text-red-400 hover:bg-red-500/10
              transition-all duration-200"
          >
            <Trash2 size={14} />
            Clear Chat
          </button>
        )}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30 animate-bounce-subtle">
              <Sparkles size={36} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-3">
              Ask Anything
            </h2>
            <p className="text-slate-400 text-center mb-8 max-w-md leading-relaxed">
              Upload your documents and ask questions. I'll find the answers directly from your materials.
            </p>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="group p-4 rounded-xl bg-slate-800/40 border border-slate-700/40
                    hover:bg-slate-800/70 hover:border-indigo-500/30
                    transition-all duration-200 text-left
                    hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="flex items-start gap-3">
                    <BookOpen size={16} className="text-indigo-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-relaxed transition-colors">
                      {suggestion}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} index={i} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-slide-up">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="glass-panel rounded-2xl rounded-tl-md px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="text-indigo-400 animate-spin" />
                    <span className="text-sm text-slate-400">Searching documents and generating answer...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-center gap-3 p-2 rounded-2xl glass-panel focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl btn-primary disabled:opacity-30 disabled:cursor-not-allowed text-white hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">
            AliDevRAG answers based on your uploaded documents only
          </p>
        </form>
      </div>
    </main>
  )
}

export default ChatArea
