import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import UploadModal from './components/UploadModal'

function App() {
  const [documents, setDocuments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [messages, setMessages] = useState([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchDocuments()
    fetchSubjects()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setDocuments(data)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects')
      const data = await res.json()
      setSubjects(data)
    } catch (err) {
      console.error('Failed to fetch subjects:', err)
    }
  }

  const handleUploadSuccess = () => {
    fetchDocuments()
    fetchSubjects()
    setIsUploadOpen(false)
  }

  const handleDeleteDocument = async (docId) => {
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      fetchDocuments()
      fetchSubjects()
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const handleAsk = async (question) => {
    const userMessage = { role: 'user', content: question, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          subject: selectedSubject !== 'All' ? selectedSubject : null,
        }),
      })
      const data = await res.json()
      const aiMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend server is running and try again.',
        sources: [],
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => setMessages([])

  return (
    <div className="flex h-screen bg-transparent overflow-hidden relative z-0">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        subjects={subjects}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        onUploadClick={() => setIsUploadOpen(true)}
        onDeleteDocument={handleDeleteDocument}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        onAsk={handleAsk}
        onClearChat={handleClearChat}
        selectedSubject={selectedSubject}
        documentCount={documents.length}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
          subjects={subjects}
        />
      )}
    </div>
  )
}

export default App
