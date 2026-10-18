<div align="center">
  <img src="frontend/public/siteicon.svg" alt="Scoleaf icon" width="64" />
  <h1>Scoleaf</h1>
  <p>A personal AI tutor for your PDFs, with voice conversations and visual explanations.</p>
  <p><a href="https://kcharvi.github.io/scoleaf/">Project website</a> · <a href="https://kcharvi.github.io/scoleaf/#demo">Watch the demo</a> · <a href="#run-locally">Run locally</a></p>
</div>

Scoleaf puts a document viewer beside an AI tutor. Upload a PDF, ask a question by text or voice, and follow the explanation through document highlights, diagrams, and equations. Follow-up questions keep the conversation connected to the material you are reading.

The public website is a **project showcase with a recorded demo**. The working application runs separately and requires the services and credentials described below. The recording shows an earlier project name, PiTutor.

## Features

- **Document conversations:** ask for summaries, explanations, or follow-up answers grounded in an uploaded PDF.
- **Text and voice modes:** use typed chat or a real-time voice session powered by LiveKit and Google's Gemini Live integration.
- **Source-linked highlights:** locate relevant passages, navigate to them, and organize highlights into General, Important, and Thoughts categories.
- **Visual explanations:** generate Mermaid diagrams and mathematical explanations alongside the conversation.
- **Multilingual tutoring:** request explanations in another language through the voice tutor.
- **Accounts and uploads:** Supabase authentication, user profiles, upload counts, and PDF storage support the learning workflow.

## Architecture

| Layer | Technologies | Responsibility |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Zustand | Document viewer, chat, highlights, and voice-session controls |
| Document interface | react-pdf-highlighter-extended, Mermaid, KaTeX | PDF annotations, diagrams, and mathematical rendering |
| API | Python, FastAPI, Pydantic | Upload processing, chat sessions, LiveKit tokens, and user profiles |
| Document processing | PyMuPDF, PyPDF2 | Extract PDF content and coordinates for highlighting |
| AI and voice | Google Gemini, LiveKit Agents | Text answers, real-time voice, and tutor tool calls |
| Authentication and storage | Supabase Auth, Postgres, Storage | Sign-in, profiles, upload counts, and stored PDFs |

The API and the LiveKit agent run as separate Python processes. Local PDF files and processed caches are stored under `backend/uploads/`; Supabase Storage provides document URLs used by remote components.

## Run locally

### Prerequisites

- Node.js 18+ and npm for the frontend.
- Python 3.12 recommended for the pinned backend dependencies.
- A Google AI API key with access to the models used by the application.
- A Supabase project with email authentication, a `profiles` table, and a PDF storage bucket.
- A LiveKit server or LiveKit Cloud project for voice mode.

The setup commands below use a macOS/Linux shell.

### 1. Clone and install

```bash
git clone https://github.com/kcharvi/scoleaf.git
cd scoleaf

python3.12 -m venv backend/venv
source backend/venv/bin/activate
python -m pip install -r backend/requirements.txt

cd frontend
npm ci --legacy-peer-deps
cd ..
```

### 2. Configure the backend

Create `backend/.env` with your own values:

```dotenv
GOOGLE_API_KEY=your_google_ai_api_key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_backend_supabase_key
SUPABASE_STORAGE_BUCKET=pdfs

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

HOST=0.0.0.0
PORT=8000
DEBUG=true
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
ALLOWED_ORIGINS=["http://localhost:3000"]
```

Keep backend keys in this local file or your server's environment. Use only the Supabase anonymous/public key in the frontend; never put a service-role key there. Environment files, uploads, caches, and build outputs are excluded by `.gitignore`.

**Supabase setup:** the code expects a `profiles` table with an `id` matching the authenticated user's ID and an `upload_count` field. Arrange profile creation for new users and configure appropriate access policies and the `pdfs` storage bucket. This repository currently does not include database migrations, profile-creation triggers, or storage-policy definitions, so creating a Supabase project alone is insufficient.

### 3. Configure the frontend

Create `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the same Supabase project as the backend. The API URL includes `/api`.

### 4. Start the API

From the repository root, open a terminal and run:

```bash
cd backend
source venv/bin/activate
set -a
source .env
set +a
python run.py
```

Loading `.env` into the shell also supplies the LiveKit token endpoint, which reads its credentials directly from the process environment.

### 5. Start the voice agent

In a second terminal, starting from the repository root:

```bash
cd backend
source venv/bin/activate
python run_agent.py dev
```

The agent loads `backend/.env` and connects to the LiveKit project configured there. The API, agent, and browser must use the same LiveKit server.

### 6. Start the frontend

In a third terminal, starting from the repository root:

```bash
cd frontend
npm run dev
```

Open [localhost:3000](http://localhost:3000), sign in, and upload a PDF. Choose **Text** for chat or **Speak** for voice, and allow microphone access when using voice mode. Ask a question, inspect the associated highlights, and continue with follow-up questions.

With `DEBUG=true`, API documentation is available at [localhost:8000/docs](http://localhost:8000/docs).

## Current limits and setup notes

- Regular accounts have a three-upload limit. The upload route checks for PDFs of up to 20 pages; the configured file-size limit defaults to 50 MB.
- The code references `gemini-2.5-flash` for text, `gemini-2.0-flash` for diagrams, and `gemini-live-2.5-flash-preview` for voice. These are repository defaults, not guarantees of current provider availability. If a model is unavailable to your account, update its ID in the corresponding service or agent file.
- Chat sessions and processed documents use local application state and file caches. This is a prototype, and some file/chat endpoints do not enforce per-user authorization. Review those routes before deploying a shared instance.
- PDF context and voice-session data are sent to the configured AI and voice services. Local development does not imply offline processing.

## Development

Build the frontend, including its TypeScript check:

```bash
cd frontend
npm run build
```

A frontend lint command is also defined as `npm run lint`. There is currently no frontend `npm test` script or checked-in automated test suite; the backend dependency list includes pytest, but no backend tests are included.

Check the API after starting it:

```bash
curl http://localhost:8000/api/health/
curl http://localhost:8000/api/health/ai-status
```

Useful entry points:

```text
frontend/src/components/       Learning interface and document viewer
frontend/src/services/api.ts  Frontend API client and backend URL
frontend/src/store/            Conversation and highlight state
backend/app/main.py           FastAPI application and chat routes
backend/app/api/               Upload, health, account, and voice-token routes
backend/app/services/          AI, document, and Supabase services
backend/app/livekit_agent/     Voice tutor and document interaction tools
site/                         Static project website and recorded demo
Scripts/publish-site.sh        GitHub Pages publishing helper
```

## Project website

The showcase is published at **[kcharvi.github.io/scoleaf](https://kcharvi.github.io/scoleaf/)**. Its source is in `site/`, and GitHub Pages serves the `gh-pages` branch.

After editing and reviewing the site, publish it from the repository root:

```bash
bash Scripts/publish-site.sh
```

This publishes the static project page, not the FastAPI backend or the voice agent.

## Collaboration

A project by **[Charvi Kusuma](https://kcharvi.github.io/)**, in collaboration with **[Reddi Tarun](http://redditarun.github.io/)**.

## Contributing

Use [GitHub Issues](https://github.com/kcharvi/scoleaf/issues) for bugs or suggestions. Include the affected text/voice flow, reproduction steps, and relevant error messages without credentials or private documents. Open a pull request with a focused change and describe how you checked it.

## License

There is currently no repository-level `LICENSE` file. The frontend package metadata declares ISC; dependency licenses remain with their respective authors.
