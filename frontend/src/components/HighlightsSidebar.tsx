import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Eye } from "lucide-react";
import { useAppStore } from "../store/appStore";
import type { CustomHighlight } from "../types/highlights";
import { HIGHLIGHT_COLORS } from "../types/highlights";

interface HighlightsSidebarProps {
    onHighlightClick?: (highlight: CustomHighlight) => void;
}

// Icon-only category filter for use outside this component
export const HighlightCategoryFilter: React.FC = () => {
    const { selectedCategory, setSelectedCategory } = useAppStore();
            return (
        <div className="flex gap-2 mt-2 mb-2 justify-end">
          <button
                        onClick={() => setSelectedCategory("all")}
                className={`p-2 rounded-full border transition-all duration-200 ${selectedCategory === "all" ? "bg-stone-600 text-white shadow" : "border-stone-300 text-stone-600 hover:bg-stone-100"}`}
                title="All"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>
            </button>
            <button
                onClick={() => setSelectedCategory("general")}
                className={`p-2 rounded-full border transition-all duration-200 ${selectedCategory === "general" ? "bg-yellow-400 text-yellow-900 shadow" : "border-yellow-300 text-yellow-800 hover:bg-yellow-100"}`}
                title="General"
            >
                {/* Bulb icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.6.5 1 1.2 1 2v1h6v-1c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg>
            </button>
            <button
                onClick={() => setSelectedCategory("important")}
                className={`p-2 rounded-full border transition-all duration-200 ${selectedCategory === "important" ? "bg-red-500 text-white shadow" : "border-red-300 text-red-600 hover:bg-red-100"}`}
                title="Important"
            >
                {/* Exclamation in circle */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </button>
              <button
                onClick={() => setSelectedCategory("thoughts")}
                className={`p-2 rounded-full border transition-all duration-200 ${selectedCategory === "thoughts" ? "bg-blue-400 text-blue-900 shadow" : "border-blue-300 text-blue-800 hover:bg-blue-100"}`}
                title="Thoughts"
            >
                {/* Cloud icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.31 2.09A4 4 0 0 0 6 19z"/></svg>
              </button>
        </div>
    );
};

const HighlightsSidebar: React.FC<HighlightsSidebarProps> = ({ onHighlightClick }) => {
    const { removeHighlight, selectedCategory } = useAppStore();
    const filteredHighlights = useAppStore().highlights.filter(
        (h) => selectedCategory === "all" || h.category === selectedCategory
    );
    return (
        <div className="h-full    flex flex-col">
      {/* Highlights List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {filteredHighlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16  flex items-center justify-center mb-3">
              <Eye className="w-8 h-8 text-notion-gray-400" />
            </div>
            <p className="text-notion-gray-500 text-sm">
              {useAppStore().highlights.length === 0 
                                ? "No highlights yet. Select text in the PDF to create highlights."
                                : "No highlights in this category."}
            </p>
          </div>
        ) : (
                    <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filteredHighlights.map((highlight, index) => (
                <motion.div
                  key={highlight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <div
                    onClick={() => onHighlightClick?.(highlight)}
                    className="group block bg-white/10 backdrop-blur-md rounded-xl border border-[color:var(--color-stone)] px-4 py-3 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200 flex items-center gap-3"
                    style={{ 
                                            borderLeft: `4px solid ${HIGHLIGHT_COLORS[highlight.category].replace("0.7", "1")}`,
                    }}
                  >
                                        <div className="flex-1 text-[15px] text-gray-800 leading-relaxed truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                            {highlight.comment?.substring(0, 80) || highlight.content?.text?.substring(0, 80) || "Area highlight"}
                      </div>
                        <button
                                            onClick={e => {
                            e.stopPropagation();
                            removeHighlight(highlight.id);
                          }}
                                            className="p-1.5 text-[color:var(--color-sand)] hover:text-red-500 rounded transition-colors"
                          title="Delete highlight"
                        >
                                            <Trash2 className="w-4 h-4" />
                        </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
    );
};
export default HighlightsSidebar;
