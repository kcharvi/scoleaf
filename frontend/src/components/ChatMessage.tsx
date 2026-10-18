import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { useAppStore } from '../store/appStore';
import { HighlightCategory, CustomHighlight } from '../types/highlights';

type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }

interface ChatMessageProps {
  message: Message;
  onHighlightClick?: (highlight: CustomHighlight) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onHighlightClick }) => {
  const { highlights } = useAppStore();
  const [copied, setCopied] = React.useState(false);
  const [copiedBlock, setCopiedBlock] = React.useState<number | null>(null);

  const isAIMessage = message.role === 'assistant';

  const userBubbleStyles = 'w-auto max-w-[90%] bg-[color:var(--color-leaf)] text-white rounded-xl px-5 py-3 shadow whitespace-pre-wrap text-left';
  const aiStyles = 'w-full max-w-[900px] bg-white text-gray-900 border border-[color:var(--color-stone)] rounded-xl px-5 py-3 shadow whitespace-pre-wrap text-left';

  // Track if copy icon has been rendered
  // (No longer needed for always-show logic)

  // Helper to render the correct SVG icon for a highlight category
  const getCategoryIcon = (category: HighlightCategory) => {
    if (category === 'general') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 213, 79, 1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.6.5 1 1.2 1 2v1h6v-1c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg>
      );
    } else if (category === 'important') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 99, 71, 1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      );
    } else if (category === 'thoughts') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(100, 181, 246, 1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.31 2.09A4 4 0 0 0 6 19z"/></svg>
      );
    }
    return null;
  };

  // Extract all highlight tags from the message content (for the bottom row)
  let highlightTags: { category: HighlightCategory, id: string }[] = [];
  let cleanContent = message.content;
  if (isAIMessage && message.content) {
    const highlightRegex = /\[\[highlight:([a-z]+):([a-zA-Z0-9-._]+)\]\]/g;
    let match;
    while ((match = highlightRegex.exec(message.content)) !== null) {
      highlightTags.push({ category: match[1] as HighlightCategory, id: match[2] });
    }
    // Clean the content by removing highlight tags
    cleanContent = message.content.replace(/\[\[highlight:([a-z]+):([a-zA-Z0-9-._]+)\]\]/g, '');
  }

  // Custom renderer for paragraphs to handle our highlight tags (no highlight icons here)
  const renderParagraph = ({ node, children, ...props }: any) => {
    if (!isAIMessage) return <p {...props}>{children}</p>;
    // Remove highlight tags from the text content
    let raw = '';
    if (Array.isArray(children)) {
      raw = children.map(child => (typeof child === 'string' ? child : '')).join('');
    } else if (typeof children === 'string') {
      raw = children;
    } else {
      raw = '';
    }
    // Remove highlight tags from the text
    const cleanText = raw.replace(/\[\[highlight:([a-z]+):([a-zA-Z0-9-._]+)\]\]/g, '');
    return <p {...props}>{cleanText}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full py-3 flex justify-start`}
    >
      <div className={`leading-relaxed text-base relative ${isAIMessage ? aiStyles : userBubbleStyles}`} style={isAIMessage ? { width: '100%' } : { minWidth: '120px', width: 'auto', maxWidth: '900px' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: renderParagraph,
            code({ node, className, children, ...props }) {
              const inline = (props && 'inline' in props) ? props.inline : false;
              const blockIndex = node?.position?.start?.line || Math.random();
              const codeString = String(children).replace(/\n$/, '');
              if (!inline) {
                return (
                  <div className="relative group my-4">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={/language-(\w+)/.exec(className || '')?.[1]}
                      PreTag="div"
                      customStyle={{ borderRadius: 10, fontSize: 15, padding: '1.2em', background: '#232136' }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                    <CopyToClipboard
                      text={codeString}
                      onCopy={() => {
                        setCopiedBlock(blockIndex);
                        setTimeout(() => setCopiedBlock(null), 1500);
                      }}
                    >
                      <button className="absolute top-2 right-2 p-1 rounded bg-white/80 hover:bg-white text-[color:var(--color-leaf)] shadow transition-all opacity-0 group-hover:opacity-100" title="Copy code">
                        {copiedBlock === blockIndex ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </CopyToClipboard>
                  </div>
                );
              }
              return (
                <code className={className} {...props} style={{ background: '#f5f5f5', borderRadius: 4, padding: '2px 6px', fontSize: 15 }}>
                  {children}
                </code>
              );
            },
            table({ children }) {
              return <table className="min-w-full border-collapse my-4">{children}</table>;
            },
            th({ children }) {
              return <th className="border px-3 py-2 bg-gray-100 text-left font-semibold">{children}</th>;
            },
            td({ children }) {
              return <td className="border px-3 py-2">{children}</td>;
            },
          }}
        >
          {cleanContent}
        </ReactMarkdown>
        {isAIMessage && (
          <div className="flex items-center gap-2 mt-3 justify-end w-full">
            <div className="flex items-center gap-2 flex-wrap">
              {highlightTags.map((tag, idx) => {
                const handleMarkerClick = () => {
                  const highlight = highlights.find(h => h.id === tag.id);
                  if (highlight && onHighlightClick) {
                    onHighlightClick(highlight);
                  }
                };
                return (
                  <span
                    key={tag.id + idx}
                    className="inline-flex items-center justify-center border border-[color:var(--color-stone)] rounded-md p-1 mx-1 align-middle cursor-pointer hover:bg-[color:var(--color-stone)]/10 transition-colors"
                    title={`View highlight: ${tag.category}`}
                    onClick={handleMarkerClick}
                    style={{ minWidth: 28, minHeight: 28, background: 'transparent' }}
                  >
                    {getCategoryIcon(tag.category)}
                  </span>
                );
              })}
            </div>
            <CopyToClipboard
              text={cleanContent}
              onCopy={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <button className="p-2 rounded-full border border-[color:var(--color-stone)] bg-transparent hover:bg-[color:var(--color-stone)]/10 transition-colors ml-2" title="Copy response">
                {copied ? <Check className="w-6 h-6 text-[color:var(--color-leaf)]" /> : <Copy className="w-6 h-6 text-[color:var(--color-leaf)]" />}
              </button>
            </CopyToClipboard>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 