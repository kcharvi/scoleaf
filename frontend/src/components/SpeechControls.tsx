import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Mic, MicOff, Monitor, Camera, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useSpeech, type Transcription } from '../contexts/SpeechContext';
import { useAppStore } from '../store/appStore';
import { useLocalParticipant as useLKLocal } from '@livekit/components-react'

const SpeechControls = () => {
  const { uploadedFileId } = useAppStore();
  const { connect, disconnect, isConnected, isConnecting, transcriptions, toolCalls, agent } = useSpeech();
  const { localParticipant } = useLKLocal();
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTranscriptionVisible && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions, isTranscriptionVisible]);

  useEffect(() => {
    if (isConnected) {
      try {
        localParticipant?.setMicrophoneEnabled(true);
        // Sync initial toggles with participant state
        setIsCameraOn(!!localParticipant?.isCameraEnabled);
        setIsScreenSharing(!!localParticipant?.isScreenShareEnabled);
      } catch {}
      setIsMuted(false);
    }
  }, [isConnected, localParticipant]);

  const handleVoiceToggle = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect(uploadedFileId || undefined);
    }
  };

  const toggleMute = () => {
    setIsMuted((m) => {
      const newState = !m;
      try {
        localParticipant?.setMicrophoneEnabled(!newState);
      } catch(e) { console.warn('mute error', e); }
      return newState;
    });
  };

  const toggleCamera = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isCameraOn;
      await localParticipant.setCameraEnabled(newState);
      setIsCameraOn(newState);
    } catch (e) {
      console.warn('camera toggle error', e);
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(newState);
      setIsScreenSharing(newState);
    } catch (e) {
      console.warn('screen share error', e);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence>
        {isTranscriptionVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '220px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-[color:var(--color-sand)]/60 to-[color:var(--color-leaf)]/10 border border-[color:var(--color-leaf)]/30 rounded-xl mb-4 w-full max-w-2xl mx-auto shadow-lg backdrop-blur"
          >
            {transcriptions.map((item: Transcription, index: number) => {
              // Determine if this is the agent (Leaf) or user
              const isAgent = !item.participant?.isLocal && (
                (agent && item.participant?.identity === agent.identity) || (!agent && !item.participant?.isLocal)
              );
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className={
                    isAgent
                      ? 'text-left'
                      : 'text-right'
                  }
                >
                  <p className={`text-base flex items-center gap-2 ${isAgent ? 'text-[color:var(--color-leaf)] font-semibold' : 'text-[color:var(--color-dust)] font-medium'}`}>
                    <motion.span
                      initial={isAgent ? { scale: 0.9 } : false}
                      animate={isAgent ? { scale: 1.08 } : false}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      className={
                        isAgent
                          ? 'inline-block px-2 py-0.5 rounded bg-[color:var(--color-leaf)]/10 border border-[color:var(--color-leaf)]/30 shadow-sm'
                          : 'inline-block px-2 py-0.5 rounded bg-[color:var(--color-dust)]/10 border border-[color:var(--color-dust)]/20 shadow-sm'
                      }
                    >
                      <strong>{isAgent ? 'Leaf' : 'You'}:</strong>
                    </motion.span>
                    <span className="whitespace-pre-line">{item.segment.text}</span>
                  </p>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center flex-wrap gap-3 justify-center w-full max-w-2xl mx-auto">
        {/* Connect / Stop */}
        <button
          onClick={handleVoiceToggle}
          disabled={isConnecting || !uploadedFileId}
          className={`
    w-12 h-12 flex items-center justify-center rounded-full border
    ${isConnected
      ? 'bg-red-500 text-white border-red-400 shadow hover:bg-red-600'
      : 'bg-[color:var(--color-leaf)] text-white border-[color:var(--color-leaf)] shadow hover:bg-[color:var(--color-dust)]'}
    transition-colors duration-150
    ${isConnecting ? 'opacity-60 cursor-not-allowed' : ''}
  `}
          title={isConnected ? 'Pause voice chat' : 'Start voice chat'}
        >
          {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : isConnected ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Mute toggle */}
        {isConnected && (
          <button
            onClick={toggleMute}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title={isMuted ? 'Unmute mic' : 'Mute mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Share Screen */}
        <button
          onClick={toggleScreenShare}
          disabled={!isConnected}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${isScreenSharing ? 'bg-emerald-200' : 'bg-gray-100 hover:bg-gray-200'}`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Camera toggle */}
        <button
          onClick={toggleCamera}
          disabled={!isConnected}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${isCameraOn ? 'bg-emerald-200' : 'bg-gray-100 hover:bg-gray-200'}`}
          title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Waveform indicator */}
        {isConnected && (
          <div className="flex items-center space-x-0.5 pl-2">
            <span className="block w-1 h-4 bg-[#1c7c54] rounded animate-wave" />
            <span className="block w-1 h-6 bg-[#1c7c54] rounded animate-wave delay-75" />
            <span className="block w-1 h-3 bg-[#1c7c54] rounded animate-wave delay-150" />
          </div>
        )}

        {/* Tool call indicator (always visible) */}
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors bg-gray-100 hover:bg-gray-200 relative border border-gray-200 min-w-[48px]`}
          title={toolCalls.length > 0 ? 'Tool call(s) in progress' : 'No tool calls'}
        >
          {(() => {
            // Tool type to letter and color mapping
            const toolTypeToLetter: Record<string, { letter: string, gradient: string[] }> = {
              highlight: { letter: 'H', gradient: ['#ff4d4f', '#ffb347', '#ff4d4f'] },
              diagrams: { letter: 'D', gradient: ['#583CFF', '#00FFA3', '#583CFF'] },
              mermaid: { letter: 'D', gradient: ['#00FFA3', '#583CFF', '#00FFA3'] },
              equations: { letter: 'E', gradient: ['#00b894', '#00cec9', '#00b894'] },
              scroll: { letter: 'S', gradient: ['#fdcb6e', '#e17055', '#fdcb6e'] },
            };
            if (!toolCalls.length) {
              // Show provided tool-case SVG icon as stationary fallback
              return (
                <span className="block w-8 h-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tool-case-icon lucide-tool-case">
                    <path d="M10 15h4"/>
                    <path d="m14.817 10.995-.971-1.45 1.034-1.232a2 2 0 0 0-2.025-3.238l-1.82.364L9.91 3.885a2 2 0 0 0-3.625.748L6.141 6.55l-1.725.426a2 2 0 0 0-.19 3.756l.657.27"/>
                    <path d="m18.822 10.995 2.26-5.38a1 1 0 0 0-.557-1.318L16.954 2.9a1 1 0 0 0-1.281.533l-.924 2.122"/>
                    <path d="M4 12.006A1 1 0 0 1 4.994 11H19a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
                  </svg>
                </span>
              );
            }
            const tool = toolCalls[0];
            let type = 'highlight';
            if (tool.toolName) {
              const name = tool.toolName.toLowerCase();
              if (name.includes('diagram') || name.includes('mermaid')) type = 'diagrams';
              else if (name.includes('equation')) type = 'equations';
              else if (name.includes('scroll')) type = 'scroll';
              else if (name.includes('highlight')) type = 'highlight';
            }
            const { letter, gradient } = toolTypeToLetter[type] || toolTypeToLetter['highlight'];
            // Animate the gradient horizontally, and increase letter size
            return (
              <span className="block w-8 h-8 flex items-center justify-center animated-gradient-letter">
                <svg width="36" height="36" viewBox="0 0 32 32">
                  <defs>
                    <linearGradient id={`animated-gradient-${letter}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={gradient[0]}>
                        <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%" stopColor={gradient[1]}>
                        <animate attributeName="offset" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor={gradient[2]}>
                        <animate attributeName="offset" values="1;0;1" dur="2s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                  </defs>
                  <text x="16" y="25" textAnchor="middle" fontSize="26" fontWeight="bold" fill={`url(#animated-gradient-${letter})`}>
                    {letter}
                  </text>
                </svg>
              </span>
            );
          })()}
        </div>

        {/* Transcript toggle */}
        <button
          onClick={() => setIsTranscriptionVisible((prev) => !prev)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          title={isTranscriptionVisible ? 'Hide transcription' : 'Show transcription'}
        >
          {isTranscriptionVisible ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronUp className="w-5 h-5 text-gray-600" />}
        </button>
      </div>
    </div>
  );
};

export default SpeechControls; 