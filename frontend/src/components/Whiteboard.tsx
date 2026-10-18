import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useSpeech, type Illustration } from '../contexts/SpeechContext';
import mermaid from 'mermaid';
import rough from 'roughjs/bundled/rough.cjs';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const isMermaidErrorSVG = (svg: string) =>
  svg.includes('aria-roledescription="error"') ||
  svg.includes('Syntax error in text') ||
  /<svg[^>]+style="[^"]*max-width:\s*512px/i.test(svg) ||
  /class="error-icon"/i.test(svg) ||
  /class="error-text"/i.test(svg);

const Whiteboard = ({ setSelectedIllustration }: { setSelectedIllustration: (ill: any) => void }) => {
  const { illustrations } = useSpeech();

  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      <div className="relative z-10 px-6 pt-6">
        <h2 className="text-lg font-semibold text-notion-gray-800 mb-4 text-center">Whiteboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 overflow-y-auto overflow-x-hidden"
     style={{ maxHeight: '60vh' }}>
            {illustrations.map((illustration, index) => (
                <motion.div
                    key={index}
                    className="border border-gray-200/50 rounded-lg shadow-sm p-2 cursor-pointer hover:shadow-md transition-shadow duration-300 w-full max-w-full flex flex-col items-stretch aspect-[4/3] max-h-56 min-h-40"
                    onClick={() => { 
                        console.log('Tile clicked', illustration); 
                        setSelectedIllustration(illustration); 
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <h3 className="text-sm font-medium text-notion-gray-700 mb-1 truncate capitalize">
                        {typeToTitle[illustration.type] || illustration.type}
                    </h3>
                    <div className="w-full h-full flex-1 flex items-center justify-center">
                        <IllustrationThumbnail illustration={illustration} />
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

const typeToTitle: Record<string, string> = {
  mermaid: "Diagram",
  equation: "Equation",
  image: "Image",
  roughjs: "Sketch",
  animation: "Animation"
};

const IllustrationThumbnail = ({ illustration }: { illustration: Illustration }) => {
    // This component will render a simplified, non-interactive version of the illustration
    // For complex types like mermaid, we can show a placeholder or a static image if possible.
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        container.innerHTML = '';

        if (illustration.type === 'mermaid') {
            try {
                mermaid.parse(illustration.content);
                mermaid.render(`thumb-${Date.now()}`, illustration.content)
                    .then(({ svg }) => {
                        if (isMermaidErrorSVG(svg)) {
                            container.innerHTML = `<p class="text-xs text-red-500">Preview Error</p>`;
                        } else {
                            container.innerHTML = svg;
                            const svgEl = container.querySelector('svg');
                            if (svgEl) {
                                svgEl.style.width = '100%';
                                svgEl.style.height = '100%';
                                svgEl.removeAttribute('height');
                                svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                            }
                        }
                    })
                    .catch(() => {
                        container.innerHTML = `<p class="text-xs text-red-500">Preview Error</p>`;
                    });
            } catch {
                container.innerHTML = `<p class="text-xs text-red-500">Preview Error</p>`;
            }
        } else if (illustration.type === 'equation') {
            try {
                katex.render(illustration.content, container, { throwOnError: false, displayMode: true, output: 'html' });
                 // Add scaling for KaTeX
                 const katexEl = container.querySelector('.katex');
                 if (katexEl) {
                     (katexEl as HTMLElement).style.transform = 'scale(0.8)';
                     (katexEl as HTMLElement).style.transformOrigin = 'top left';
                 }
            } catch {
                 container.innerHTML = `<p class="text-xs text-red-500">Preview Error</p>`
            }
        } else if (illustration.type === 'image') {
            container.innerHTML = `<img src="data:image/png;base64,${illustration.content}" class="w-full h-full object-contain" />`;
        } else {
            container.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-50 rounded-md"><p class="text-xs text-gray-400">Cannot preview</p></div>`;
        }
    }, [illustration]);

    return <div ref={containerRef} className="w-full h-full overflow-hidden flex items-center justify-center"></div>;
}


const IllustrationRenderer = ({ illustration }: { illustration: Illustration | undefined }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const roughRef = useRef<HTMLCanvasElement>(null);
    const katexRef = useRef<HTMLDivElement>(null);
    const katexContainerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [renderError, setRenderError] = useState<{type: string, content: string} | null>(null);

    useEffect(() => {
        setZoom(1);
        setRenderError(null); // Reset error state on new illustration

        if (!illustration) return;

        if (illustration.type === 'mermaid' && mermaidRef.current) {
            const container = mermaidRef.current;
            container.innerHTML = ''; // Always clear previous content before rendering

            try {
                mermaid.parse(illustration.content);
                (mermaid as any)
                    .render(`mermaid-diagram-${Date.now()}`, illustration.content)
                    .then(({ svg, bindFunctions }: { svg: string, bindFunctions: (element: HTMLElement) => void }) => {
                        if (isMermaidErrorSVG(svg)) {
                            container.innerHTML = `<p class="text-xs text-red-500">Preview Error</p>`;
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
                    })
                    .catch(() => {
                        if (container) container.innerHTML = '';
                        setRenderError({ type: 'Mermaid', content: illustration.content });
                    });
            } catch {
                container.innerHTML = `<p class="text-xs text-red-500">Preview Error</p>`;
            }
        } else if (illustration.type === 'roughjs' && roughRef.current) {
            try {
                const rc = rough.canvas(roughRef.current);
                const scriptFunction = new Function('rc', illustration.content);
                scriptFunction(rc);
            } catch(e) {
                console.error('RoughJS rendering error:', e);
                setRenderError({ type: 'RoughJS', content: 'Error in drawing script.' });
            }
        } else if (illustration.type === 'equation' && katexRef.current && katexContainerRef.current) {
            const contentEl = katexRef.current;
            const containerEl = katexContainerRef.current;
            contentEl.style.transform = 'scale(1)';

            try {
                katex.render(illustration.content, contentEl, {
                    throwOnError: true, // Throw on error to be caught by catch block
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
                console.error('KaTeX rendering error:', e);
                setRenderError({ type: 'LaTeX', content: illustration.content });
            }
        }
    }, [illustration]);

    if (!illustration) {
        return <p className="text-notion-gray-400">Whiteboard Area</p>;
    }

    // Centralized error display
    if (renderError) {
        return (
            <div className="text-red-500 p-4 text-xs text-left">
                <strong>{renderError.type} Syntax Error</strong>
                <pre className="whitespace-pre-wrap mt-2 bg-red-100 text-red-900 p-2 rounded font-mono">{renderError.content}</pre>
            </div>
        );
    }

    switch (illustration.type) {
        case 'image':
            return (
                <img
                    src={`data:image/png;base64,${illustration.content}`}
                    alt="Generated by agent"
                    className="max-h-full max-w-full object-contain"
                />
            );
        case 'mermaid':
            return (
                <div className="w-full h-full relative flex items-center justify-center p-4">
                    <div 
                        ref={mermaidRef} 
                        className="w-full h-full flex items-center justify-center transition-transform duration-300"
                        style={{ transform: `scale(${zoom})`}}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black bg-opacity-20 text-white p-1 rounded-lg">
                        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1 hover:bg-white/20 rounded-md">
                            <ZoomOut size={16} />
                        </button>
                        <button onClick={() => setZoom(1)} className="p-1 hover:bg-white/20 rounded-md">
                            <RotateCw size={14} />
                        </button>
                        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1 hover:bg-white/20 rounded-md">
                            <ZoomIn size={16} />
                        </button>
                    </div>
                </div>
            );
        case 'roughjs':
            return <canvas ref={roughRef} className="w-full h-full" id="rough-canvas" />;
        case 'equation':
            return (
                <div ref={katexContainerRef} className="w-full h-full p-4 flex items-center justify-center overflow-hidden">
                    <div ref={katexRef} className="text-xl" />
                </div>
            );
        case 'animation':
            return (
                <div className="w-full h-full relative">
                    <StaticAnimationScene spec={illustration.content} />
                </div>
            );
        default:
            return <p className="text-notion-gray-400">Unsupported illustration type</p>;
    }
}

// Renders entire animation spec statically and recenters the group
const StaticAnimationScene = ({ spec }: { spec: any }) => {
    const sceneRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const parent = sceneRef.current;
        if (!parent) return;

        // Give motion a tick to render before measuring
        const timer = setTimeout(() => {
            const children = Array.from(parent.children) as HTMLElement[];
            if (children.length === 0) return;
    
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
            children.forEach((child) => {
                const rect = child.getBoundingClientRect();
                const parentRect = parent.getBoundingClientRect(); 
                if (rect.width === 0 && rect.height === 0) return;
    
                const relX = rect.left - parentRect.left;
                const relY = rect.top - parentRect.top;
                minX = Math.min(minX, relX);
                minY = Math.min(minY, relY);
                maxX = Math.max(maxX, relX + rect.width);
                maxY = Math.max(maxY, relY + rect.height);
            });
            
            if (!isFinite(minX)) return;
    
            const groupWidth = maxX - minX;
            const groupHeight = maxY - minY;
            
            if (groupWidth === 0 || groupHeight === 0) return;
    
            const padding = 20;
            const containerWidth = parent.clientWidth - padding * 2;
            const containerHeight = parent.clientHeight - padding * 2;
    
            const scaleX = containerWidth / groupWidth;
            const scaleY = containerHeight / groupHeight;
            const scale = Math.min(scaleX, scaleY, 1);
    
            const newWidth = groupWidth * scale;
            const newHeight = groupHeight * scale;
    
            const offsetX = (parent.clientWidth - newWidth) / 2 - (minX * scale);
            const offsetY = (parent.clientHeight - newHeight) / 2 - (minY * scale);
    
            parent.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            parent.style.transformOrigin = 'top left';
        }, 100);

        return () => clearTimeout(timer);
    }, [spec]);

    return (
        <div ref={sceneRef} className="absolute inset-0">
            {spec.elements?.map((el: any, idx: number) => (
                <RenderAnimationStatic key={idx} element={el} />
            ))}
        </div>
    );
};

// Simple static renderer for animation spec inside whiteboard (no exit)
const RenderAnimationStatic = ({ element }: { element: any }) => {
    const { kind, text, style = {}, initial = {}, animate = {} } = element;
    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        ...style,
    };
    switch (kind) {
        case 'text':
            return (
                <motion.div
                    style={baseStyle}
                    initial={initial}
                    animate={animate}
                    transition={{ duration: 0.6 }}
                >
                    {typeof text === 'string' ? text : JSON.stringify(text)}
                </motion.div>
            );
        case 'box':
            return (
                <motion.div
                    style={{
                        ...baseStyle,
                        width: style.width || 120,
                        height: style.height || 120,
                        backgroundColor: style.backgroundColor || '#583CFF',
                        borderRadius: style.borderRadius || 12,
                    }}
                    initial={initial}
                    animate={animate}
                    transition={{ duration: 0.6 }}
                />
            );
        case 'circle':
            return (
                <motion.div
                    style={{
                        ...baseStyle,
                        width: style.diameter || 120,
                        height: style.diameter || 120,
                        backgroundColor: style.backgroundColor || '#00FFA3',
                        borderRadius: '50%',
                    }}
                    initial={initial}
                    animate={animate}
                    transition={{ duration: 0.6 }}
                />
            );
        case 'svg':
            if (!element.svg) return null;
            const { viewBox, elements: svgElements } = element.svg;
            const { width, height, ...restOfStyle } = element.style;

            return (
                <motion.div
                    style={{ ...baseStyle, ...restOfStyle }}
                    initial={initial}
                    animate={animate}
                    transition={{ duration: 0.6 }}
                >
                    <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={viewBox}
                        width={width || '100%'}
                        height={height || '100%'}
                    >
                        {svgElements?.map((el: any, idx: number) => {
                            const { tag, text, ...rest } = el;
                            const MotionTag = motion[tag as keyof typeof motion];
                            if (!MotionTag) return null;
                            // @ts-ignore - MotionTag union type too complex for TypeScript to represent
                            return <MotionTag key={idx} {...rest}>{typeof text === 'string' ? text : JSON.stringify(text)}</MotionTag>;
                        })}
                    </motion.svg>
                </motion.div>
            );
        default:
            return null;
    }
};

export { IllustrationRenderer };
export default Whiteboard; 