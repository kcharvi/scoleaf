import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { PdfLoader, PdfHighlighter } from "react-pdf-highlighter-extended";
import type { PdfHighlighterUtils, Highlight } from "react-pdf-highlighter-extended";
import { motion } from "framer-motion";
import { Contrast } from "lucide-react";
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useAppStore } from "../store/appStore";
import HighlightContainer from "./HighlightContainer";
import type { CustomHighlight, HighlightCategory } from "../types/highlights";
import { HIGHLIGHT_COLORS } from "../types/highlights";
import PageLimitErrorModal from './PageLimitErrorModal';
import { usePdfSearch } from '../hooks/usePdfSearch';

// Configure PDF.js worker to fix version mismatch
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

export interface PDFViewerRef {
    scrollToHighlight: (highlight: CustomHighlight) => void;
    scrollToPage: (pageNumber: number) => void;
    addAgentHighlight: (highlightPayload: { id: string; position: Highlight["position"] }) => void;
}

interface PDFViewerProps {
    file: File | null;
}

const samplePdfs = [
    {
        name: "Attention is all you need (Sample 1)",
        file: "Attention_is_all_you_need_SAMPLE1.pdf",
    },
    {
        name: "Future of Agentic AI (Sample 2)",
        file: "Small_Language_Models_are_the_Future_of_Agentic_AI_SAMPLE2.pdf",
    },
    // Add more samples as needed
];

// Define the function separately
function PDFViewerFn({ file }: PDFViewerProps, ref: React.Ref<PDFViewerRef>) {
    const {
        pdfUrl,
        setPdfFile,
        setPdfUrl,
        highlights,
        addHighlight,
        clearHighlights,
        selectedCategory,
        setSelectedCategory,
    } = useAppStore();

    const [scale, setScale] = useState<number>(1.0);
    const [highlightingEnabled, setHighlightingEnabled] = useState<boolean>(false);
    const [readMode, setReadMode] = useState<boolean>(false);
    const [pressedCategory, setPressedCategory] = useState<HighlightCategory | null>(null);
    const highlighterUtilsRef = useRef<PdfHighlighterUtils>();
    const pdfScrollContainerRef = useRef<HTMLDivElement>(null);
    const [pageLimitError, setPageLimitError] = useState(false);
    // Add a state for any PDF load error
    const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
    // Add state for search error
    const [searchError, setSearchError] = useState<string | null>(null);
    // Add state for search PDF loading
    const [searchPdfLoading, setSearchPdfLoading] = useState(false);
    // Use the custom search hook
    const { query, setQuery, results, loading: searchLoading } = usePdfSearch();

    useEffect(() => {
        if (file) {
            setPdfUrl(URL.createObjectURL(file));
            clearHighlights();
        } else {
            setPdfUrl(null);
            clearHighlights();
        }

        setPdfFile(file);

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [file]);

    useEffect(() => {
        const handleMouseUp = () => {
            if (!highlightingEnabled) {
                return;
            }

            const utils = highlighterUtilsRef.current;
            if (!utils) {
                return;
            }

            const selection = utils.getCurrentSelection();
            if (!selection) {
                return;
            }
            
            if (selectedCategory !== 'all') {
                handleAddHighlight(selection, selectedCategory);
            }

            window.getSelection()?.removeAllRanges();
        };

        const container = pdfScrollContainerRef.current;
        if (container) {
            container.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            if (container) {
                container.removeEventListener("mouseup", handleMouseUp);
            }
        };
    }, [highlightingEnabled, selectedCategory]);

    useEffect(() => {
        const styleElement = document.createElement("style");
        document.head.appendChild(styleElement);

        if (highlightingEnabled) {
            styleElement.innerHTML = `.pdf-scroll .rphe-pdf-page { cursor: crosshair !important; }`;
        } else {
            styleElement.innerHTML = ``;
        }

        return () => {
            document.head.removeChild(styleElement);
        };
    }, [highlightingEnabled]);

    const allHighlights = highlights;

    useEffect(() => {
        console.log("PDFViewer: Highlights changed, count:", highlights.length);
        console.log(
            "PDFViewer: Current highlights:",
            highlights.map((h) => ({ id: h.id, category: h.category }))
        );
    }, [highlights]);

    useImperativeHandle(ref, () => ({
        scrollToHighlight: (highlight: CustomHighlight) => {
            if (!highlighterUtilsRef.current) {
                console.warn("PDF viewer utils not available yet for scrolling.");
                return;
            }
            highlighterUtilsRef.current.scrollToHighlight(highlight);
        },
        scrollToPage: (pageNumber: number) => {
            try {
                const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
                if (pageElement) {
                    pageElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                    console.log(`Scrolled to page ${pageNumber}`);
                } else {
                    const fallbackElement = document.querySelector(
                        `div[class*="page"][class*="${pageNumber}"]`
                    );
                    if (fallbackElement) {
                        fallbackElement.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                        console.log(`Scrolled to page ${pageNumber} using fallback`);
                    } else {
                        console.warn(`Could not find page ${pageNumber} element to scroll to`);
                    }
                }
            } catch (error) {
                console.error("Error scrolling to page:", error);
            }
        },
        addAgentHighlight: (highlightPayload: { id: string; position: Highlight["position"] }) => {
            const newAgentHighlight: CustomHighlight = {
                id: highlightPayload.id,
                position: highlightPayload.position,
                content: { text: "Agent highlight" },
                category: "general",
                comment: "Highlighted by Professor Alex",
                tags: ["agent"],
                timestamp: new Date(),
            };
            console.log("Adding agent highlight to store:", newAgentHighlight);
            console.log("Position details:", JSON.stringify(newAgentHighlight.position, null, 2));

            addHighlight(newAgentHighlight, false);

            setTimeout(() => {
                if (highlighterUtilsRef.current) {
                    try {
                        console.log("Attempting to refresh highlights and scroll to new highlight");

                        highlighterUtilsRef.current.scrollToHighlight(newAgentHighlight);
                        console.log("Scrolled to new agent highlight:", newAgentHighlight.id);
                    } catch (error) {
                        console.error("Error scrolling to highlight:", error);
                    }
                } else {
                    console.warn("highlighterUtilsRef.current is not available for scrolling");
                }
            }, 150);

            setTimeout(() => {
                if (highlighterUtilsRef.current) {
                    try {
                        console.log("Second attempt to scroll to highlight");
                        highlighterUtilsRef.current.scrollToHighlight(newAgentHighlight);
                    } catch (error) {
                        console.warn("Second scroll attempt failed:", error);
                    }
                }
            }, 500);
        },
    }));

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        }
    };

    const zoomIn = () => {
        const newScale = Math.min(scale + 0.1, 2.0);
        setScale(newScale);
    };

    const zoomOut = () => {
        const newScale = Math.max(scale - 0.1, 0.5);
        setScale(newScale);
    };

    const generateHighlightId = () => String(Math.random()).slice(2);

    const handleAddHighlight = (
        newHighlight: any,
        category: HighlightCategory,
    ) => {
        try {
            const transformedHighlight: CustomHighlight = {
                id: generateHighlightId(),
                position: newHighlight.position,
                content: newHighlight.content,
                category,
                comment: "",
                tags: [],
                timestamp: new Date(),
            };
            console.log("Adding new manual highlight:", transformedHighlight);
            addHighlight(transformedHighlight, true);
        } catch (error) {
            console.error("Error creating highlight:", error);
        }
    };

    const categories: HighlightCategory[] = ["general", "important", "thoughts"];

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // setDragActive(true); // Removed as per edit hint
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // setDragActive(true); // Removed as per edit hint
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // setDragActive(false); // Removed as per edit hint
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // setDragActive(false); // Removed as per edit hint
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === "application/pdf") {
                setPdfFile(file);
            }
        }
    };

    // Helper to download and check PDF page count
    const handlePdfSearchSelect = async (result: any) => {
        setSearchError(null);
        setSearchPdfLoading(true);
        try {
            // Download PDF as blob
            const response = await fetch(result.pdfUrl);
            if (!response.ok) throw new Error('Failed to download PDF');
            const blob = await response.blob();
            // Check page count using PDF.js
            const pdfjsLib = await import('pdfjs-dist');
            const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
            const pageCount = pdf.numPages;
            if (pageCount > 50) {
                setSearchError('This PDF has more than 50 pages and cannot be uploaded.');
                setSearchPdfLoading(false);
                return;
            }
            // Create a File object
            const file = new File([blob], `${result.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.pdf`, { type: 'application/pdf' });
            setPdfFile(file);
        } catch (e: any) {
            setSearchError(e.message || 'Failed to process PDF');
        } finally {
            setSearchPdfLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Error overlay for any PDF load failure */}
            {(pageLimitError || pdfLoadError) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center">
                    {/* Blurred background */}
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] z-0" />
                    {/* Centered error modal */}
                    <div className="relative z-10">
                        <PageLimitErrorModal onTryAgain={() => { setPageLimitError(false); setPdfLoadError(null); setPdfFile(null); }} />
                    </div>
                </div>
            )}
            {/* PDF Controls - Vertical Floating Panel */}
            {pdfUrl && (
                <div className="pointer-events-none absolute right-6 top-1/2 z-30 transform -translate-y-1/2 flex flex-col items-center">
                    <motion.div
                        className="pointer-events-auto flex flex-col items-center justify-between px-3 py-4 bg-gray-50/90 backdrop-blur-md shadow-lg rounded-2xl space-y-4 border border-gray-200"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Highlight tools */}
                        <div className="flex flex-col items-center space-y-2 w-full">
                            <div className="flex flex-col items-center space-y-1 w-full">
                                {/* Custom Highlighter SVG Icon */}
                                <span className="block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-leaf)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-highlighter-icon lucide-highlighter">
                                        <path d="m9 11-6 6v3h9l3-3" />
                                        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
                                    </svg>
                                </span>
                                {/* Highlight count box */}
                                <div className="w-full flex justify-center">
                                    <div className="mt-2 mb-1 px-3 py-1 min-w-[40px] text-center bg-gray-100 shadow-inner rounded-md" style={{ boxShadow: 'inset 0 2px 8px 0 rgba(0,0,0,0.02)' }}>
                                        <span className="text-xs text-gray-600 font-medium">{highlights.length}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Category selector with icons only */}
                            <div className="flex flex-col space-y-1 w-full">
                                {categories.map((category) => {
                                    let icon = null;
                                    // Normal and vibrant colors for icons
                                    let color = HIGHLIGHT_COLORS[category].replace('0.7)', '1)');
                                    let vibrantColor = '';
                                    let lessVibrantColor = color;
                                    if (category === 'general') {
                                        lessVibrantColor = 'rgba(255, 236, 140, 1)'; // less vibrant yellow
                                        vibrantColor = 'rgba(255, 213, 79, 1)'; // more vibrant yellow
                                    } else if (category === 'important') {
                                        vibrantColor = 'rgba(255, 99, 71, 1)';
                                    } else if (category === 'thoughts') {
                                        vibrantColor = 'rgba(100, 181, 246, 1)';
                                    }

                                    // Use Lucide icons or inline SVGs for each category
                                    if (category === "general") {
                                        // Bulb icon
                                        icon = (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(highlightingEnabled && selectedCategory === category) || pressedCategory === category ? vibrantColor : lessVibrantColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.6.5 1 1.2 1 2v1h6v-1c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg>
                                        );
                                    } else if (category === "important") {
                                        // Exclamation in circle
                                        icon = (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(highlightingEnabled && selectedCategory === category) || pressedCategory === category ? vibrantColor : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        );
                                    } else if (category === "thoughts") {
                                        // Cloud icon
                                        icon = (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(highlightingEnabled && selectedCategory === category) || pressedCategory === category ? vibrantColor : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.31 2.09A4 4 0 0 0 6 19z"/></svg>
                                        );
                                    }
                                    return (
                                    <button
                                        key={category}
                                        onClick={() => {
                                                if (highlightingEnabled && selectedCategory === category) {
                                                    setHighlightingEnabled(false);
                                                } else {
                                                    setHighlightingEnabled(true);
                                            setSelectedCategory(category);
                                                }
                                        }}
                                            onMouseDown={() => setPressedCategory(category)}
                                            onMouseUp={() => setPressedCategory(null)}
                                            onMouseLeave={() => setPressedCategory(null)}
                                            className={`flex items-center justify-center px-2 py-1 rounded-md border transition-all duration-200 w-full ${
                                                highlightingEnabled && selectedCategory === category
                                                    ? "border-notion-gray-200 shadow-inner bg-gray-100"
                                                    : "border-notion-gray-200 hover:bg-notion-gray-50"
                                        }`}
                                            title={category.charAt(0).toUpperCase() + category.slice(1)}
                                        >
                                            <span style={{ color }}>{icon}</span>
                                    </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="w-full h-px bg-gray-200 my-2" />
                        {/* Read Mode Button below divider */}
                            <button
                            onClick={() => setReadMode((v) => !v)}
                            className="mt-2 p-2 rounded-full  bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                            title="Warm Tone"
                            >
                            <Contrast
                                className="w-5 h-5"
                                strokeWidth={1}
                                color={readMode ? 'var(--color-dust)' : 'var(--color-leaf)'}
                            />
                            </button>
                        {/* PDF controls */}
                        <div className="flex flex-col items-center space-y-2 w-full">
                            <button
                                onClick={zoomIn}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Zoom in"
                            >
                                <ZoomIn size={20} strokeWidth={1.5} />
                            </button>
                            <span className="text-xs text-notion-gray-600 min-w-[2.5rem] text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={zoomOut}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Zoom out"
                            >
                                <ZoomOut size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* PDF Content */}
            <div className="flex-1 relative overflow-hidden">
                {/* Warm tone overlay for read mode */}
                {readMode && (
                    <div style={{ pointerEvents: 'none' }} className="absolute inset-0 z-10" aria-hidden="true">
                        <div className="w-full h-full" style={{ background: 'rgb(209, 169, 128, 0.3)' }} />
                    </div>
                )}
                {!pdfUrl ? (
                    <motion.div
                        className="h-full flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* --- SEARCH BAR --- */}
                        <div className="w-full max-w-md flex flex-col items-center z-10">
                            <input
                                type="text"
                                className="notion-input text-base px-4 py-2 rounded-xl shadow bg-white/80 border border-notion-gray-300 focus:ring-2 focus:ring-[color:var(--color-leaf)] focus:border-transparent transition-all w-full"
                                placeholder="Search academic PDFs…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                disabled={searchPdfLoading}
                            />
                            {(searchLoading || searchPdfLoading) && (
                                <div className="mt-2 flex items-center gap-2 text-[color:var(--color-leaf)] animate-pulse">
                                    <svg className="animate-spin h-5 w-5 text-[color:var(--color-leaf)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                    <span>Searching…</span>
                                </div>
                            )}
                            {searchError && (
                                <div className="mt-2 text-rose-500 text-sm text-center">{searchError}</div>
                            )}
                            {results.length > 0 && !searchLoading && !searchPdfLoading && (
                                <div className="mt-2 w-full max-h-72 overflow-y-auto bg-white/90 rounded-xl shadow border border-notion-gray-200 z-10">
                                    {results.map((r) => (
                                        <button
                                            key={r.id}
                                            className="w-full text-left px-4 py-3 hover:bg-[color:var(--color-leaf)]/10 transition-colors border-b border-notion-gray-100 last:border-b-0 flex flex-col gap-1"
                                            onClick={() => handlePdfSearchSelect(r)}
                                            disabled={searchPdfLoading}
                                        >
                                            <span className="font-medium text-[color:var(--color-leaf)]">{r.title}</span>
                                            <span className="text-xs text-notion-gray-500">{r.authors?.join(', ')}</span>
                                            <span className="text-xs text-notion-gray-400">{r.source === 'arxiv' ? 'arXiv' : 'Open Library'}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* --- END SEARCH BAR --- */}
                        {/* Animated Folder Upload Illustration */}
                        {/* (move upload UI down by adding margin-top) */}
                        <div className="mt-[150px] w-full flex flex-col items-center">
                        <style>{`
                        .pdfk-upload-container {
                          --transition: 350ms;
                          --folder-W: 120px;
                          --folder-H: 80px;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: flex-end;
                          padding: 10px;
                          background: linear-gradient(135deg, var(--color-stone), var(--color-dust));
                          border-radius: 15px;
                          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                          height: calc(var(--folder-H) * 1.7);
                          position: relative;
                          min-width: 260px;
                          margin-bottom: 1.5rem;
                          transition: background 0.3s;
                        }
                        .pdfk-upload-drag-active .pdfk-upload-container {
                          background: linear-gradient(135deg, var(--color-stone), var(--color-leaf));
                          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
                        }
                        .pdfk-folder {
                          position: absolute;
                          top: -20px;
                          left: calc(50% - 60px);
                          animation: pdfk-float 2.5s infinite ease-in-out;
                          transition: transform var(--transition) ease;
                        }
                        .pdfk-folder:hover, .pdfk-upload-drag-active .pdfk-folder { transform: scale(1.05); }
                        .pdfk-folder .pdfk-front-side,
                        .pdfk-folder .pdfk-back-side { position: absolute; transition: transform var(--transition); transform-origin: bottom center; }
                        .pdfk-folder .pdfk-back-side::before,
                        .pdfk-folder .pdfk-back-side::after {
                          content: "";
                          display: block;
                          background-color: var(--color-stone);
                          opacity: 0.5;
                          z-index: 0;
                          width: var(--folder-W);
                          height: var(--folder-H);
                          position: absolute;
                          transform-origin: bottom center;
                          border-radius: 15px;
                          transition: transform 350ms;
                          z-index: 0;
                        }
                        .pdfk-upload-container:hover .pdfk-back-side::before, .pdfk-upload-drag-active .pdfk-back-side::before { transform: rotateX(-5deg) skewX(5deg); }
                        .pdfk-upload-container:hover .pdfk-back-side::after, .pdfk-upload-drag-active .pdfk-back-side::after { transform: rotateX(-15deg) skewX(12deg); }
                        .pdfk-folder .pdfk-front-side { z-index: 1; }
                        .pdfk-upload-container:hover .pdfk-front-side, .pdfk-upload-drag-active .pdfk-front-side { transform: rotateX(-40deg) skewX(15deg); }
                        .pdfk-folder .pdfk-tip {
                          background: linear-gradient(135deg, var(--color-leaf), var(--color-dust));
                          width: 80px; height: 20px; border-radius: 12px 12px 0 0;
                          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                          position: absolute; top: -10px; z-index: 2;
                        }
                        .pdfk-folder .pdfk-cover {
                          background: linear-gradient(135deg, var(--color-dust), var(--color-stone));
                          width: var(--folder-W); height: var(--folder-H);
                          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
                          border-radius: 10px;
                        }
                        .pdfk-custom-file-upload {
                          font-size: 1.1em;
                          color: var(--color-leaf);
                          text-align: center;
                          background: rgba(255,255,255,0.7);
                          border: none;
                          border-radius: 10px;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                          cursor: pointer;
                          transition: background var(--transition) ease;
                          display: inline-block;
                          width: 100%;
                          padding: 10px 35px;
                          position: relative;
                          font-weight: 500;
                          margin-top: calc(var(--folder-H) * 0.7);
                        }
                        .pdfk-custom-file-upload:hover { background: rgba(255,255,255,0.9); }
                        .pdfk-custom-file-upload input[type="file"] { display: none; }
                        @keyframes pdfk-float {
                          0% { transform: translateY(0px); }
                          50% { transform: translateY(-16px); }
                          100% { transform: translateY(0px); }
                        }
                        `}</style>
                        <div className="pdfk-upload-container">
                          <div className="pdfk-folder">
                            <div className="pdfk-front-side">
                              <div className="pdfk-tip"></div>
                              <div className="pdfk-cover"></div>
                            </div>
                            <div className="pdfk-back-side pdfk-cover"></div>
                          </div>
                          <label className="pdfk-custom-file-upload">
                            <input type="file" accept="application/pdf" onChange={handleFileUpload} />
                            Upload PDF
                          </label>
                        </div>
                        <div className="mt-6 text-base text-[color:var(--color-leaf)] font-medium">
                                Drop a PDF file here or click to browse
                        </div>
                        <div className="flex flex-col items-center mt-4">
                          <span className="text-xs text-gray-500 mb-2">Or try a sample PDF:</span>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {samplePdfs.map((sample) => (
                                        <button
                                            key={sample.file}
                                className="px-4 py-1 rounded-lg bg-[color:var(--color-stone)] text-[color:var(--color-leaf)] font-medium shadow-inner hover:bg-[color:var(--color-leaf)] hover:text-white transition-colors"
                                style={{ minWidth: 160 }}
                                            onClick={async () => {
                                                const response = await fetch(`/${sample.file}`);
                                                const blob = await response.blob();
                                                const file = new File([blob], sample.file, {
                                                    type: "application/pdf",
                                                });
                                                setPdfFile(file);
                                            }}
                                        >
                                            {sample.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        {/* Beta note below the upload area */}
                        <div className="flex flex-col items-center w-full mt-4">
                          <div className="text-xs text-rose-400 bg-white/80 rounded-lg px-4 py-2 mt-2" style={{ maxWidth: 570 }}>
                            This is a beta version. It is running on basic hardware which makes it slow. Please be patient.
                            </div>
                        </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        className="h-full w-full relative"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PdfLoader
                            document={pdfUrl}
                            beforeLoad={() => (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue-500 mx-auto mb-4" />
                                        <p className="text-notion-gray-600">Loading PDF...</p>
                                    </div>
                                </div>
                            )}
                            onError={() => {
                                setPdfLoadError('Failed to load PDF. Please try again.');
                            }}
                        >
                            {(pdfDocument) => (
                                <div ref={pdfScrollContainerRef} className="absolute inset-0 overflow-auto pdf-scroll bg-white">
                                    <PdfHighlighter
                                        key={scale.toString()}
                                        pdfDocument={pdfDocument}
                                        pdfScaleValue={scale}
                                        enableAreaSelection={(event) => event.altKey}
                                        highlights={allHighlights}
                                        utilsRef={(utils) => {
                                            highlighterUtilsRef.current = utils;
                                            console.log("PDF Highlighter utils loaded:", utils);
                                            console.log(
                                                "Current highlights passed to PdfHighlighter:",
                                                allHighlights
                                            );
                                            console.log("Highlights count:", allHighlights.length);
                                            if (allHighlights.length > 0) {
                                                console.log(
                                                    "Sample highlight structure:",
                                                    JSON.stringify(allHighlights[0], null, 2)
                                                );
                                            }
                                        }}
                                    >
                                        <HighlightContainer />
                                    </PdfHighlighter>
                                </div>
                            )}
                        </PdfLoader>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(PDFViewerFn);
PDFViewer.displayName = "PDFViewer";

export default PDFViewer;
