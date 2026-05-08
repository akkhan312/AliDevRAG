"""
RAG Engine - Core retrieval-augmented generation logic.
Uses a simple pure-python/numpy vector store and Google Gemini for embeddings + generation.
"""

import os
import json
import numpy as np
from google import genai

class SimpleVectorStore:
    def __init__(self, path="./simple_chroma_db.json"):
        self.path = path
        self.data = {"ids": [], "embeddings": [], "metadatas": [], "documents": []}
        self._load()

    def _load(self):
        if os.path.exists(self.path):
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except:
                pass
                
    def _save(self):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.data, f)

    def add(self, ids, embeddings, metadatas, documents):
        self.data["ids"].extend(ids)
        self.data["embeddings"].extend(embeddings)
        self.data["metadatas"].extend(metadatas)
        self.data["documents"].extend(documents)
        self._save()

    def query(self, query_embeddings, n_results=5, where=None):
        if not self.data["embeddings"]:
            return {"documents": [[]], "metadatas": [[]]}
            
        q_emb = np.array(query_embeddings[0])
        db_embs = np.array(self.data["embeddings"])
        
        q_norm = np.linalg.norm(q_emb)
        db_norms = np.linalg.norm(db_embs, axis=1)
        similarities = np.dot(db_embs, q_emb) / (db_norms * q_norm + 1e-9)
        
        valid_indices = []
        for i, meta in enumerate(self.data["metadatas"]):
            if where is None or all(meta.get(k) == v for k, v in where.items()):
                valid_indices.append(i)
                
        if not valid_indices:
            return {"documents": [[]], "metadatas": [[]]}
            
        valid_indices = np.array(valid_indices)
        valid_similarities = similarities[valid_indices]
        
        top_k_local_idx = np.argsort(valid_similarities)[-n_results:][::-1]
        top_k_idx = valid_indices[top_k_local_idx]
        
        return {
            "documents": [[self.data["documents"][i] for i in top_k_idx]],
            "metadatas": [[self.data["metadatas"][i] for i in top_k_idx]]
        }

    def delete_by_prefix(self, prefix):
        indices_to_keep = [i for i, doc_id in enumerate(self.data["ids"]) if not doc_id.startswith(prefix)]
        self.data["ids"] = [self.data["ids"][i] for i in indices_to_keep]
        self.data["embeddings"] = [self.data["embeddings"][i] for i in indices_to_keep]
        self.data["metadatas"] = [self.data["metadatas"][i] for i in indices_to_keep]
        self.data["documents"] = [self.data["documents"][i] for i in indices_to_keep]
        self._save()
        
    def count(self):
        return len(self.data["ids"])

class RAGEngine:
    """Main RAG engine that handles document storage, retrieval, and answer generation."""

    def __init__(self, api_key: str, db_path: str = "./chroma_db"):
        self.genai_client = genai.Client(api_key=api_key)
        self.collection = SimpleVectorStore()

    def get_embeddings(self, input_texts: list[str]) -> list[list[float]]:
        embeddings = []
        batch_size = 50
        for i in range(0, len(input_texts), batch_size):
            batch = input_texts[i:i + batch_size]
            result = self.genai_client.models.embed_content(
                model="models/gemini-embedding-001",
                contents=batch,
            )
            embeddings.extend([list(emb.values) for emb in result.embeddings])
        return embeddings

    def add_document(self, doc_id: str, chunks: list[str], metadata: dict):
        """Add document chunks to the vector store."""
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [{**metadata, "chunk_index": i} for i in range(len(chunks))]
        embeddings = self.get_embeddings(chunks)
        
        self.collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas
        )

    def search(self, query: str, n_results: int = 5, subject: str = None):
        """Search for relevant document chunks."""
        where_filter = {"subject": subject} if subject else None
        query_embeddings = self.get_embeddings([query])
        
        results = self.collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            where=where_filter
        )
        return results

    def generate_answer(self, question: str, subject: str = None):
        """Search for relevant chunks and generate an answer using Gemini."""
        results = self.search(question, n_results=5, subject=subject)

        if not results['documents'] or not results['documents'][0]:
            return {
                "answer": "I couldn't find any relevant information in the uploaded documents. Please make sure documents have been uploaded for this subject.",
                "sources": []
            }

        context_chunks = results['documents'][0]
        metadatas = results['metadatas'][0]
        context = "\n\n---\n\n".join(context_chunks)

        prompt = f"""You are a helpful AI assistant. Answer the user's question based ONLY on the provided document context. If the context doesn't contain enough information to answer fully, say so honestly.

Document Context:
{context}

User's Question: {question}

Instructions:
- Answer accurately based on the context provided
- Use clear and professional language
- Use bullet points, numbered lists, and bold text for clarity
- If the context doesn't fully answer the question, mention what information is missing
- Keep the answer focused and relevant"""

        response = self.genai_client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )

        # Deduplicate sources
        sources = []
        seen = set()
        for meta in metadatas:
            source_name = meta.get('filename', 'Unknown')
            if source_name not in seen:
                seen.add(source_name)
                sources.append({
                    "filename": source_name,
                    "subject": meta.get('subject', 'General')
                })

        return {
            "answer": response.text,
            "sources": sources
        }

    def delete_document(self, doc_id: str):
        """Delete all chunks associated with a document."""
        self.collection.delete_by_prefix(f"{doc_id}_")

    def get_document_count(self):
        """Return the total number of chunks in the vector store."""
        return self.collection.count()
