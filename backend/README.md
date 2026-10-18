# Scoleaf Backend

This is the backend for Scoleaf, an AI-powered PDF analysis and chat application. It's built with FastAPI and uses Google's Gemini 2.5 Flash model for its AI capabilities, with a real-time voice-to-speech option powered by LiveKit.

## 🚀 How to Run the Full Application

To run the complete Scoleaf application locally, you need to start **three separate services in three different terminal windows**:
1.  **LiveKit Server** (for real-time voice features)
2.  **Backend Server** (FastAPI)
3.  **Frontend Server** (React/Vite)

Here are the step-by-step instructions for each.

---

### 1. Start the LiveKit Server

The LiveKit server handles real-time audio communication. The easiest way to run it locally is with Docker.

1.  **Prerequisite**: Make sure you have [Docker](https://www.docker.com/get-started/) installed and running.

2.  **Run the LiveKit Server**:
    Open a terminal and run the following command:
    ```bash
    docker run --rm -p 7880:7880 -p 7881:7881 livekit/livekit-server
    ```
    This will download the LiveKit server image and start it. It uses the default `devkey` and `secret` for API access, which the backend is pre-configured to use for local development. **Keep this terminal window open.**

---

### 2. Start the Backend Server

The backend handles PDF processing, AI analysis, and API logic.

1.  **Prerequisites**:
    *   [Python 3.11+](https://www.python.org/downloads/)
    *   A [Google AI API Key](https://ai.google.dev/pricing) for the Gemini model.

2.  **Navigate to the backend directory**:
    In a **new terminal window**:
    ```bash
    # Make sure you are in the 'scoleaf/backend' directory
    cd backend
    ```

3.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

4.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure Environment Variables**:
    Create a file named `.env` in the `backend` directory. Copy the contents of `.env.example` (if it exists) or create it from scratch. Add your Google API key to it:
    ```env
    # backend/.env file
    GOOGLE_API_KEY="your_google_api_key_here"
    ```

6.  **Run the Backend Server**:
    ```bash
    python run.py
    ```
    The server should now be running on `http://127.0.0.1:8000`. **Keep this terminal window open.**

---

### 3. Start the Frontend Server

The frontend is the user interface for the application, built with React and Vite.

1.  **Prerequisite**: [Node.js](https://nodejs.org/) (which includes npm) installed.

2.  **Navigate to the frontend directory**:
    In a **new, third terminal window**:
    ```bash
    # Navigate from the project root 'scoleaf' to the frontend directory
    cd ../frontend 
    ```
    *Note: If you started in the `scoleaf/backend` directory, you can use `cd ../frontend`.*

3.  **Install dependencies**:
    ```bash
    npm install
    ```

4.  **Run the Frontend Dev Server**:
    ```bash
    npm run dev
    ```
    The development server will start, typically at `http://localhost:5173`. Open this URL in your web browser to use the application.

---

## ⚙️ Configuration

Application configuration is managed via environment variables and loaded into a Pydantic `Settings` model in `app/config.py`. Key variables for the backend (`backend/.env`) include:

-   `GOOGLE_API_KEY`: **Required**. Your API key for the Gemini model.
-   `DEBUG`: Set to `True` for development mode (enables reload and docs). Defaults to `True`.
-   `HOST` / `PORT`: Host and port for the server.
-   `FRONTEND_URL`: The URL of the frontend application for CORS configuration.
-   `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`: Configuration for your LiveKit server. The defaults are set for the local Docker container.

## 📁 Project Structure
```
backend/
├── app/
│   ├── api/              # API routers for different features
│   ├── services/         # Business logic (AI, file handling)
│   ├── models/           # Pydantic models for data validation
│   ├── config.py         # Application settings
│   ├── dependencies.py   # FastAPI dependency injection
│   └── main.py           # Main FastAPI application instance
├── uploads/              # Default directory for uploaded files
├── .env.example          # Example environment file
├── README.md
├── requirements.txt
└── run.py                # Script to run the application
```

## Architecture Overview

### Core Components
1. **FastAPI Application**: Main web framework
2. **PDF Processing**: Extract and parse PDF content
3. **Text-to-Text Mode**: Google Generative AI for text responses
4. **Speech-to-Speech Mode**: Google Gemini Live API for voice interactions
5. **File Management**: PDF upload and storage
6. **API Endpoints**: RESTful API for frontend communication

## Required Libraries

### Core Backend
```bash
pip install fastapi uvicorn python-multipart
```

### Google AI Packages
```bash
# Google Generative AI SDK
pip install google-generativeai

# Additional Google Cloud dependencies
pip install google-cloud-storage google-auth google-auth-oauthlib google-auth-httplib2

# For Gemini Live API (when available)
pip install google-cloud-speech google-cloud-texttospeech
```

### PDF Processing
```bash
pip install PyPDF2 pdfplumber python-pdf2image
# Alternative: pip install pymupdf  # for fitz
```

### Additional Dependencies
```bash
pip install pydantic python-jose[cryptography] passlib[bcrypt] python-dotenv aiofiles httpx
```

### Development Dependencies
```bash
pip install pytest pytest-asyncio black flake8 mypy
```

## Complete Requirements.txt
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Google AI
google-generativeai==0.3.2
google-cloud-storage==2.10.0
google-auth==2.23.4
google-auth-oauthlib==1.1.0
google-auth-httplib2==0.1.1
google-cloud-speech==2.21.0
google-cloud-texttospeech==2.16.3

# PDF Processing
PyPDF2==3.0.1
pdfplumber==0.10.3
python-pdf2image==1.16.3

# Utilities
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
aiofiles==23.2.1
httpx==0.25.2

# Development
pytest==7.4.3
pytest-asyncio==0.21.1
black==23.11.0
flake8==6.1.0
mypy==1.7.1
```

## API Flow

### Text-to-Text Mode
1. **Upload PDF** → `POST /api/upload`
2. **Parse PDF** → Extract text content
3. **Store Context** → Save PDF context for chat
4. **Chat Query** → `POST /api/chat/text`
5. **Generate Response** → Use Google Generative AI
6. **Return Response** → JSON response to frontend

### Speech-to-Speech Mode  
1. **Upload PDF** → `POST /api/upload`
2. **Parse PDF** → Extract text content
3. **Voice Input** → `POST /api/chat/speech`
4. **Speech-to-Text** → Convert audio to text
5. **Generate Response** → Use Gemini Live API
6. **Text-to-Speech** → Convert response to audio
7. **Return Audio** → Audio stream to frontend

## Planned API Endpoints

### File Management
- `POST /api/upload` - Upload PDF file
- `GET /api/files/{file_id}` - Get file info
- `DELETE /api/files/{file_id}` - Delete file

### Text Chat
- `POST /api/chat/text` - Send text message
- `GET /api/chat/history/{session_id}` - Get chat history
- `DELETE /api/chat/clear/{session_id}` - Clear chat history

### Voice Chat
- `POST /api/chat/speech` - Send audio message
- `GET /api/chat/speech/stream` - WebSocket for live audio
- `POST /api/chat/speech/upload` - Upload audio file

### Health & Status
- `GET /api/health` - Health check
- `GET /api/status` - Model connection status
- `POST /api/connect` - Initialize AI connections

## Environment Variables

```env
# Google AI
GOOGLE_API_KEY=your_google_ai_api_key
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Application
DEBUG=True
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB
ALLOWED_EXTENSIONS=.pdf

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=http://localhost:3000
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── dependencies.py      # Dependency injection
│   │
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── upload.py        # File upload endpoints
│   │   ├── chat.py          # Chat endpoints
│   │   └── health.py        # Health check endpoints
│   │
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── pdf_processor.py # PDF parsing and processing
│   │   ├── ai_service.py    # Google AI integration
│   │   ├── speech_service.py# Speech processing
│   │   └── file_service.py  # File management
│   │
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── chat.py          # Chat-related models
│   │   ├── file.py          # File-related models
│   │   └── user.py          # User models
│   │
│   ├── core/                # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py      # Authentication
│   │   └── exceptions.py    # Custom exceptions
│   │
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── logger.py        # Logging configuration
│       └── helpers.py       # Helper functions
│
├── tests/                   # Test files
├── uploads/                 # Uploaded files storage
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── Dockerfile              # Docker configuration
└── README.md               # This file
```

## Google AI Integration

### Text Generation (Generative AI)
```python
import google.generativeai as genai

# Configure the API
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize model
model = genai.GenerativeModel('gemini-pro')

# Generate response
response = model.generate_content(prompt)
```

### Speech Processing (Gemini Live API)
```python
# Note: Gemini Live API integration details 
# will be provided when you share the documentation
```

## Development Setup

1. **Create Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Run Development Server**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Next Steps

1. **Set up FastAPI project structure**
2. **Implement PDF processing service**
3. **Integrate Google Generative AI**
4. **Add Gemini Live API integration** (pending documentation)
5. **Create API endpoints**
6. **Add authentication & security**
7. **Connect with frontend**
8. **Add comprehensive testing**

## Notes

- The backend is designed to handle both text and speech modes separately
- PDF processing will extract text content for AI context
- File uploads are configured with size limits and type validation
- CORS is configured for frontend integration
- Ready for Docker containerization
- Structured for easy testing and maintenance

When you provide the Google Generative AI documentation, we can implement the specific integration details for the speech-to-speech functionality. 