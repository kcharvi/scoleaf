# Scoleaf Frontend

A React-based frontend application with a Notion-inspired UI for AI-powered PDF analysis and chat.

## Features

### Current Implementation
- **Notion-like UI**: Clean, minimalistic design inspired by Notion
- **Dual Mode Support**: Text chat and Speech chat modes
- **PDF Viewer**: Built-in PDF viewer with controls (zoom, rotate, pagination)
- **Real-time Chat**: Interactive chat interface with AI responses
- **Responsive Layout**: 70% PDF viewer, 30% control panel
- **Smooth Animations**: Framer Motion powered animations
- **State Management**: Zustand for efficient state management

### UI Components

#### Layout (70/30 Split)
- **Left Side (70%)**: PDF Viewer with document display and controls
- **Right Side (30%)**: Control panel with chat interface and settings

#### Header
- App title and logo
- Mode switcher (Text/Speech)
- Model connection status indicator
- Settings button

#### PDF Viewer
- Drag & drop file upload
- PDF page navigation
- Zoom controls (50% - 200%)
- Rotation controls
- Loading states and error handling

#### Control Panel
- Mode-specific chat interface
- Message history with timestamps
- Text input for text mode
- Voice recording button for speech mode
- Clear conversation functionality
- PDF status indicator

## Technologies Used

### Core Framework
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling

### Key Libraries
- **react-pdf**: PDF viewing capabilities
- **framer-motion**: Smooth animations and transitions
- **lucide-react**: Beautiful, consistent icons
- **zustand**: Lightweight state management
- **axios**: HTTP client for API calls

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Type safety
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Runs the app on http://localhost:3000

### Build
```bash
npm run build
```
Builds the app for production

### Preview
```bash
npm run preview
```
Preview the production build

## Project Structure

```
src/
├── components/           # React components
│   ├── Header.tsx       # Top navigation and mode switcher
│   ├── PDFViewer.tsx    # PDF display and controls
│   └── ControlPanel.tsx # Chat interface and controls
├── store/               # State management
│   └── appStore.ts      # Zustand store configuration
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind config
```

## Design System

### Color Palette (Notion-inspired)
- **Gray Scale**: Multiple shades for backgrounds and text
- **Blue**: Primary action color (#2383e2)
- **Green**: Success states (#0d8043)
- **Red**: Error states (#e03e3e)
- **Yellow**: Warning states (#fdcb6e)

### Typography
- **Font**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Scale**: Consistent spacing and sizing throughout

### Components
- **Buttons**: Notion-style with hover and focus states
- **Inputs**: Clean borders with focus rings
- **Cards**: Subtle shadows and rounded corners
- **Animations**: Smooth transitions and micro-interactions

## State Management

### App Store (Zustand)
- **Mode Management**: Text vs Speech mode switching
- **PDF Handling**: File upload and URL management
- **Chat System**: Message history and conversation management
- **UI State**: Sidebar collapse, loading states
- **Model Status**: Connection status tracking

## Future Enhancements

### Planned Features
- **Backend Integration**: Connect to FastAPI backend
- **AI Model Integration**: Real AI responses instead of mock data
- **Speech Recognition**: Actual speech-to-text functionality
- **File Management**: Multiple PDF support
- **User Authentication**: User accounts and sessions
- **Settings Panel**: Customizable preferences
- **Export Features**: Chat history export
- **Responsive Design**: Mobile and tablet optimization

### Technical Improvements
- **Error Boundaries**: Better error handling
- **Loading States**: More granular loading indicators
- **Caching**: PDF and chat caching
- **Accessibility**: ARIA labels and keyboard navigation
- **Testing**: Unit and integration tests
- **Performance**: Code splitting and lazy loading

## API Integration Ready

The frontend is designed to easily integrate with the FastAPI backend:
- Axios HTTP client configured
- Store actions ready for API calls
- Error handling prepared
- Loading states implemented

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License 