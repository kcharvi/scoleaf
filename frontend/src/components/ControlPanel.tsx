import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { apiService } from '../services/api'
import HighlightsSidebar, { HighlightCategoryFilter } from './HighlightsSidebar';
import type { CustomHighlight } from '../types/highlights'
import type { PDFViewerRef } from './PDFViewer'
import { ChatMessage } from './ChatMessage'
import { useSpeech } from '../contexts/SpeechContext'
import { AgentAudio } from './AgentAudio'
import SpeechModeView from './SpeechModeView'
import PanelHeader from './PanelHeader'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import HamsterProcessingModal from './HamsterProcessingModal';
import PageLimitErrorModal from './PageLimitErrorModal';
import AnimationOverlay from './AnimationOverlay';
import IllustrationOverlay from './IllustrationOverlay';
import { createPortal } from 'react-dom';

type ControlPanelTab = 'chat' | 'highlights'

interface ControlPanelProps {
  pdfViewerRef?: React.RefObject<PDFViewerRef>
}

// Unified OverlayManager
const OverlayManager = ({ selectedIllustration, setSelectedIllustration }: { selectedIllustration: any, setSelectedIllustration: (ill: any) => void }) => {
  const { activeIllustrations, animations } = useSpeech();

  // Priority: Whiteboard modal > Animation > Illustration
  if (selectedIllustration) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg capitalize">{selectedIllustration.type}</h3>
            <button onClick={() => setSelectedIllustration(null)} className="p-1 rounded-full hover:bg-gray-100">
              ×
            </button>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {/* Use IllustrationRenderer directly */}
            
          </div>
        </div>
      </div>,
      document.body
    );
  }
  if (animations && animations.length > 0) {
    return <AnimationOverlay />;
  }
  if (activeIllustrations && activeIllustrations.length > 0) {
    return <IllustrationOverlay />;
  }
  return null;
};

const ControlPanel: React.FC<ControlPanelProps> = ({ pdfViewerRef }) => {
  const { 
    currentMode, 
    messages, 
    addMessage, 
    createNewSession,
    currentSessionId,
    pdfFile,
    highlights,
    addHighlight,
    uploadedFileId,
    setUploadedFileId,
    setPdfFile
  } = useAppStore()
  
  const { isConnected } = useSpeech()
  const { refreshProfile } = useAuth()

  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<ControlPanelTab>('chat')
  const [showHamster, setShowHamster] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [selectedIllustration, setSelectedIllustration] = useState(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  // Add a ref for the textarea to auto-expand
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Add a ref for the chat input container
  const chatInputContainerRef = useRef<HTMLDivElement>(null);
  // State to store chat input height
  const [chatInputHeight, setChatInputHeight] = useState<number>(80); // default min height

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
    // Also update chat input height
    if (chatInputContainerRef.current) {
      setChatInputHeight(chatInputContainerRef.current.offsetHeight);
    }
  }, [message]);

  // Also update on window resize
  useEffect(() => {
    const handleResize = () => {
      if (chatInputContainerRef.current) {
        setChatInputHeight(chatInputContainerRef.current.offsetHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    const uploadPDF = async () => {
      if (pdfFile && !uploadedFileId) {
        setIsFileUploading(true);
        setShowHamster(true);
        try {
          console.log('Uploading PDF:', pdfFile.name);
          const uploadResponse = await apiService.uploadPDF(pdfFile);
          setUploadedFileId(uploadResponse.id);
          console.log('PDF uploaded successfully:', uploadResponse.id);
          refreshProfile();
          // Create new session for this PDF
          const sessionResponse = await apiService.createSession(uploadResponse.id);
          console.log('Session created:', sessionResponse.session_id);
          createNewSession(sessionResponse.session_id);
        } catch (error: any) {
          console.error('Failed to upload PDF:', error);
          setPdfUploadError('Failed to process your PDF. Please try again.');
        } finally {
          setIsFileUploading(false);
          setShowHamster(false);
        }
      }
    };
    uploadPDF();
  }, [pdfFile, uploadedFileId, setUploadedFileId, createNewSession, refreshProfile]);

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    if (!uploadedFileId) {
      toast.error('Please upload a PDF first to start chatting')
      return
    }
    
    setIsLoading(true)
    try {
      // Add user message immediately
      addMessage('user', message)
      const userMessage = message
      setMessage('')
      
      // Send to backend
      const response = await apiService.sendTextMessage(
        userMessage, 
        uploadedFileId || undefined, 
        currentSessionId || undefined
      )

      // Add AI response
      addMessage('assistant', response.message.content)

      // Add highlights if provided
      if (response.highlights && response.highlights.length > 0) {
        console.log('Raw highlights from backend:', response.highlights)
        response.highlights.forEach((highlight, index) => {
          console.log(`Processing highlight ${index + 1}:`, highlight)
          const customHighlight: CustomHighlight = {
            id: highlight.id,
            position: highlight.position as any,
            content: highlight.content,
            category: highlight.category,
            comment: undefined,
            timestamp: new Date(),
          }
          console.log(`Transformed highlight ${index + 1}:`, customHighlight)
          addHighlight(customHighlight)
        })
        console.log(`Added ${response.highlights.length} AI-generated highlights`)
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      addMessage('assistant', 'Sorry, I encountered an error. Please make sure the backend is running and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleHighlightClick = (highlight: CustomHighlight) => {
    console.log('Highlight clicked:', highlight)
    if (pdfViewerRef?.current) {
      try {
        pdfViewerRef.current.scrollToHighlight(highlight)
        console.log('Scrolling to highlight:', highlight.id)
      } catch (error) {
        console.error('Error scrolling to highlight:', error)
      }
    } else {
      console.warn('PDF viewer ref not available')
    }
  }

  // Overlays should always render, regardless of mode
  const overlays = (
    <>
      {showHamster && <HamsterProcessingModal />}
      <OverlayManager selectedIllustration={selectedIllustration} setSelectedIllustration={setSelectedIllustration} />
      {pdfUploadError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] z-0" />
          <div className="relative z-10">
            <PageLimitErrorModal onTryAgain={() => { setPdfUploadError(null); setPdfFile(null); setUploadedFileId(null); }} />
          </div>
        </div>
      )}
    </>
  );

  if (currentMode === 'speech') {
    return (
      <div className="relative h-full">
        {/* Overlays OUTSIDE the rounded/overflow-hidden panel */}
        {overlays}
        {/* Gradient border wrapper (matches chat mode) */}
        <div className="absolute inset-0 z-0 rounded-[22px] p-[2.5px] pointer-events-none" style={{ background: 'linear-gradient(120deg,rgba(209,169,128,0.35) 0%,rgba(116,136,115,0.18) 60%,rgba(255,255,255,0.25) 100%)', boxShadow: '0 4px 32px 0 rgba(31,38,135,0.10)' }} />
        {/* Blurry whiteish gradient background for chat/speech area (matches text mode) */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.85) 0%, rgba(209,169,128,0.10) 100%)', filter: 'blur(8px)' }} />
        <div className="h-full flex flex-col bg-white/0 backdrop-blur-xl rounded-[18px] overflow-hidden relative z-10">
          {isConnected && <AgentAudio />}
          <PanelHeader />
          <SpeechModeView setSelectedIllustration={setSelectedIllustration} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Overlays OUTSIDE the rounded/overflow-hidden panel */}
      {overlays}
      {/* Gradient border wrapper */}
      <div className="absolute inset-0 z-0 rounded-[22px] p-[2.5px] pointer-events-none" style={{ background: 'linear-gradient(120deg,rgba(209,169,128,0.35) 0%,rgba(116,136,115,0.18) 60%,rgba(255,255,255,0.25) 100%)', boxShadow: '0 4px 32px 0 rgba(31,38,135,0.10)' }} />
      {/* Blurry whiteish gradient background for chat area */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.85) 0%, rgba(209,169,128,0.10) 100%)', filter: 'blur(8px)' }} />
      <div className="h-full flex flex-col bg-white/0 backdrop-blur-xl rounded-[18px] overflow-hidden relative z-10">
        {isConnected && <AgentAudio />}
        <PanelHeader />
        {/* Floating Pebble Tab Switcher - now bottom right above input */}
        <div
          className="w-full flex flex-col items-end fixed z-[40]"
          style={{
            bottom: `${chatInputHeight + 16}px`, // 16px gap above chat input
            right: '32px',
            width: 'auto',
            pointerEvents: 'none', // only for layout, not for children
          }}
        >
          <div className="pointer-events-auto flex flex-col items-end gap-1">
            <div className="flex shadow rounded-full bg-white/90 border border-[color:var(--color-stone)] overflow-hidden min-w-[90px] max-w-[120px]" style={{ fontSize: '0.95rem' }}>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 font-medium transition-all duration-200
                  ${activeTab === 'chat'
                    ? 'bg-[color:var(--color-leaf)] text-white shadow'
                    : 'text-[color:var(--color-leaf)] hover:bg-[color:var(--color-leaf)]/10'}
                  `}
                style={{ borderTopLeftRadius: 9999, borderBottomLeftRadius: 9999 }}
                title="Chat"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('highlights')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 font-medium transition-all duration-200
                  ${activeTab === 'highlights'
                    ? 'bg-[color:var(--color-dust)] text-white shadow'
                    : 'text-[color:var(--color-dust)] hover:bg-[color:var(--color-dust)]/10'}
                  `}
                style={{ borderTopRightRadius: 9999, borderBottomRightRadius: 9999 }}
                title="Highlights"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-highlighter-icon lucide-highlighter"><path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></svg>
                {highlights.length > 0 && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white/60 text-[color:var(--color-dust)] font-semibold">
                    {highlights.length}
                  </span>
                )}
              </button>
            </div>
            {/* Category Filter for Highlights - show only when highlights tab is active */}
            {activeTab === 'highlights' && (
              <div className="pt-2"><HighlightCategoryFilter /></div>
            )}
          </div>
        </div>
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && (
            <motion.div 
              className="h-full flex flex-col"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className={`flex-1 p-4 pb-40 space-y-4 bg-transparent relative z-10 hide-scrollbar ${messages.length > 2 ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
              >
                {messages.length === 0 && !uploadedFileId && (
                  <div className="flex flex-col items-center justify-center text-center py-8 text-gray-500 h-full">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p className="text-sm">Upload a PDF to begin chatting with your document</p>
                  </div>
                )}
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChatMessage message={msg} onHighlightClick={handleHighlightClick} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <div className="w-full py-3 flex justify-start animate-pulse">
                    <div className="bg-gray-100 rounded-xl px-4 py-2 text-gray-500 text-sm">AI is thinking…</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Floating Chat Input */}
              <div
                ref={chatInputContainerRef}
                className="fixed left-0 right-0 z-20 flex justify-center pointer-events-none"
                style={{ bottom: 4 }}
              >
                <div className="w-full max-w-2xl mx-auto px-4 pb-4 pointer-events-auto">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex items-end gap-2 bg-white/60 backdrop-blur-lg shadow-lg rounded-xl px-4 py-2 border border-white/40"
                    style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}
                  >
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onInput={() => {
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                        }
                        if (chatInputContainerRef.current) {
                          setChatInputHeight(chatInputContainerRef.current.offsetHeight);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={uploadedFileId ? "Ask me anything about this PDF..." : "Upload a PDF to start chatting"}
                      className="flex-1 resize-none min-h-[32px] max-h-40 bg-transparent border-none outline-none text-base placeholder-gray-400 focus:ring-0 focus:outline-none transition-all flex items-center"
                      style={{ fontFamily: 'inherit', lineHeight: 1.5, overflowY: 'auto' }}
                      disabled={isLoading || isFileUploading || !uploadedFileId}
                      rows={1}
                    />
                    <button
                      type="submit"
                      className="p-3 rounded-xl bg-gradient-to-br from-[color:var(--color-leaf)] to-[color:var(--color-dust)] hover:from-[color:var(--color-dust)] hover:to-[color:var(--color-leaf)] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
                      style={{ aspectRatio: '1 / 1', minWidth: 48, minHeight: 48 }}
                      disabled={isLoading || isFileUploading || !message.trim() || !uploadedFileId}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'highlights' && (
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HighlightsSidebar onHighlightClick={handleHighlightClick} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ControlPanel 