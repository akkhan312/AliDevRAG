"""
Document Processor - Extracts text from PDF, DOCX, TXT files and chunks them.
"""

import os
from PyPDF2 import PdfReader
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


class DocumentProcessor:
    """Handles document text extraction and chunking for the RAG pipeline."""

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def extract_text(self, file_path: str) -> str:
        """Extract text from a document based on its file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        extractors = {
            '.pdf': self._extract_pdf,
            '.docx': self._extract_docx,
            '.txt': self._extract_txt,
        }
        extractor = extractors.get(ext)
        if not extractor:
            raise ValueError(f"Unsupported file type: {ext}. Supported: {', '.join(extractors.keys())}")
        return extractor(file_path)

    def _extract_pdf(self, file_path: str) -> str:
        """Extract text from a PDF file."""
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()

    def _extract_docx(self, file_path: str) -> str:
        """Extract text from a DOCX file."""
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])

    def _extract_txt(self, file_path: str) -> str:
        """Extract text from a plain text file."""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read().strip()

    def chunk_text(self, text: str) -> list[str]:
        """Split text into smaller chunks for embedding."""
        chunks = self.text_splitter.split_text(text)
        return [chunk for chunk in chunks if chunk.strip()]
