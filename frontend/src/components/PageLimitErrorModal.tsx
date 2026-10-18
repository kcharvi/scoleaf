import React from 'react';

interface PageLimitErrorModalProps {
  onTryAgain: () => void;
}

const PageLimitErrorModal: React.FC<PageLimitErrorModalProps> = ({ onTryAgain }) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center" style={{backdropFilter: 'blur(8px)', background: 'rgba(245, 236, 220, 0.55)'}}>
    <div className="flex flex-col items-center justify-center rounded-2xl shadow-2xl px-14 py-12 min-w-[500px] max-w-[95vw] bg-gradient-to-br from-[color:var(--color-dust)]/90 to-white/90 border border-[color:var(--color-stone)]">
      <div className="text-3xl mb-4 font-bold text-[color:var(--color-leaf)]">Exceeded Page Limit</div>
      <div className="text-lg mb-8 text-gray-400 text-center max-w-md">This PDF exceeds the supported page limit. Please upload a document with fewer pages.</div>
      <button
        onClick={onTryAgain}
        className="mt-2 px-8 py-3 rounded-lg bg-[color:var(--color-leaf)] text-white font-semibold shadow hover:bg-[color:var(--color-dust)] hover:text-white transition-colors text-base"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default PageLimitErrorModal; 