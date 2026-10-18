import React from 'react'
import {
  useHighlightContainerContext,
  usePdfHighlighterContext,
  TextHighlight,
  AreaHighlight,
  MonitoredHighlightContainer
} from 'react-pdf-highlighter-extended'
import type { Tip } from 'react-pdf-highlighter-extended'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import type { CustomHighlight } from '../types/highlights'
import { HIGHLIGHT_COLORS, CATEGORY_EMOJIS } from '../types/highlights'

interface HighlightPopupProps {
  highlight: CustomHighlight
}

const HighlightPopup: React.FC<HighlightPopupProps> = ({ highlight }) => {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg border border-notion-gray-300 p-3 max-w-xs"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{CATEGORY_EMOJIS[highlight.category]}</span>
        <span className="text-sm font-medium text-notion-gray-700 capitalize">
          {highlight.category}
        </span>
        {highlight.timestamp && (
          <span className="text-xs text-notion-gray-500">
            {highlight.timestamp.toLocaleDateString()}
          </span>
        )}
      </div>
      
      {highlight.comment && (
        <p className="text-sm text-notion-gray-700 mb-2 leading-relaxed">
          {highlight.comment}
        </p>
      )}
      
      {highlight.content?.text && (
        <div className="text-xs text-notion-gray-600 bg-notion-gray-100 rounded p-2 border-l-2 border-notion-blue-500">
          "{highlight.content.text.substring(0, 100)}
          {highlight.content.text.length > 100 ? '...' : ''}"
        </div>
      )}
      
      {highlight.tags && highlight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {highlight.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-notion-blue-100 text-notion-blue-600 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

interface HighlightContainerProps {
  // No props needed - context provides everything
}

const HighlightContainer: React.FC<HighlightContainerProps> = () => {
  const { updateHighlight } = useAppStore()
  
  const {
    highlight,
    viewportToScaled,
    screenshot,
    isScrolledTo,
    highlightBindings,
  } = useHighlightContainerContext<CustomHighlight>()

  const { toggleEditInProgress } = usePdfHighlighterContext()

  console.log('HighlightContainer rendering for highlight:', highlight)
  console.log('Highlight position:', highlight.position)
  console.log('Highlight content:', highlight.content)

  const isTextHighlight = !Boolean(highlight.content?.image)
  const highlightColor = HIGHLIGHT_COLORS[highlight.category] || HIGHLIGHT_COLORS.general

  console.log('Highlight type:', isTextHighlight ? 'text' : 'area')
  console.log('Highlight color:', highlightColor)

  const component = isTextHighlight ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{ 
        background: highlightColor,
        transition: 'all 0.2s ease-in-out',
        boxShadow: isScrolledTo ? '0 0 0 2px rgba(35, 131, 226, 0.5)' : 'none'
      }}
    />
  ) : (
    <AreaHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{
        background: highlightColor,
        border: `2px solid ${highlightColor?.replace('0.3', '0.8') || 'rgba(255, 235, 59, 0.8)'}`,
        transition: 'all 0.2s ease-in-out',
        boxShadow: isScrolledTo ? '0 0 0 2px rgba(35, 131, 226, 0.5)' : 'none'
      }}
      onChange={(boundingRect) => {
        const updatedHighlight = {
          position: {
            ...highlight.position,
            boundingRect: viewportToScaled(boundingRect),
          },
          content: {
            ...highlight.content,
            image: screenshot(boundingRect),
          },
        }
        
        updateHighlight(highlight.id, updatedHighlight as any)
        toggleEditInProgress(false)
      }}
      bounds={highlightBindings.textLayer}
      onEditStart={() => toggleEditInProgress(true)}
    />
  )

  const highlightTip: Tip = {
    position: highlight.position,
    content: <HighlightPopup highlight={highlight as unknown as CustomHighlight} />
  }

  return (
    <MonitoredHighlightContainer
      highlightTip={highlightTip}
      key={highlight.id}
    >
      {component}
    </MonitoredHighlightContainer>
  )
}

export default HighlightContainer 