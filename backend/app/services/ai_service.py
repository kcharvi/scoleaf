import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import re

from google import genai
from google.genai import types

from ..config import settings
from ..models.chat import AnalysisResult, HighlightResponse, HighlightCategory, Position, Content
from ..models.file import PDFDocument
from .pdf_processor import PDFProcessor


class AIService:
    """
    AI service using Google Gemini 2.5 Flash for PDF analysis and chat responses.
    Generates structured responses with precise highlight coordinates.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=settings.google_api_key)
        self.model = "gemini-2.5-flash"
        self.pdf_processor = PDFProcessor()
        self.sessions: Dict[str, Dict[str, Any]] = {}
        
        # Add highlight storage per PDF
        self.pdf_highlights: Dict[str, List[HighlightResponse]] = {}
        
        # Category mappings for emojis
        self.category_emojis = {
            HighlightCategory.GENERAL: "📝",
            HighlightCategory.IMPORTANT: "⚠️", 
            HighlightCategory.THOUGHTS: "💭"
        }
    
    async def analyze_query(
        self, 
        query: str, 
        pdf_document: PDFDocument,
        session_id: Optional[str] = None
    ) -> AnalysisResult:
        """
        Analyze user query against PDF content and generate structured response with highlights.
        
        Args:
            query: User's question/query
            pdf_document: Parsed PDF document with content and coordinates
            session_id: Optional session ID for conversation context
            
        Returns:
            AnalysisResult with explanation and highlight coordinates
        """
        try:
            # Prepare the document context for the AI
            document_context = self._prepare_document_context(pdf_document)
            
            # Get conversation history if session exists
            conversation_history = ""
            if session_id and session_id in self.sessions:
                conversation_history = self._format_conversation_history(session_id)
            
            # Create the structured prompt for Gemini
            system_prompt = self._create_system_prompt()
            user_prompt = self._create_user_prompt(query, document_context, conversation_history)
            
            # Configure generation with function calling for structured output
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=1,  # Low temperature for more consistent results
                thinking_config=types.ThinkingConfig(thinking_budget=4096)  # Disable thinking for faster response
            )
            
            # Generate response
            response = self.client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=config
            )
            
            # Parse the response and extract highlights
            analysis_result = await self._parse_ai_response(
                response.text, 
                pdf_document, 
                query
            )
            
            # Store in session if session_id provided
            if session_id:
                self._update_session(session_id, query, analysis_result.explanation, pdf_document.id)
            
            # Store highlights for this PDF
            if analysis_result.highlights:
                if pdf_document.id not in self.pdf_highlights:
                    self.pdf_highlights[pdf_document.id] = []
                self.pdf_highlights[pdf_document.id].extend(analysis_result.highlights)
            
            return analysis_result
            
        except Exception as e:
            # Fallback response if AI service fails
            return AnalysisResult(
                explanation=f"I encountered an error processing your query: {str(e)}. Please try rephrasing your question.",
                highlights=[],
                confidence=0.0
            )
    
    def _prepare_document_context(self, pdf_document: PDFDocument) -> str:
        """Prepare PDF document content for AI analysis."""
        context_parts = [
            f"Document: {pdf_document.filename}",
            f"Pages: {pdf_document.page_count}",
            f"Elements: {len(pdf_document.elements)}",
            "",
            "=== DOCUMENT CONTENT ===",
            pdf_document.full_text[:100000],  # Limit context to avoid token limits
            "",
            "=== EXTRACTABLE ELEMENTS ===" 
        ]
        
        # Add element information for highlight generation
        for i, element in enumerate(pdf_document.elements[:50]):  # Limit elements
            if element.type == "text" and len(element.content.strip()) > 20:
                context_parts.append(
                    f"Element {i}: Page {element.page_number}, Text: \"{element.content[:100]}...\""
                )
        
        return "\n".join(context_parts)
    
    def _create_system_prompt(self) -> str:
        """Create system prompt for Gemini with highlighting instructions."""
        return """
        


**1. Persona & Identity**

  * **Your Name:** You are **Leaf**.
  * **Developer:** You were developed by **Scoleaf**.
  * **Your Role:** You are an incredible personal tutor and explainer.
  * **Your Personality:** Your tone should always be super friendly, natural, and casual. Be bold, interactive, engaging, funny, and interesting to make learning enjoyable.

**2. Core Directives & Capabilities**

  * **Primary Goal:** Explain any topic in a simple, creative, and easy-to-understand way.
  * **Flexibility:** You are not confined to a rigid approach. Be creative and adapt your response style to best help the user.
  * **Toolbox:** You can use a variety of methods to explain concepts, including:
      * Writing and explaining code.
      * Providing and formatting mathematical equations (using LaTeX).
      * Using bullet points for clarity.
      * Answering questions directly.
  * **Multilingual:** You can switch between languages seamlessly.
  * **General Conversation:** For casual talk or off-topic questions, just answer naturally without the formal explanation structure.

**3. Response Style & Constraints**

  * **Dynamic Length:** Your response length must be dynamic and appropriate for the situation.
      * **Short Greetings:** For simple inputs like "Hey" or "Hi," keep your response very short and casual (e.g., under 120 characters).
      * **Detailed Explanations:** Only write long, detailed responses when the user's question requires it. Analyze the context to decide how much detail is needed. Your goal is to be engaging and easy to read, not to overwhelm the user.
  * **Knowledge Cutoff:** Your knowledge is limited to information available up to **January 2025**.
  * **Respectful Interaction:** Treat all users with respect. Avoid any discriminatory or offensive statements.

**4. Document Interaction & The `[HIGHLIGHTS]` Feature**

This is a critical function. When your explanation is based on a provided document, you **must** support your claims with direct evidence from the text.

  * **Trigger:** Use this feature *only* when explaining content from a document.
  * **Placement:** The `[HIGHLIGHTS]` block must appear at the very end of your response.

-----

#### **`[HIGHLIGHTS]` Block: Format and Rules**

**Format:**

```
[HIGHLIGHTS]
Category: [Category Type] | Text: "An exact quote from the document."
Category: [Category Type] | Text: "Another exact quote from the document."
[/HIGHLIGHTS]
```

**Guidelines:**

1.  **Exact Quotes Only:** The text inside the quotes **must be copied precisely** from the document.
2.  **Relevance is Key:** Choose 2-5 of the most relevant snippets that directly support your explanation.
3.  **Quote Substantially:** Quotes should be meaningful. Aim to quote full sentences or multiple sentences to provide proper context. Do not quote single lines out of context.
4.  **Do Not Highlight:** Avoid highlighting titles or image captions.
5.  **Use the Correct Categories:**
      * `important`: For critical definitions, key findings, or core arguments.
      * `general`: For supporting details, examples, or contextual information.
      * `thoughts`: For conclusions, insights, or analyses presented in the document.
6.  Is the user asking a general knowledge question?

      How to know: The query is a standalone question that does not reference the document (e.g., "Give me the Pytorch code for a transformer," "Explain quantum mechanics," "What's the capital of Mongolia?").

      Your Action: If yes, you MUST IGNORE THE DOCUMENT COMPLETELY. Set the document aside and answer using your own expert knowledge. Do not mention the document or apologize for its contents. Treat the query as if the document doesn't exist.
7.  Don't always use "Hey there!" as a greeting for every response. For continution responses you dont need to greet.

"""

    def _create_user_prompt(self, query: str, document_context: str, conversation_history: str) -> str:
        """Create user prompt with query and context."""
        prompt_parts = []
        
        if conversation_history:
            prompt_parts.append(f"CONVERSATION HISTORY:\n{conversation_history}\n")
        
        prompt_parts.extend([
            f"DOCUMENT CONTEXT:\n{document_context}\n",
            f"USER QUERY: {query}\n",
            "Please analyze the document and provide a helpful response with relevant highlights."
        ])
        
        return "\n".join(prompt_parts)
    
    async def _parse_ai_response(
        self, 
        ai_response: str, 
        pdf_document: PDFDocument,
        original_query: str
    ) -> AnalysisResult:
        """Parse AI response and extract highlights with coordinates for all found instances."""
        
        # Extract explanation (everything before [HIGHLIGHTS])
        if "[HIGHLIGHTS]" in ai_response:
            explanation = ai_response.split("[HIGHLIGHTS]")[0].strip()
            highlights_section = ai_response.split("[HIGHLIGHTS]")[1].split("[/HIGHLIGHTS]")[0].strip()
        else:
            explanation = ai_response.strip()
            highlights_section = ""
        
        # Parse highlights from the AI response
        highlights = []
        highlight_refs = []  # Store highlight references for embedding in explanation
        if highlights_section:
            highlight_lines = highlights_section.split("\n")
            
            for line in highlight_lines:
                if "Category:" in line and "Text:" in line:
                    try:
                        # Parse category and text
                        parts = line.split(" | ")
                        category_part = parts[0].replace("Category:", "").strip()
                        text_part = parts[1].replace("Text:", "").strip().strip('"')
                        
                        # Map category
                        category = self._map_category(category_part)
                        
                        # Find all coordinate sets for this text
                        all_coordinates = await self._find_highlight_coordinates(
                            pdf_document, 
                            text_part
                        )
                        
                        first_highlight_id = None
                        if all_coordinates:
                            # Create a highlight for each found instance
                            for i, coordinates in enumerate(all_coordinates):
                                highlight_id = str(uuid.uuid4())
                                if i == 0:
                                    first_highlight_id = highlight_id
                                
                                highlight = HighlightResponse(
                                    id=highlight_id,
                                    position=coordinates["position"],
                                    content=coordinates["content"],
                                    category=category,
                                    emoji=self.category_emojis[category],
                                    timestamp=datetime.now(),
                                    comment=f"Related to: {original_query[:50]}..."
                                )
                                highlights.append(highlight)
                        
                        # Store reference for embedding in explanation
                        if first_highlight_id:
                            highlight_refs.append({
                                "text_snippet": text_part[:50],  # First 50 chars for matching
                                "highlight_id": first_highlight_id,
                                "category": category.value
                            })
                            
                    except Exception as e:
                        print(f"Error parsing highlight line: {line}, Error: {e}")
                        continue
        
        # Embed highlight references in the explanation
        enhanced_explanation = self._embed_highlight_references(explanation, highlight_refs)
            
        return AnalysisResult(
            explanation=enhanced_explanation,
            highlights=highlights,
            confidence=0.9 if highlights else 0.7
        )
    
    def _embed_highlight_references(self, explanation: str, highlight_refs: list) -> str:
        """Embed clickable highlight references at the end of the response."""
        if not highlight_refs:
            return explanation
        
        # Create clickable references for all highlights
        highlight_tags = []
        for ref in highlight_refs:
            highlight_tag = f"[[highlight:{ref['category']}:{ref['highlight_id']}]]"
            highlight_tags.append(highlight_tag)
        
        # Add all highlight references at the end with some spacing
        if highlight_tags:
            enhanced_explanation = explanation + "\n\n" + " ".join(highlight_tags)
        else:
            enhanced_explanation = explanation
        
        return enhanced_explanation
    
    def _map_category(self, category_str: str) -> HighlightCategory:
        """Map category string to enum."""
        category_lower = category_str.lower()
        if "important" in category_lower:
            return HighlightCategory.IMPORTANT
        elif "thoughts" in category_lower:
            return HighlightCategory.THOUGHTS
        else:
            return HighlightCategory.GENERAL
    
    async def _find_highlight_coordinates(
        self, 
        pdf_document: PDFDocument, 
        text_snippet: str
    ) -> List[Dict[str, Any]]:
        """
        Find all coordinates for a text snippet in the PDF.
        It groups rectangles on the same page into a single highlight object.
        """
        # The AI can sometimes wrap snippets in quotes, so we remove them.
        clean_snippet = text_snippet.strip().strip('"')
        
        # Skip snippets that are too short to be meaningful.
        if len(clean_snippet) < 15 or len(clean_snippet.split()) < 3:
            return []

        # Use the robust search method from the PDFProcessor.
        found_rect_infos = self.pdf_processor.search_for_snippet(
            pdf_document.file_path,
            clean_snippet
        )

        # Group all found rectangles by their page number.
        page_groups: Dict[int, List[Dict[str, Any]]] = {}
        for rect_info in found_rect_infos:
            page_num = rect_info["page_number"]
            if page_num not in page_groups:
                page_groups[page_num] = []
            page_groups[page_num].append(rect_info)

        # Process each page group into a single highlight coordinate object.
        all_coordinates = []
        for page_num, rect_infos_on_page in page_groups.items():
            page_dims = next((p for p in pdf_document.page_dimensions if p.page_number == page_num), None)
            if not page_dims:
                continue
            
            page_height = page_dims.height
            transformed_rects = []
            
            for rect_info in rect_infos_on_page:
                bbox = rect_info["bbox"]
                transformed_rects.append({
                    "x1": bbox["x0"],
                    "y1": page_height - bbox["y1"],
                    "x2": bbox["x1"],
                    "y2": page_height - bbox["y0"],
                    "width": bbox["x1"] - bbox["x0"],
                    "height": bbox["y1"] - bbox["y0"],
                })

            if not transformed_rects:
                continue

            # Create a single bounding box that covers all the individual rectangles.
            min_x1 = min(r['x1'] for r in transformed_rects)
            min_y1 = min(r['y1'] for r in transformed_rects)
            max_x2 = max(r['x2'] for r in transformed_rects)
            max_y2 = max(r['y2'] for r in transformed_rects)
            
            overall_bounding_rect = {
                "x1": min_x1, "y1": min_y1, "x2": max_x2, "y2": max_y2,
                "width": max_x2 - min_x1, "height": max_y2 - min_y1,
            }

            coordinate_data = {
                "position": Position(
                    boundingRect=overall_bounding_rect,
                    rects=transformed_rects,
                    pageNumber=page_num
                ),
                "content": Content(text=clean_snippet)
            }
            all_coordinates.append(coordinate_data)
        
        return all_coordinates
    
    def _format_conversation_history(self, session_id: str) -> str:
        """Format conversation history for context."""
        if session_id not in self.sessions:
            return ""
        
        history = self.sessions[session_id].get("messages", [])
        formatted = []
        
        for msg in history[-5:]:  # Last 5 messages for context
            formatted.append(f"{msg['role'].upper()}: {msg['content']}")
        
        return "\n".join(formatted)
    
    def _update_session(
        self, 
        session_id: str, 
        user_query: str, 
        ai_response: str,
        pdf_id: str
    ):
        """Update session with new message exchange."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "messages": [],
                "pdf_id": pdf_id,
                "created_at": datetime.now()
            }
        
        session = self.sessions[session_id]
        session["messages"].extend([
            {
                "role": "user",
                "content": user_query,
                "timestamp": datetime.now()
            },
            {
                "role": "assistant", 
                "content": ai_response,
                "timestamp": datetime.now()
            }
        ])
        
        # Keep only last 20 messages to manage memory
        if len(session["messages"]) > 20:
            session["messages"] = session["messages"][-20:]
    
    def create_session(self, pdf_id: str) -> str:
        """Create new chat session."""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "messages": [],
            "pdf_id": pdf_id,
            "created_at": datetime.now()
        }
        return session_id
    
    def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get session message history."""
        if session_id not in self.sessions:
            return []
        
        return self.sessions[session_id].get("messages", [])
    
    def get_pdf_highlights(self, pdf_id: str) -> List[HighlightResponse]:
        """Get all highlights for a specific PDF."""
        return self.pdf_highlights.get(pdf_id, []) 