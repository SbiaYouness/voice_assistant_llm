# Darija Voice RAG — Multi-Step AI Automation Pipeline

**End-to-end voice automation in Moroccan Darija:** speech in → retrieval → local LLM → speech out — grounded on a swappable knowledge base, exposed as a REST API.

Built and shipped by **[Youness Sbia](https://github.com/SbiaYouness)** · AI & Computer Science, ENSAM Casablanca

> Forked from [ayaansh-roy/voice_assistant_llm](https://github.com/ayaansh-roy/voice_assistant_llm) and rebuilt into a modular, domain-swappable automation stack — not a classroom script.

---

## Watch the demos

Two production-style use cases. Same pipeline, different knowledge base + system prompt.

### Restaurant voice ordering — *Abtaal Al-Sham* (أبطال الشام)

Structured menu RAG · step-by-step order flow · Darija in/out

[Download MP4](https://github.com/SbiaYouness/voice_assistant_llm/raw/main/demos/restaurant-ordering.mp4)

<video src="demos/restaurant-ordering.mp4" width="720" controls></video>

| | |
| --- | --- |
| **Context** | `restaurant` |
| **Knowledge base** | `rag/restaurant_file.txt` |
| **What it shows** | Voice-triggered ordering agent that stays inside menu data and guides the user one question at a time |

---

### Family law Q&A — *Mudawana* (مدونة الأسرة)

Legal-info RAG · custody, alimony, inheritance · Darija answers

[Download MP4](https://github.com/SbiaYouness/voice_assistant_llm/raw/main/demos/mudawana-family-law.mp4)

<video src="demos/mudawana-family-law.mp4" width="720" controls></video>

| | |
| --- | --- |
| **Context** | `mudawana` |
| **Knowledge base** | `rag/mudawana.txt` |
| **What it shows** | Same automation backbone repurposed for a completely different domain — swap config, ship a new agent |

> **Run the Mudawana demo:** set `RAG_CONTEXT=mudawana` in `.env` and restart the server.

---

## Why this maps to AI automation

This is a **multi-service orchestration** problem — the same pattern n8n, Make, or custom backends use to chain AI steps:

```
Trigger (voice / HTTP)
    → STT          faster-whisper
    → Retrieve     Qdrant + LlamaIndex
    → Generate     Ollama (darijaLITE, local)
    → Speak        ElevenLabs TTS
    → Respond      JSON + audio URL
```

| Automation skill | How this project demonstrates it |
| --- | --- |
| **Multi-step pipelines** | 4 chained services with clear inputs/outputs at each stage |
| **API-first design** | Flask REST endpoints — ready to wire into n8n HTTP nodes |
| **Swappable workflows** | Change `RAG_CONTEXT` env var → new agent, new vector collection, new prompt |
| **Local + cloud hybrid** | Ollama runs offline; ElevenLabs handles high-quality TTS via API |
| **Structured grounding** | RAG prevents the LLM from freelancing outside the knowledge base |
| **Modular services** | `audio_service` · `voice_service` · `AIVoiceAssistant` — each step is isolated and replaceable |

Each `/process_audio` call is one full automation run: **audio file in → `{ transcription, response, audio_file }` out.**

---

## What I shipped on top of the fork

| Base repo | My changes |
| --- | --- |
| CLI mic loop | **Web app** — browser recording, chat UI, RTL Darija interface |
| Single hardcoded RAG setup | **Two domain contexts** + env-driven switching |
| Monolithic script | **Separated STT / RAG / TTS services** + REST API |
| Fixed paths | **Portable config** via `.env` and relative paths |
| gTTS playback | **ElevenLabs** (`Hamid`) for natural Darija voice output |
| No docs / no deps file | **`README`**, `requirements.txt`, `.env.example`, demo videos |

---

## Quick start

```bash
git clone https://github.com/SbiaYouness/voice_assistant_llm.git
cd voice_assistant_llm

python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate   # macOS / Linux

pip install -r requirements.txt
cp .env.example .env         # add your ELEVENLABS_API_KEY
```

**Start dependencies:**

```bash
# Terminal 1 — vector DB
docker run -p 6333:6333 qdrant/qdrant

# Terminal 2 — local LLM
ollama pull darijaLITE
ollama serve
```

**Run the app:**

```bash
python app.py
# → http://127.0.0.1:5000
```

Switch agent context without touching code:

```env
RAG_CONTEXT=restaurant   # default — menu ordering
RAG_CONTEXT=mudawana     # family law Q&A
```

---

## n8n / automation integration

Hook any orchestrator to these endpoints:

| Method | Route | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `{ status, rag_context }` |
| `POST` | `/process_text` | `{ "text": "..." }` | `{ "response": "..." }` |
| `POST` | `/process_audio` | `multipart/form-data` · field `audio` | `{ transcription, response, audio_file }` |
| `GET` | `/audio/<filename>` | — | MP3 stream |

**Example n8n flow:** Webhook trigger → HTTP Request (`/process_text`) → IF node → Slack/email/TTS node.

---

## Tech stack

| Layer | Tool |
| --- | --- |
| Orchestration | Python · Flask · Flask-CORS |
| STT | faster-whisper (`medium`) |
| Vector store | Qdrant |
| RAG | LlamaIndex |
| LLM | Ollama · `darijaLITE` |
| TTS | ElevenLabs · `Hamid` · `eleven_multilingual_v2` |
| Frontend | HTML / CSS / JS · chat history · audio visualizer |

---

## Project structure

```
voice_assistant_llm/
├── demos/
│   ├── restaurant-ordering.mp4    ← demo video
│   └── mudawana-family-law.mp4    ← demo video
├── app.py                         ← Flask API + routes
├── audio_service.py               ← STT (Whisper)
├── voice_service.py               ← TTS (ElevenLabs)
├── rag/
│   ├── AIVoiceAssistant.py        ← RAG engine + context config
│   ├── restaurant_file.txt
│   └── mudawana.txt
├── templates/ · static/            ← chat UI
├── requirements.txt
├── .env.example
└── uploads/                       ← runtime audio (gitignored)
```

---

## Notes

- Legal answers from the Mudawana context are **informational only** — not professional legal advice.
- Responses can still hallucinate; the UI includes a disclaimer.
- Requires a valid `ELEVENLABS_API_KEY` in `.env` for voice output.

---

## License

MIT — upstream: [ayaansh-roy/voice_assistant_llm](https://github.com/ayaansh-roy/voice_assistant_llm).

## Credits

- [ayaansh-roy/voice_assistant_llm](https://github.com/ayaansh-roy/voice_assistant_llm) — original RAG + Ollama pipeline
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) · [LlamaIndex](https://www.llamaindex.ai/) · [Qdrant](https://qdrant.tech/) · [Ollama](https://ollama.com) · [ElevenLabs](https://elevenlabs.io/)
