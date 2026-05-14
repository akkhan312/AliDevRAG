"""
School RAG System - FastAPI Backend
Provides API endpoints for document upload, question answering, and document management.
"""

import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load .env file if present (must be before any os.environ.get calls)
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from document_processor import DocumentProcessor
from rag_engine import RAGEngine

app = FastAPI(title="School RAG System", version="1.0.0")

# CORS - allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "./uploads"
METADATA_FILE = "./documents_metadata.json"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global instances
rag_engine = None
doc_processor = DocumentProcessor()


def get_rag_engine() -> RAGEngine:
    """Lazy-initialize the RAG engine with the Gemini API key."""
    global rag_engine
    if rag_engine is None:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY environment variable is not set. Please set it before starting the server."
            )
        rag_engine = RAGEngine(api_key=api_key)
    return rag_engine


def load_metadata() -> list[dict]:
    """Load document metadata from the JSON file."""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return []


def save_metadata(metadata: list[dict]):
    """Save document metadata to the JSON file."""
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)


class QuestionRequest(BaseModel):
    question: str
    subject: str | None = None


@app.get("/")
async def root():
    return {"message": "School RAG System API is running", "version": "1.0.0"}


@app.post("/api/upload")
def upload_document(
    file: UploadFile = File(...),
    subject: str = Form("General")
):
    import sys
    print("Received upload request!", flush=True)
    """Upload and process a document (PDF, DOCX, or TXT)."""
    allowed_extensions = ['.pdf', '.docx', '.txt']
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_extensions)}"
        )

    doc_id = str(uuid.uuid4())[:8]
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")

    # Save the uploaded file
    with open(file_path, "wb") as f:
        content = file.file.read()
        f.write(content)

    try:
        # Extract and chunk text
        text = doc_processor.extract_text(file_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the document")

        chunks = doc_processor.chunk_text(text)

        # Add to vector store
        engine = get_rag_engine()
        metadata = {
            "filename": file.filename,
            "subject": subject,
            "doc_id": doc_id,
        }
        print(f"Adding document {doc_id} to vector store...", flush=True)
        engine.add_document(doc_id, chunks, metadata)
        print(f"Document {doc_id} successfully added to vector store.", flush=True)

        # Save metadata record
        docs_metadata = load_metadata()
        docs_metadata.append({
            "id": doc_id,
            "filename": file.filename,
            "subject": subject,
            "chunks": len(chunks),
            "uploaded_at": datetime.now().isoformat(),
            "file_path": file_path
        })
        save_metadata(docs_metadata)

        return {
            "message": "Document uploaded and processed successfully",
            "doc_id": doc_id,
            "filename": file.filename,
            "chunks": len(chunks)
        }

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@app.post("/api/ask")
def ask_question(request: QuestionRequest):
    """Ask a question and get an AI-generated answer from school documents."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    engine = get_rag_engine()
    subject = request.subject if request.subject and request.subject != "All" else None
    result = engine.generate_answer(request.question, subject=subject)
    return result


@app.get("/api/documents")
async def list_documents():
    """List all uploaded documents."""
    return load_metadata()


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and its vector embeddings."""
    docs = load_metadata()
    doc = next((d for d in docs if d['id'] == doc_id), None)

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from vector store
    try:
        engine = get_rag_engine()
        engine.delete_document(doc_id)
    except Exception:
        pass

    # Delete the file
    if os.path.exists(doc.get('file_path', '')):
        os.remove(doc['file_path'])

    # Update metadata
    docs = [d for d in docs if d['id'] != doc_id]
    save_metadata(docs)

    return {"message": "Document deleted successfully"}


@app.get("/api/subjects")
async def list_subjects():
    """List all unique subjects from uploaded documents."""
    docs = load_metadata()
    subjects = list(set(d['subject'] for d in docs))
    return sorted(subjects)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
