import { useEffect } from 'react';
import Whiteboard from './Whiteboard';
import SpeechControls from './SpeechControls';
import { motion } from 'framer-motion';
import mermaid from 'mermaid';

const SpeechModeView = ({ setSelectedIllustration }: { setSelectedIllustration: (ill: any) => void }) => {
  // Centralize mermaid initialization to run once before any rendering components.
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false, // We render manually, so this should be false.
      theme: 'neutral',
      securityLevel: 'loose',
    });
  }, []);

  return (
    <motion.div
      className="h-full flex flex-col rounded-[18px] overflow-hidden relative z-10"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 overflow-hidden relative z-10">
        <Whiteboard setSelectedIllustration={setSelectedIllustration} />
      </div>
      {/* Floating Speech Controls at the bottom, glassy and rounded */}
      <div className="fixed left-0 right-0 z-20 flex justify-center pointer-events-none" style={{ bottom: 4 }}>
        <div className="w-full max-w-2xl mx-auto px-4 pb-4 pointer-events-auto flex flex-col items-center">
          {/* Drop-up transcription area (if visible) */}
          <div className="w-full">
            {/* We'll rely on SpeechControls to render the AnimatePresence drop-up, but ensure it uses w-full max-w-2xl */}
              <SpeechControls />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SpeechModeView; 