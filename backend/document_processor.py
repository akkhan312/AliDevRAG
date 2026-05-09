"""
Document Processor - Extracts text from PDF, DOCX, TXT, and image files.
Supports scanned/photo PDFs via OCR (Tesseract + pdf2image).
"""

import os
from PyPDF2 import PdfReader
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# OCR dependencies (optional but required for image/scanned-PDF support)
try:
    import pytesseract
    from pdf2image import convert_from_path
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


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
            '.pdf':  self._extract_pdf,
            '.docx': self._extract_docx,
            '.txt':  self._extract_txt,
            # Image formats - OCR
            '.png':  self._extract_image,
            '.jpg':  self._extract_image,
            '.jpeg': self._extract_image,
            '.webp': self._extract_image,
        }
        extractor = extractors.get(ext)
        if not extractor:
            raise ValueError(f"Unsupported file type: {ext}. Supported: {', '.join(extractors.keys())}")
        return extractor(file_path)

    def _extract_pdf(self, file_path: str) -> str:
        """Extract text from a PDF file.
        
        Strategy:
        1. Try fast text extraction via PyPDF2 (works for digital/native PDFs).
        2. If little/no text is found, fall back to OCR each page as an image.
        """
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        # Fallback: scanned/photo PDF — use OCR
        if len(text.strip()) < 50:
            text = self._ocr_pdf(file_path)

        return text.strip()

    def _ocr_pdf(self, file_path: str) -> str:
        """Convert each PDF page to an image and run Tesseract OCR."""
        if not OCR_AVAILABLE:
            raise RuntimeError(
                "OCR libraries are not installed. "
                "Run: pip install pdf2image pytesseract  (and install Tesseract on your system)."
            )
        images = convert_from_path(file_path, dpi=300)
        ocr_text = ""
        for img in images:
            ocr_text += pytesseract.image_to_string(img) + "\n"
        return ocr_text.strip()

    def _extract_image(self, file_path: str) -> str:
        """Run Tesseract OCR directly on an image file."""
        if not OCR_AVAILABLE:
            raise RuntimeError(
                "OCR libraries are not installed. "
                "Run: pip install pytesseract Pillow  (and install Tesseract on your system)."
            )
        img = Image.open(file_path)
        return pytesseract.image_to_string(img).strip()

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
