import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSpeech, type ActiveIllustration } from '../contexts/SpeechContext';
import mermaid from 'mermaid';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { X } from 'lucide-react';

const isMermaidErrorSVG = (svg: string) =>
  svg.includes('aria-roledescription="error"') ||
  svg.includes('Syntax error in text') ||
  /<svg[^>]+style="[^"]*max-width:\s*512px/i.test(svg) ||
  /class="error-icon"/i.test(svg) ||
  /class="error-text"/i.test(svg);

const OverlayRenderer = ({ illustration }: { illustration: ActiveIllustration }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const katexRef = useRef<HTMLDivElement>(null);
    const katexContainerRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState<{type: string, content: string} | null>(null);

    useEffect(() => {
        setRenderError(null);

        if (!illustration) {
            return;
        }

        if (illustration.type === 'mermaid' && mermaidRef.current) {
            const initializeAndRender = () => {
                const container = mermaidRef.current;
                if (!container) {
                    return;
                }
                
                container.innerHTML = '';
                try {
                    mermaid.parse(illustration.content);
                    (mermaid as any)
                        .render(`overlay-mermaid-diagram-${Date.now()}`, illustration.content)
                        .then(({ svg, bindFunctions }: { svg: string, bindFunctions: (element: HTMLElement) => void }) => {
                            if (container) {
                                if (isMermaidErrorSVG(svg)) {
                                    container.innerHTML = `<p class=\"text-xs text-red-500\">Preview Error</p>`;
                                } else {
                                    container.innerHTML = svg;
                                    const svgEl = container.querySelector('svg');
                                    if (svgEl) {
                                        svgEl.style.width = '100%';
                                        svgEl.style.height = '100%';
                                        svgEl.removeAttribute('height');
                                    }
                                    bindFunctions?.(container);
                                }
                            }
                        })
                        .catch((_err: any) => {
                            if (container) container.innerHTML = '';
                            setRenderError({ type: 'Mermaid', content: illustration.content });
                        });
                } catch {
                    container.innerHTML = `<p class=\"text-xs text-red-500\">Preview Error</p>`;
                }
            };

            if (mermaid.initialize) {
                try {
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'forest',
                        securityLevel: 'loose',
                    });
                    setTimeout(initializeAndRender, 100);
                } catch (e) {
                    initializeAndRender();
                }
            } else {
                setRenderError({ type: 'Mermaid', content: 'Mermaid library not properly loaded' });
            }

        } else if (illustration.type === 'equation' && katexRef.current && katexContainerRef.current) {
            const contentEl = katexRef.current;
            const containerEl = katexContainerRef.current;
            contentEl.style.transform = 'scale(1)';

            try {
                katex.render(illustration.content, contentEl, {
                    throwOnError: true,
                    displayMode: true,
                });
                
                setTimeout(() => {
                    const containerWidth = containerEl.clientWidth;
                    const contentWidth = contentEl.scrollWidth;
                    if (contentWidth > containerWidth) {
                        const scale = containerWidth / contentWidth;
                        contentEl.style.transform = `scale(${scale * 0.85})`;
                        contentEl.style.transformOrigin = 'center';
                    }
                }, 0);

            } catch(e) {
                setRenderError({ type: 'LaTeX', content: illustration.content });
            }
        }
    }, [illustration]);

    if (!illustration) {
        return null;
    }

    if (renderError) {
        return (
            <div className="text-red-500 p-4 text-xs text-left bg-white rounded">
                <strong>{renderError.type} Syntax Error</strong>
                <pre className="whitespace-pre-wrap mt-2 bg-red-100 text-red-900 p-2 rounded font-mono">{renderError.content}</pre>
            </div>
        );
    }

    switch(illustration.type) {
        case 'mermaid':
            return (
                <div className="w-full h-full relative flex items-center justify-center p-4">
                    <div 
                        ref={mermaidRef} 
                        className="w-full h-full flex items-center justify-center transition-transform duration-300"
                    />
                </div>
            );
        case 'equation':
            return (
                <div ref={katexContainerRef} className="w-full h-full p-4 flex items-center justify-center overflow-hidden">
                    <div ref={katexRef} className="text-xl" />
                </div>
            );
        default:
            return null;
    }
};

const IllustrationOverlay = () => {
    const { activeIllustrations } = useSpeech();
    // We'll use a custom hook to get setActiveIllustrations from context
    // But for now, let's use a workaround and patch it in SpeechContext if needed

    // We'll patch the context to expose setActiveIllustrations
    // For now, let's use a workaround: window.setActiveIllustrations = setActiveIllustrations

    // But the correct way is to expose setActiveIllustrations in SpeechContext and useSpeech

    // For now, let's just render the overlays and add a close button that calls a global function
    return (
        <AnimatePresence>
            {activeIllustrations.map((ill) => (
                <motion.div
                    key={ill.id}
                    className="fixed inset-0 z-[900] flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, y: 300 }}
                    transition={{ duration: 0.4 }}
                    style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.2)' }}
                >
                    <div className="absolute top-8 right-8 z-10">
                        <button
                            className="bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg border border-gray-200"
                            onClick={() => {
                                // Remove this illustration from activeIllustrations and add to whiteboard
                                if (window.closeActiveIllustrationAndAddToWhiteboard) {
                                    window.closeActiveIllustrationAndAddToWhiteboard(ill.id);
                                }
                            }}
                            aria-label="Close overlay"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <OverlayRenderer illustration={ill} />
                </motion.div>
            ))}
        </AnimatePresence>
    );
};

export default IllustrationOverlay; 