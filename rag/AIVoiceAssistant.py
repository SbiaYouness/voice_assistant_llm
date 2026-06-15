import os
import warnings
from pathlib import Path

from llama_index.core import ServiceContext, SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.storage.storage_context import StorageContext
from llama_index.llms.ollama import Ollama
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

warnings.filterwarnings("ignore")

RAG_DIR = Path(__file__).resolve().parent

RESTAURANT_PROMPT = """
    أنت مساعد ذكاء اصطناعي محترف تعمل في أحد أفضل المطاعم في المغرب يسمى أبطال الشام،
    اطرح الأسئلة المذكورة داخل الأقواس المربعة التي يجب أن تسألها من العميل، لا تسأل هذه الأسئلة دفعة واحدة وحافظ على المحادثة مشوقة! اسأل سؤالًا واحدًا فقط في كل مرة!

    [ابدأ بالتحية وتلقي الطلب، استجب لأي أسئلة وأنهِ المحادثة بالتحيات!]
    إذا كنت لا تعرف الإجابة، فقط قل أنك لا تعرف، لا تحاول اختلاق إجابة.
    قدم إجابات مختصرة وموجزة لا تزيد عن 10 كلمات، ولا تتحدث مع نفسك!
    """

MUDAWANA_PROMPT = """
    نتا مساعد ذكاء اصطناعي متخصص فمدونة الأسرة المغربية 2024. خدمتك هي تجاوب المستخدمين بطريقة واضحة وسهلة، وتعطيهم معلومات دقيقة على القوانين الجديدة ديال الزواج، الطلاق، الحضانة، النفقة، والإرث.

    طرح الأسئلة اللي فـ [المربعات] على المستخدم باش تفهم أكثر وتخلي المحادثة مشوقة، وما تسوّلش كلشي مرة وحدة! جاوب بإجابات مختصرة (ما تفوتش 10 كلمات) وبالدارجة المغربية.

    [بدا بالسلام، سُول المستخدم واش عندو شي سؤال معين على مدونة الأسرة 2024، ورد على أي استفسار بطريقة واضحة، وسالي المحادثة بتحية!]

    إلا ما كنتيش متأكد من الجواب، قُول بصراحة أنك ما عارفش، وما تحاولش تخترع شي إجابة من راسك!
    """

RAG_CONTEXTS = {
    "restaurant": {
        "kb_files": [RAG_DIR / "restaurant_file.txt"],
        "collection": "knowledge_db",
        "prompt": RESTAURANT_PROMPT,
    },
    "mudawana": {
        "kb_files": [RAG_DIR / "mudawana.txt"],
        "collection": "mudawana_db",
        "prompt": MUDAWANA_PROMPT,
    },
}


class AIVoiceAssistant:
    def __init__(self, context=None):
        self._context_name = (context or os.getenv("RAG_CONTEXT", "restaurant")).lower()
        if self._context_name not in RAG_CONTEXTS:
            raise ValueError(
                f"Unknown RAG context '{self._context_name}'. "
                f"Choose from: {', '.join(RAG_CONTEXTS)}"
            )

        self._context = RAG_CONTEXTS[self._context_name]
        self._qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self._client = QdrantClient(url=self._qdrant_url, prefer_grpc=False)
        self._llm = Ollama(
            model=os.getenv("OLLAMA_MODEL", "darijaLITE"),
            request_timeout=250.0,
            num_ctx=8192,
        )
        self._service_context = ServiceContext.from_defaults(
            llm=self._llm,
            embed_model="local",
        )
        self._index = None
        self._create_kb()
        self._create_chat_engine()

    @property
    def context_name(self):
        return self._context_name

    def _create_chat_engine(self):
        memory = ChatMemoryBuffer.from_defaults(token_limit=5000)
        self._chat_engine = self._index.as_chat_engine(
            chat_mode="context",
            memory=memory,
            system_prompt=self._context["prompt"],
            similarity_top_k=4,
        )

    def _create_kb(self):
        try:
            reader = SimpleDirectoryReader(
                input_files=[str(path) for path in self._context["kb_files"]]
            )
            documents = reader.load_data()
            vector_store = QdrantVectorStore(
                client=self._client,
                collection_name=self._context["collection"],
            )
            storage_context = StorageContext.from_defaults(vector_store=vector_store)
            self._index = VectorStoreIndex.from_documents(
                documents,
                service_context=self._service_context,
                storage_context=storage_context,
            )
            print(
                f"Knowledge base ready — context: {self._context_name}, "
                f"collection: {self._context['collection']}"
            )
        except Exception as e:
            print(f"Error while creating knowledge base: {e}")

    def interact_with_llm(self, customer_query):
        response = self._chat_engine.chat(customer_query)
        return response.response
