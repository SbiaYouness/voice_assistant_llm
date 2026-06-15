# Darija Voice RAG — Multi-Step AI Automation Pipeline

End-to-end voice automation in Moroccan Darija: speak in, get a grounded answer back. Speech recognition → document retrieval → local LLM → voice response, exposed as a REST API and built to be domain-swappable.

Built by **[Youness Sbia](https://github.com/SbiaYouness)** · AI & Computer Science, ENSAM Casablanca

> Forked from [ayaansh-roy/voice_assistant_llm](https://github.com/ayaansh-roy/voice_assistant_llm) and rebuilt into a modular, production-style automation stack.

---

## Demos

Two use cases. Same pipeline, different knowledge base and system prompt.

### Restaurant voice ordering — *Abtaal Al-Sham* (أبطال الشام)

Structured menu RAG, step-by-step order flow, Darija in and out.

https://github.com/user-attachments/assets/b8279436-9ba3-4b65-bf04-947bd64bfea8



| | |
|---|---|
| Context | `restaurant` |
| Knowledge base | `rag/restaurant_file.txt` |
| What it shows | Voice-triggered ordering agent that stays inside menu data and walks the user through the order one question at a time |

---

### Family law Q&A — *Mudawana* (مدونة الأسرة)

Legal-info RAG, custody, alimony, inheritance, answered in Darija.

https://github.com/user-attachments/assets/4e68bdf2-10e4-4efb-a27f-3baa61ebe174


| | |
|---|---|
| Context | `mudawana` |
| Knowledge base | `rag/mudawana.txt` |
| What it shows | Same pipeline repurposed for a completely different domain — swap one env variable, ship a new agent |

To run the Mudawana demo: set `RAG_CONTEXT=mudawana` in `.env` and restart.

---

## How it works

```
Trigger (voice / HTTP POST)
    → STT          faster-whisper
    → Retrieve     Qdrant + LlamaIndex
    → Generate     Ollama (darijaLITE, runs locally)
    → Speak        ElevenLabs TTS
    → Respond      JSON + audio URL
```

Each `/process_audio` call is one complete automation run: audio file in → `{ transcription, response, audio_file }` out.

---

## Why this maps to AI automation work

| Skill | How it's demonstrated here |
|---|---|
| Multi-step pipelines | 4 chained services with clear inputs and outputs at each stage |
| API-first design | Flask REST endpoints ready to wire into any n8n HTTP node |
| Swappable workflows | Change `RAG_CONTEXT` → new agent, new vector collection, new prompt |
| Local + cloud hybrid | Ollama runs offline; ElevenLabs handles voice output via API |
| Structured grounding | RAG keeps the LLM inside the knowledge base |
| Modular services | `audio_service`, `voice_service`, `AIVoiceAssistant` are each isolated and replaceable |

---

## What I built on top of the fork

| Original | What I changed |
|---|---|
| CLI mic loop | Web app with browser recording, chat UI, RTL Darija interface |
| Single hardcoded RAG setup | Two domain contexts with env-driven switching |
| Monolithic script | Separated STT / RAG / TTS services + REST API |
| Fixed paths | Portable config via `.env` |
| gTTS | ElevenLabs (`Hamid`) for natural Darija voice output |
| No docs | README, `requirements.txt`, `.env.example`, demo videos |

---

## Stack

| Layer | Tool |
|---|---|
| Orchestration | Python, Flask, Flask-CORS |
| Speech to text | faster-whisper (`medium`) |
| Vector store | Qdrant |
| RAG | LlamaIndex |
| LLM | Ollama, `darijaLITE` |
| Text to speech | ElevenLabs, `Hamid`, `eleven_multilingual_v2` |
| Frontend | HTML / CSS / JS, chat history, audio visualizer |

---

## Quick start

```bash
git clone https://github.com/SbiaYouness/voice_assistant_llm.git
cd voice_assistant_llm

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

pip install -r requirements.txt
cp .env.example .env         # add your ELEVENLABS_API_KEY
```

Start dependencies:

```bash
# Terminal 1 — vector DB
docker run -p 6333:6333 qdrant/qdrant

# Terminal 2 — local LLM
ollama pull darijaLITE
ollama serve
```

Run the app:

```bash
python app.py
# → http://127.0.0.1:5000
```

---

## API endpoints

| Method | Route | Body | Returns |
|---|---|---|---|
| `GET` | `/health` | — | `{ status, rag_context }` |
| `POST` | `/process_text` | `{ "text": "..." }` | `{ "response": "..." }` |
| `POST` | `/process_audio` | `multipart/form-data`, field `audio` | `{ transcription, response, audio_file }` |
| `GET` | `/audio/<filename>` | — | MP3 stream |

Example n8n flow: Webhook trigger → HTTP Request (`/process_text`) → IF node → downstream action.

---

## Project structure

```
voice_assistant_llm/
├── demos/
│   ├── restaurant-ordering.mp4
│   └── mudawana-family-law.mp4
├── app.py                      Flask API + routes
├── audio_service.py            STT via Whisper
├── voice_service.py            TTS via ElevenLabs
├── rag/
│   ├── AIVoiceAssistant.py     RAG engine + context config
│   ├── restaurant_file.txt
│   └── mudawana.txt
├── templates/ · static/        Chat UI
├── requirements.txt
├── .env.example
└── uploads/                    Runtime audio (gitignored)
```

---

## Notes

- Legal answers from the Mudawana context are informational only, not professional legal advice.
- Requires a valid `ELEVENLABS_API_KEY` in `.env` for voice output.

---

## License

MIT — upstream: [ayaansh-roy/voice_assistant_llm](https://github.com/ayaansh-roy/voice_assistant_llm)

## Credits

[faster-whisper](https://github.com/SYSTRAN/faster-whisper) · [LlamaIndex](https://www.llamaindex.ai/) · [Qdrant](https://qdrant.tech/) · [Ollama](https://ollama.com) · [ElevenLabs](https://elevenlabs.io/)
