# import warnings
# import os
# import fitz  # PyMuPDF
# import pytesseract
# from PIL import Image
# from qdrant_client import QdrantClient
# from llama_index.llms.ollama import Ollama
# from llama_index.core import SimpleDirectoryReader, ServiceContext, VectorStoreIndex
# from llama_index.core.memory import ChatMemoryBuffer
# from llama_index.vector_stores.qdrant import QdrantVectorStore
# from llama_index.core.storage.storage_context import StorageContext

# warnings.filterwarnings("ignore")

# class AIVoiceAssistant:
#     def __init__(self):
#         self._qdrant_url = "http://localhost:6333"
#         self._client = QdrantClient(url=self._qdrant_url, prefer_grpc=False)
#         self._llm = Ollama(model="darijaLITE", request_timeout=120.0)
#         self._service_context = ServiceContext.from_defaults(
#             llm=self._llm, embed_model="local"
#         )
#         self._index = None
#         self._create_kb()
#         self._create_chat_engine()

#     @property
#     def _prompt(self):
#         return (
#             "You are a helpful AI assistant who responds concisely. "
#             "You speak Moroccan Darija in Arabic script. Provide best possible answers."
#         )

#     def _create_chat_engine(self):
#         memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
#         self._chat_engine = self._index.as_chat_engine(
#             chat_mode="context",
#             memory=memory,
#             system_prompt=self._prompt,
#         )

#     def _create_kb(self):
#         try:
#             # Load .txt documents
#             txt_docs = SimpleDirectoryReader(
#                 input_files=[r"C:\Users\lampr\voice_assistant_llm\rag\restaurant_file.txt"]
#             ).load_data()

#             # Load .pdf documents
#             pdf_docs = self._load_pdf_documents(
#                 input_files=[r"C:\Users\lampr\voice_assistant_llm\rag\context\resto.pdf"]
#             )

#             # # Load image files via OCR
#             # img_docs = self._load_image_documents(
#             #     input_files=[r"C:\Users\lampr\voice_assistant_llm\rag\context\image_file.png"]
#             # )

#             # Combine all docs together
#             documents =  pdf_docs 

#             # Create Qdrant vector store
#             vector_store = QdrantVectorStore(
#                 client=self._client,
#                 collection_name="kitchen_db"
#             )
#             storage_context = StorageContext.from_defaults(vector_store=vector_store)

#             # Build index from documents
#             self._index = VectorStoreIndex.from_documents(
#                 documents,
#                 service_context=self._service_context,
#                 storage_context=storage_context
#             )
#             print("Knowledgebase created successfully from multiple file types!")
#         except Exception as e:
#             print(f"Error while creating knowledgebase: {e}")

#     def _load_pdf_documents(self, input_files):
#         documents = []
#         for file_path in input_files:
#             doc = fitz.open(file_path)
#             text = ""
#             for page in doc:
#                 text += page.get_text()
#             documents.append({"text": text, "file_path": file_path})
#         return documents

#     def _load_image_documents(self, input_files):
#         documents = []
#         for file_path in input_files:
#             text = pytesseract.image_to_string(Image.open(file_path))
#             documents.append({"text": text, "file_path": file_path})
#         return documents

#     def interact_with_llm(self, customer_query):
#         AgentChatResponse = self._chat_engine.chat(customer_query)
#         answer = AgentChatResponse.response
#         return answer