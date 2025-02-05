import warnings
from qdrant_client import QdrantClient
from llama_index.llms.ollama import Ollama
from llama_index.core import SimpleDirectoryReader, ServiceContext, VectorStoreIndex
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.core.storage.storage_context import StorageContext

warnings.filterwarnings("ignore")

class AIVoiceAssistant:
    def __init__(self):
        self._qdrant_url = "http://localhost:6333"
        self._client = QdrantClient(url=self._qdrant_url, prefer_grpc=False)
        self._llm = Ollama(model="darijaLITE", request_timeout=120.0)
        self._service_context = ServiceContext.from_defaults(
            llm=self._llm,
            embed_model="local"
        )
        self._index = None
        self._create_kb()
        self._create_chat_engine()

    @property
    def _prompt(self):
        return """
            نتا مساعد ذكاء اصطناعي متخصص فمدونة الأسرة المغربية 2024. خدمتك هي تجاوب المستخدمين بطريقة واضحة وسهلة، وتعطيهم معلومات دقيقة على القوانين الجديدة ديال الزواج، الطلاق، الحضانة، النفقة، والإرث.

            طرح الأسئلة اللي فـ [المربعات] على المستخدم باش تفهم أكثر وتخلي المحادثة مشوقة، وما تسوّلش كلشي مرة وحدة! جاوب بإجابات مختصرة (ما تفوتش 10 كلمات) وبالدارجة المغربية.

            [بدا بالسلام، سُول المستخدم واش عندو شي سؤال معين على مدونة الأسرة 2024، ورد على أي استفسار بطريقة واضحة، وسالي المحادثة بتحية!]

            إلا ما كنتيش متأكد من الجواب، قُول بصراحة أنك ما عارفش، وما تحاولش تخترع شي إجابة من راسك!
            """

    def _create_chat_engine(self):
        try:
            if not self._index:
                raise Exception("Index not created")
                
            memory = ChatMemoryBuffer.from_defaults(token_limit=2000)
            self._chat_engine = self._index.as_chat_engine(
                chat_mode="context",
                memory=memory,
                system_prompt=self._prompt,
            )
            print("Chat engine created successfully!")
            return True
        except Exception as e:
            print(f"Error creating chat engine: {e}")
            return False

    def _create_kb(self):
        try:
            reader = SimpleDirectoryReader(
                input_files=[r"C:\Users\lampr\voice_assistant_llm\rag\mdna.pdf"]
            )
            documents = reader.load_data()
            vector_store = QdrantVectorStore(
                client=self._client,
                collection_name="kitchen_db"
            )
            storage_context = StorageContext.from_defaults(vector_store=vector_store)

            self._index = VectorStoreIndex.from_documents(
                documents,
                service_context=self._service_context,
                storage_context=storage_context
            )
            print("Knowledgebase created successfully!")
            return True
        except Exception as e:
            print(f"Error while creating knowledgebase: {e}")
            return False

    def interact_with_llm(self, customer_query):
        try:
            if not self._chat_engine:
                raise Exception("Chat engine not initialized")
                
            response = self._chat_engine.chat(customer_query)
            return response.response
        except Exception as e:
            print(f"Error in interaction: {e}")
            return "Sorry, I encountered an error. Please try again."

    def __str__(self):
        return "AI Voice Assistant - Family Code 2024"