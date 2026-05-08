import ReactMarkdown from 'react-markdown'
import { User, Sparkles, FileText } from 'lucide-react'

function MessageBubble({ message, index }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <Sparkles size={18} className="text-white" />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-5 py-4 shadow-md ${
            isUser
              ? 'btn-primary text-white rounded-tr-sm'
              : 'glass-panel text-slate-200 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="markdown-content text-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Sources:</span>
            {message.sources.map((source, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                  bg-slate-800/50 border border-slate-700/40 text-xs text-slate-400
                  hover:text-indigo-300 hover:border-indigo-500/30 transition-colors"
              >
                <FileText size={10} />
                {source.filename}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-slate-600 mt-1.5 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
          <User size={18} className="text-slate-300" />
        </div>
      )}
    </div>
  )
}

export default MessageBubble
