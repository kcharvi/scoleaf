# Scoleaf - AI-Powered PDF Analysis Application

An intelligent PDF analysis application that allows users to interact with their documents through an AI-powered chat interface. The system provides explanations and dynamically highlights relevant text, tables, and images directly within the document viewer.


 
## 🚀 Features

### Core Functionality
- **PDF Upload & Processing**: Upload PDF documents and extract content with precise coordinates using PyMuPDF
- **AI-Powered Chat**: Interactive chat interface using Google Gemini 2.5 Flash for intelligent document analysis
- **Dynamic Highlighting**: Automatically highlight relevant document sections based on AI responses
- **Coordinate-Based Highlighting**: Precise text highlighting with exact positioning for click-to-navigate functionality
- **Session Management**: Maintain conversation state and context across multiple queries
- **Category-Based Highlights**: Three highlight categories (General, Important, Thoughts) with visual distinctions

### User Interface
- **Modern Frontend**: Built with React, TypeScript, and Tailwind CSS with Notion-like UI
- **PDF Viewer**: Integrated PDF viewer with highlighting capabilities using react-pdf-highlighter-extended
- **Responsive Design**: Works seamlessly across different screen sizes
- **Real-time Updates**: Live chat interface with instant AI responses and highlighting

### Technical Features
- **RESTful API**: FastAPI backend with comprehensive endpoint documentation
- **CORS Support**: Properly configured for frontend-backend communication
- **Error Handling**: Robust error handling and user feedback
- **Health Monitoring**: Health check endpoints for system monitoring

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS with custom Notion-inspired styling
- **PDF Handling**: react-pdf-highlighter-extended for document viewing and highlighting
- **State Management**: Zustand for efficient state management
- **HTTP Client**: Axios for API communication
- **Build Tool**: Vite for fast development and building

### Backend (FastAPI + Python)
- **Framework**: FastAPI for high-performance async API
- **AI Integration**: Google Gemini 2.5 Flash for document analysis
- **PDF Processing**: PyMuPDF (fitz) for robust document parsing with coordinate extraction
- **Authentication**: JWT-based authentication (ready for extension)
- **Storage**: File system storage (easily extensible to cloud storage)

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher
- **Python**: 3.9 or higher
- **npm**: 8.0 or higher
- **Google AI API Key**: Required for AI features

### API Keys
1. **Google AI API Key**: 
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key for configuration

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd scoleaf
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment
```bash
# Set your Google AI API key
export GOOGLE_API_KEY="your_google_api_key_here"

# Optional: Create .env file
echo "GOOGLE_API_KEY=your_google_api_key_here" > .env
```

#### Start the Backend
```bash
source venv/bin/activate
python run.py
```

The backend will start on `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies 
```bash
cd frontend
npm install
```

#### Start the Frontend
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🚀 Usage

### 1. Upload a PDF Document
- Navigate to `http://localhost:3000`
- Upload a PDF file using the upload interface
- Wait for the document to be processed and loaded

### 2. Start Chatting
- Use the chat interface on the right panel
- Ask questions about your PDF document:
  - "Summarize the key findings"
  - "What are the main conclusions?"
  - "Explain the methodology used"
  - "Show me the important statistics"

### 3. Interactive Highlighting
- AI responses will automatically highlight relevant text in the PDF
- Click on highlighted sections to navigate to specific parts
- View all highlights in the highlights sidebar
- Highlights are categorized as General, Important, or Thoughts

### 4. Session Management
- Conversations are maintained across queries
- Chat history provides context for follow-up questions
- Clear chat history when starting a new analysis

## 📚 API Documentation

### Backend Endpoints

#### Health Check
- `GET /api/health/` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/health/ai-status` - AI service connectivity

#### File Upload
- `POST /api/upload/` - Upload PDF file
- `GET /api/upload/files` - List uploaded files
- `GET /api/upload/files/{file_id}` - Get file information
- `DELETE /api/upload/files/{file_id}` - Delete file

#### Chat Interface
- `POST /api/chat/text` - Send chat message
- `POST /api/chat/session` - Create chat session
- `GET /api/chat/history/{session_id}` - Get chat history
- `DELETE /api/chat/session/{session_id}` - Clear session
- `POST /api/chat/analyze` - One-off document analysis

#### Interactive API Documentation
- Visit `http://localhost:8000/docs` for Swagger UI
- Visit `http://localhost:8000/redoc` for ReDoc documentation

## 🔧 Configuration

### Backend Configuration
Environment variables can be set in `.env` file or as system environment variables:

```env
# Google AI API Key (required)
GOOGLE_API_KEY=your_google_api_key_here

# Application Settings
DEBUG=True
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50

# CORS Settings
FRONTEND_URL=http://localhost:3000

# Server Settings
HOST=0.0.0.0
PORT=8000
```

### Frontend Configuration
The frontend automatically connects to the backend at `http://localhost:8000`. Modify `vite.config.ts` for custom backend URLs.

## 🧪 Testing

### Backend Testing
```bash
cd backend
source venv/bin/activate
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Manual API Testing
```bash
# Test health endpoint
curl http://localhost:8000/api/health/

# Test file upload
curl -X POST -F "file=@sample.pdf" http://localhost:8000/api/upload/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini 2.5 Flash** for powerful AI capabilities
- **PyMuPDF** for robust PDF processing
- **React PDF Highlighter Extended** for document viewing
- **FastAPI** for the excellent async web framework
- **Tailwind CSS** for beautiful styling

## 🔮 Future Enhancements

- **Speech Mode**: Voice interaction capabilities (prepared for Gemini Live API)
- **Multi-language Support**: Support for documents in multiple languages
- **Cloud Storage**: Integration with cloud storage providers
- **User Authentication**: Multi-user support with authentication
- **Document Comparison**: Compare multiple documents side by side
- **Export Features**: Export highlights and summaries
- **Mobile App**: React Native mobile application

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

## 🏃‍♂️ Quick Start Summary

1. **Backend**: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
2. **Set API Key**: `export GOOGLE_API_KEY="your_key_here"`
3. **Start Backend**: `python run.py`
4. **Frontend**: `cd frontend && npm install && npm run dev`
5. **Access**: Open `http://localhost:3000` in your browser
6. **Upload PDF**: Use the upload interface to add your document
7. **Start Chatting**: Ask questions about your PDF and see intelligent highlighting!

---

**Built with ❤️ for researchers, lawyers, and professionals who work with documents.** 
