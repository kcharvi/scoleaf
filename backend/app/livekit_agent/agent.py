from __future__ import annotations
import logging
import json
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
    function_tool,
    RunContext,
    get_job_context,
    ToolError,
    RoomInputOptions,  # NEW: enable video support
)
from livekit.plugins import google
from app.services.file_service import FileService
from app.services.pdf_processor import PDFProcessor
from app.models.file import PDFDocument
from app.models.diagrams_model import diagrams_model
import aiohttp
import tempfile
import os
import uuid

logger = logging.getLogger("pdf-explainer")
load_dotenv()


class PDFExplainerAgent(Agent):
    def __init__(self, file_service: FileService):
        super().__init__(
            instructions="""



**Persona: Leaf, Your Fun-Loving Tutor from Scoleaf\!**

**You are Leaf, designed by Scoleaf.** Your main motto is **FUN\!** You are a personal tutor designed to explain **anything** in a fun, interactive, and inspiring way.

-----

### **Your Four Main Goals**

1.  **Super Interactive (Verbal & Visual):**

      * **Verbally:** Constantly talk with the student. Ask engaging questions that go beyond just checking understanding (e.g., "Tell me something beside you, and let's use that as an example\!" or "What's your favorite [hobby/movie/food]?").
      * **Visually:** **Always** use your tools (`display_illustration`, `highlight_text`, `scroll_to_page`) to interact with the document. Use visual aids like diagrams and illustrations **very, very frequently**—almost every 5 sentences if applicable.
      * **Mermaid Diagrams:** Use **all kinds** of Mermaid diagrams (flowchart, sequence, class, state, ER, Gantt, pie, requirement, Git, C4, block, info, XY, radar, etc.) to explain concepts. **Do not use the same diagram type sequentially.** You can use a flow diagram, then a sequence diagram, then another flow diagram, but not flow-flow-flow.

2.  **Engaging & Inspiring Conversations:**

      * Beyond the subject matter, have random, lighthearted conversations about life, crushes, or anything that makes learning fun and personal.
      * **Inspire** students by bringing up real-world examples, like Steve Jobs or other influential figures, explaining how they changed the game and why the current topic is relevant to their own potential success. For younger students, focus on hope and fun.

3.  **Language Flexibility:**

      * You can switch the language of explanation if requested by the student.

4.  **Dynamic Modes:**

      * You have two primary explanation modes:
          * **Detail Mode:** Explain concepts section-wise or page-wise in depth.
          * **Brief Mode:** Act like a professor, picking out the main points and explaining them concisely.
      * Decide the mode naturally based on what the user wants. Otherwise, default to answering their questions directly.

-----

### **Initial Engagement & Rapport Building**

  * **Do NOT jump straight into teaching.** Unless the student explicitly requests to start learning or asks a direct teaching question, prioritize building rapport first. Your first two or three guestions or greetinfs should be stricly related to the information that's not in the document. No terminology or concepts should be used from the document.
  Initial Greeting & Engagement
    - Your very first response will ONLY be a friendly greeting. Do not mention any terms from the document or try to start teaching immediately. Focus on building quick rapport.
    - Example: "Hey there! Leaf here, ready to make learning fun! What's up today?" or "Yo! It's Leaf. Ready to dive into some cool stuff, or just chill for a sec?"
    - Do NOT jump straight into teaching after the greeting. Unless the student explicitly requests to start learning or asks a direct teaching question, prioritize building rapport first.
  * Start with short, conversational answers, jokes, or light chatter. "Waste some time" getting to know the student or setting a relaxed tone before diving into the main subject.
  * Your goal is to make the student feel comfortable and engaged before the formal learning begins.

-----

### **Assignment Assistance & Privacy**

  * **Assignments:** If the document is an assignment, you can help the student answer questions. You can ask them to share their screen and **guide them, give hints, or correct their approach**, but **never give them the direct answers.**
  * **Privacy (from Scoleaf):**
      * "Scoleaf is not storing your data or history, so don't worry."
      * "Even if you switch on your camera or share your screen, we are not using that data to train models or anything."

-----

### **Interaction & Tone Guidelines**


  * **Your Response Length (as Leaf):** Keep your responses **short and concise**, like voice responses. Increase the length only if the situation genuinely demands a more detailed explanation. Avoid long monologues.
  * **Verbal Interaction:** Be **super interactive verbally**. Constantly talk with the student, ask questions, and build examples using their interests. Sound like a super fun, relaxed bestie who's really good at explaining stuff.
      * Use casual phrases like: "Alright, check this out…", "Yo, that part's wild, lemme show you.", "Hold up—this'll make it click…", "Quick diagram moment\!", "Okay pause—how would *you* explain that?"
      * **Ask about their interests (Marvel, hobbies, movies, foods, sports, etc.) and use them in explanations:** "You like Marvel? Then think of this like Tony Stark's suit modules..."
      * Start conversations casually.
  * **Live Video Input & Scolding (Crucial for interaction):**
      * You have live video input of the student, allowing you to observe their attention.
      * If the student is looking away from the screen or not paying attention, **scold them hard\!** Use a higher-pitched tone and shout (within reason for a digital tutor). Integrate popsqueaks or jokes with the scolding. "You are a teacher; it's divine\! It keeps it natural, okay?"
      * **If the student provides short, one-word responses, strictly tell them:** "Hey, switch on your camera, I need to see you\! You are not paying attention..." (or similar, firm phrasing).

-----

### **Tool Usage (Critical)**

Use your tools **all the time** as part of your natural flow. You **do not** need to be asked. If something can be shown, **show it immediately.**

#### 🔹 `display_illustration(illustration_type, description)`

  * Use for **every concept**—even small ones.
  * Mention them naturally: "This looks like this—lemme sketch it.", "Boom. Visual incoming.", "Makes way more sense like this—check it out."
  * **`illustration_type`**: Must be 'mermaid' or 'equation'.
  * **`description`**: Detailed description for generating the diagram, or raw content for mermaid/equation.
  * **Mermaid Diagram Types to Use (Vary them\!):** `flowchart TD`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, `erDiagram`, `gantt`, `pie`, `requirementDiagram`, `gitGraph`, `C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment`, `blockDiagram`, `infoDiagram`, `xychartDiagram`, `radar-beta`, and any other supported Mermaid types.

#### 🔹 `highlight_text(category, text)`

  * Highlight **2–5 full sentences** from the document that support your point.
  * Use after or during your explanation to back it up with real content.
  * Introduce casually: "This bit here nails it…", "Here's what the doc actually says:"
  * **Highlight Block Format (Use only exact quotes, complete sentences):**
    ```
    [HIGHLIGHTS]

    Category: important | Text: "exact quote from the document."

    Category: general | Text: "another exact quote."

    Category: thoughts | Text: "third quote if relevant."

    [/HIGHLIGHTS]
    ```

#### 🔹 `scroll_to_page(page_number)`

  * Jump to the right section of the document to guide the student.
  * Use when you're referencing examples, summaries, or equations.
  * Say things like: "Flipping to the page with the juicy stuff...", "This part here's where it all goes down—let's scroll."

-----

### **✅ Final Rules & Reminders**

  * **Always sound human**—super natural, super friendly, always curious.
  * **NEVER monologue**—talk short, ask often, show constantly.
  * Use tools like you're drawing on a whiteboard in a fun classroom.
  * **Always scroll to the page you are talking about.**
  * **Always highlight the text you are talking about.**
  * **Always show a flowchart to show what you are going to talk about.** (Vary diagram types\!)
  * **Always display an illustration you are talking about** using `display_illustration` (EVERY 5 SENTENCES, or whenever visually relevant).
  * If you say something, try to **show it immediately.**
  * Keep the vibe light, goofy, real, and super sharp.
  * Keep the student engaged with constant conversation and visual rhythm.

-----



""",
            llm=google.beta.realtime.RealtimeModel(
                model="gemini-live-2.5-flash-preview",
                temperature=1.0,
                vertexai=False,
            ),
        )
        self.file_service = file_service
        self.pdf_processor = PDFProcessor()
        self.pdf_document: PDFDocument | None = None

    async def _get_user_participant(self) -> Participant | None:
        job_ctx = get_job_context()
        room = job_ctx.room
        return next((p for p in room.remote_participants.values() if p.identity == 'pdf_explainer_user'), None)

    async def on_enter(self):
        ctx = get_job_context()
        try:
            logger.info("Agent entered room, waiting for user participant...")
            user_participant = await ctx.wait_for_participant(identity="pdf_explainer_user")
            logger.info(f"User participant '{user_participant.identity}' found.")

            pdf_id = None
            pdf_url = None
            if user_participant.metadata:
                logger.info(f"User metadata found: {user_participant.metadata}")
                metadata = json.loads(user_participant.metadata)
                pdf_id = metadata.get("pdf_id")
                pdf_url = metadata.get("pdf_url")
            else:
                logger.warning("User participant connected but has no metadata.")

            # Try to load from local FileService if pdf_id provided
            if pdf_id:
                logger.info(f"Found pdf_id: {pdf_id}. Attempting to load from FileService.")
                self.pdf_document = self.file_service.get_document(pdf_id)

            # Fallback to downloading via URL if not found locally
            if not self.pdf_document and pdf_url:
                try:
                    logger.info(f"Downloading PDF from remote URL for agent: {pdf_url}")
                    local_path = await self._download_pdf(pdf_url)
                    self.pdf_document = await self.pdf_processor.process_pdf(local_path, os.path.basename(local_path))
                    # Save into FileService cache for future lookups
                    if pdf_id:
                        self.pdf_document.id = pdf_id
                    self.file_service.documents[self.pdf_document.id] = self.pdf_document
                except Exception as e:
                    logger.error(f"Failed to download/process remote PDF: {e}")

            if self.pdf_document:
                logger.info(f"Agent loaded PDF successfully with {len(self.pdf_document.elements)} extracted elements.")
                document_context = self._prepare_document_context(self.pdf_document)
                initial_prompt = f"""You now have access to the PDF document "{self.pdf_document.filename}". 
                Here's the document content for your reference:

                {document_context}

                Give a warm, engaging introduction to this document and ask the user what they'd like to explore first. 
                Keep your intro brief but exciting - make them want to learn more!"""
                self.session.generate_reply(instructions=initial_prompt)
            else:
                logger.error("Agent could not load any PDF document.")
                self.session.generate_reply(
                    instructions="Hello! I'm ready to teach, but it looks like the PDF document could not be loaded. Please try re-uploading it."
                )

        except Exception as e:
            logger.error(f"Error during agent on_enter: {e}", exc_info=True)
            self.session.generate_reply(
                instructions="Hello! I've encountered an unexpected error while loading the PDF document. Please check the logs."
            )

    def _prepare_document_context(self, pdf_document: PDFDocument) -> str:
        """Prepare PDF document content for AI analysis - same as text mode."""
        context_parts = [
            f"Document: {pdf_document.filename}",
            f"Pages: {pdf_document.page_count}",
            f"Elements: {len(pdf_document.elements)}",
            "",
            "=== DOCUMENT CONTENT ===",
            pdf_document.full_text[:100000],  # Same limit as text mode
        ]
        return "\n".join(context_parts)

    @function_tool()
    async def display_illustration(
        self,
        context: RunContext,
        illustration_type: str,
        description: str,
    ):
        """
        Displays a visual illustration on the user's whiteboard.
        Use this to show diagrams (Mermaid) or mathematical equations to aid in your explanation.

        Args:
            illustration_type: The type of illustration. Must be either 'mermaid' or 'equation'.
            description: A detailed description for generating the diagram, or the raw content for mermaid/equation.
        """
        job_ctx = get_job_context()
        room = job_ctx.room
        user_participant = await self._get_user_participant()
        if not user_participant:
            raise ToolError("Could not find user participant to send illustration")

        tool_call_id = str(uuid.uuid4())
        content = ""
        try:
            # Notify frontend that tool call has started
            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="tool_call",
                payload=json.dumps({
                    "event": "start",
                    "id": tool_call_id,
                    "tool_name": f"display_{illustration_type}",
                }),
            )

            if illustration_type == "mermaid":
                content = diagrams_model.generate_mermaid_diagram(description)
            elif illustration_type == "equation":
                content = diagrams_model.generate_equation(description)
            else:
                raise ToolError(f"Unknown illustration type: {illustration_type}")

            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="display_illustration",
                payload=json.dumps({
                    "type": illustration_type,
                    "content": content,
                }),
            )
            logger.info(f"Displayed {illustration_type} illustration.")

        except Exception as e:
            # Log the error for debugging, but DO NOT raise a ToolError.
            # Raising a ToolError causes the agent to speak the error message,
            # which clutters the UI with unwanted transcriptions. The frontend
            # already displays a detailed error inside the whiteboard component.
            logger.error(f"Error displaying illustration, but suppressing ToolError to prevent spoken error: {e}", exc_info=True)
            # By not raising an error, we gracefully fail without informing the LLM,
            # which prevents the unwanted UI behavior.
        finally:
            # Notify frontend that tool call has ended
            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="tool_call",
                payload=json.dumps({
                    "event": "end",
                    "id": tool_call_id,
                }),
            )

    # @function_tool()
    # async def display_animation(
    #     self,
    #     context: RunContext,
    #     description: str,
    #     duration_seconds: int = 5,
    # ):
    #     """
    #     Creates a full-screen Framer-Motion animation on the student's device.
    #     The heavy spec-generation runs in the background so the tool returns
    #     instantly (prevents the Gemini Live model from pausing speech).
    #     """
    #     job_ctx = get_job_context()
    #     room = job_ctx.room
    #     user_participant = await self._get_user_participant()
    #     if not user_participant:
    #         raise ToolError("Could not find user participant to send animation RPC")

    #     tool_call_id = str(uuid.uuid4())

    #     async def _generate_and_send():
    #         try:
    #             # Notify frontend that tool call has started
    #             await room.local_participant.perform_rpc(
    #                 destination_identity=user_participant.identity,
    #                 method="tool_call",
    #                 payload=json.dumps({
    #                     "event": "start",
    #                     "id": tool_call_id,
    #                     "tool_name": "display_animation",
    #                 }),
    #             )
    #             spec_json = diagrams_model.generate_animation_spec(description, duration_seconds)
    #             await room.local_participant.perform_rpc(
    #                 destination_identity=user_participant.identity,
    #                 method="display_animation",
    #                 payload=json.dumps({
    #                     "spec": spec_json,
    #                     "duration": duration_seconds,
    #                 }),
    #             )
    #             logger.info("display_animation RPC delivered (async).")
    #         except Exception as e:
    #             logger.error(f"Async display_animation failed: {e}", exc_info=True)
    #         finally:
    #             # Notify frontend that tool call has ended
    #             await room.local_participant.perform_rpc(
    #                 destination_identity=user_participant.identity,
    #                 method="tool_call",
    #                 payload=json.dumps({
    #                     "event": "end",
    #                     "id": tool_call_id,
    #                 }),
    #             )

    #     # Run generation in background; return immediately
    #     import asyncio
    #     asyncio.create_task(_generate_and_send())

    @function_tool()
    async def highlight_text(self, context: RunContext, text_to_highlight: str):
        """
        Highlights specific text in the PDF document.
        Use this when you want to draw attention to a specific passage, term, or concept you're explaining.
        
        Args:
            text_to_highlight: The exact text content you want to highlight (will search for coordinates automatically)
        """
        if not self.pdf_document:
            raise ToolError("No PDF document loaded")
            
        job_ctx = get_job_context()
        room = job_ctx.room
        user_participant = await self._get_user_participant()
        if not user_participant:
            raise ToolError("Could not find user participant to send highlight RPC")

        tool_call_id = str(uuid.uuid4())
        try:
            # Notify frontend that tool call has started
            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="tool_call",
                payload=json.dumps({
                    "event": "start",
                    "id": tool_call_id,
                    "tool_name": "highlight_text",
                }),
            )

            # Clean the text for search
            search_text = text_to_highlight.strip()
            
            # Try exact search first
            found_rect_infos = self.pdf_processor.search_for_snippet(
                self.pdf_document.file_path,
                search_text
            )
            
            # If exact search fails, try with normalized whitespace
            if not found_rect_infos:
                # Normalize whitespace (replace multiple whitespace chars with single spaces)
                import re
                normalized_text = re.sub(r'\s+', ' ', search_text)
                found_rect_infos = self.pdf_processor.search_for_snippet(
                    self.pdf_document.file_path,
                    normalized_text
                )
            
            # If still no results, try searching for the first significant sentence
            if not found_rect_infos and len(search_text) > 50:
                # Extract first meaningful sentence (up to first period or 100 chars)
                first_sentence = search_text.split('.')[0][:100].strip()
                if len(first_sentence) > 20:  # Only try if we have a meaningful chunk
                    found_rect_infos = self.pdf_processor.search_for_snippet(
                        self.pdf_document.file_path,
                        first_sentence
                    )
            
            if not found_rect_infos:
                logger.warning(f"Could not find coordinates for text: {search_text[:50]}...")
                raise ToolError(f"Could not locate the text '{search_text[:50]}...' in the document. Try highlighting a shorter, more specific phrase.")
            
            # Group rectangles by page and send to frontend
            page_groups = {}
            for rect_info in found_rect_infos:
                page_num = rect_info["page_number"]
                if page_num not in page_groups:
                    page_groups[page_num] = []
                page_groups[page_num].append(rect_info["bbox"])
            
            # Send highlight for each page (usually just one)
            for page_number, rects in page_groups.items():
                # Get the page dimensions for Y coordinate transformation
                page_dims = next((p for p in self.pdf_document.page_dimensions if p.page_number == page_number), None)
                if not page_dims:
                    logger.warning(f"Could not find page dimensions for page {page_number}")
                    continue
                
                page_height = page_dims.height
                
                # Transform coordinates to match the text mode format
                transformed_rects = []
                for bbox in rects:
                    # Apply the same transformation as in ai_service.py
                    transformed_rect = {
                        "x1": bbox["x0"],
                        "y1": page_height - bbox["y1"],  # Y coordinate flipped!
                        "x2": bbox["x1"],
                        "y2": page_height - bbox["y0"],  # Y coordinate flipped!
                        "width": bbox["x1"] - bbox["x0"],
                        "height": bbox["y1"] - bbox["y0"],
                    }
                    transformed_rects.append(transformed_rect)
                
                await room.local_participant.perform_rpc(
                    destination_identity=user_participant.identity,
                    method="highlight_text",
                    payload=json.dumps({
                        "page_number": page_number, 
                        "rects": transformed_rects  # Send transformed coordinates
                    }),
                )
                logger.info(f"Highlighted text on page {page_number} with {len(transformed_rects)} transformed rectangles")
                
        except Exception as e:
            logger.error(f"Error performing highlight_text RPC: {e}")
            raise ToolError(f"Failed to highlight text: {str(e)}")
        finally:
            # Notify frontend that tool call has ended
            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="tool_call",
                payload=json.dumps({
                    "event": "end",
                    "id": tool_call_id,
                }),
            )

    @function_tool()
    async def scroll_to_page(self, context: RunContext, page_number: int):
        """
        Scrolls the user's PDF view to a specific page number.
        Use this before discussing content on a new page to ensure the user is following along.

        Args:
            page_number: The page number to scroll to (1-indexed)
        """
        job_ctx = get_job_context()
        room = job_ctx.room
        user_participant = await self._get_user_participant()
        if not user_participant:
            raise ToolError("Could not find user participant to send scroll_to_page RPC")

        tool_call_id = str(uuid.uuid4())
        try:
            # Notify frontend that tool call has started
            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="tool_call",
                payload=json.dumps({
                    "event": "start",
                    "id": tool_call_id,
                    "tool_name": "scroll_to_page",
                }),
            )

            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="scroll_to_page",
                payload=json.dumps({"page_number": page_number}),
            )
            logger.info(f"Scrolled to page {page_number}")
        except Exception as e:
            logger.error(f"Error performing scroll_to_page RPC: {e}")
            raise ToolError(f"Failed to scroll to page {page_number}: {str(e)}")
        finally:
            # Notify frontend that tool call has ended
            await room.local_participant.perform_rpc(
                destination_identity=user_participant.identity,
                method="tool_call",
                payload=json.dumps({
                    "event": "end",
                    "id": tool_call_id,
                }),
            )

    async def _download_pdf(self, url: str) -> str:
        """Download a PDF from a URL to a temporary file and return the local path."""
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                resp.raise_for_status()
                data = await resp.read()
                tmp.write(data)
        tmp.close()
        return tmp.name


async def entrypoint(ctx: JobContext):
    # Configure logging to run in each agent process
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    # Silence noisy libraries
    logging.getLogger("websockets").setLevel(logging.WARNING)
    logging.getLogger("livekit.plugins").setLevel(logging.WARNING)

    await ctx.connect()
    file_service = FileService()
    agent = PDFExplainerAgent(file_service)
    session = AgentSession()
    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(video_enabled=True),
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint)) 