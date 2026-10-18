from __future__ import annotations
import logging
import re
from app.config import settings

try:
    from google import genai
    logging.info("Successfully imported google-genai library.")
except ImportError:
    genai = None
    logging.warning("google-genai library not found. Diagram and image generation will not work.")

logger = logging.getLogger(__name__)

class DiagramsModel:
    def __init__(self):
        self.genai_client = None

    def _initialize_client(self):
        if self.genai_client:
            return

        if genai and settings.google_api_key:
            try:
                logger.info("Initializing Google GenAI client...")
                self.genai_client = genai.Client(api_key=settings.google_api_key)
                logger.info("Google GenAI client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}", exc_info=True)
                self.genai_client = None
        else:
            logger.warning("GenAI client cannot be initialized: API key or library missing.")

    def _generate_text_content(self, prompt: str) -> str:
        """Helper to call the text-based generative model."""
        self._initialize_client()

        if not self.genai_client:
            raise ValueError("GenAI client is not initialized. Check logs for errors.")
        try:
            response = self.genai_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            text = response.text.strip()
            
            # More robustly strip markdown code fences if they exist
            # e.g. ```mermaid\n...\n```
            match = re.search(r"```(?:\w+)?\n(.*?)\n```", text, re.DOTALL)
            if match:
                # If we have a fenced block, return its content
                return match.group(1).strip()
            
            # If no fences, return the raw text (fallback)
            return text
        except Exception as e:
            logger.error(f"Error calling Google GenAI for text generation: {e}", exc_info=True)
            raise

    def generate_mermaid_diagram(self, description: str) -> str:
        """
        Generates a Mermaid diagram syntax from a description using a LLM.
        """
        prompt = f"""
        You are an expert in Mermaid.js syntax. Your task is to generate a valid Mermaid.js diagram based on the user's description.

        1. **Analyze the Request**: Read the user's description and choose the most appropriate diagram type (e.g., `graph TD` for a flowchart, `pie` for a pie chart, `gantt` for a Gantt chart, `timeline` for a timeline, etc.).
        2. **Generate the Code**: Create the complete and valid Mermaid.js code for the chosen diagram.
        3. **Vertical Layout**: If the diagram type supports it (like flowcharts), prefer a vertical layout (e.g., `graph TD`) to best fit a tall, narrow container. For other types like pie charts, this is not applicable.
        4. **Format the Output**: You MUST return the diagram code inside a single Mermaid markdown code block. Do NOT add any explanation before or after the code block.

        Description: "{description}"
        """
        content = self._generate_text_content(prompt)

        # Programmatically fix common syntax errors where the LLM uses parentheses
        # inside node text without quoting the text. This is a common Mermaid syntax violation
        # that this code now robustly corrects for all node shapes.
        # e.g., it transforms invalid `A[Input (Q,K)]` to valid `A["Input (Q,K)"]`
        # and invalid `B{Rhombus (shape)}` to valid `B{"Rhombus (shape)"}`.

        def quote_node_if_needed(match_obj):
            """A replacer function for re.sub that quotes a node's text if it contains parens."""
            node_id = match_obj.group(1)
            node_definition = match_obj.group(2)
            node_text = node_definition[1:-1]

            # Check if text contains parens and is not already quoted
            if '(' in node_text and not node_text.startswith('"'):
                # Quote the text and reconstruct the full node definition
                return f'{node_id}{node_definition[0]}"{node_text}"{node_definition[-1]}'
            
            # If no change is needed, return the original full match
            return match_obj.group(0)

        # This pattern finds a node ID (e.g. 'A') followed by its definition, which can be
        # in square brackets, parentheses, or curly braces.
        processed_content = re.sub(
            r'(\w+)(\[.*?\]|\(.*?\)|{.*?})',
            quote_node_if_needed,
            content
        )

        # As a fallback, remove any accidental semicolons
        return processed_content.replace(';', '')

    def generate_equation(self, description: str) -> str:
        """
        Generates a LaTeX equation string from a description using a LLM.
        """
        prompt = f"""
        You are an expert in LaTeX.
        Your task is to convert the following description of a mathematical equation into a single, valid LaTeX string.
        The equation will be rendered in a container that is roughly 500px wide.
        To prevent horizontal overflow, you MUST use appropriate line-breaking environments like 'align*' or 'split' for any long equations. Ensure each line does not exceed approximately 50 characters. Use '\\\\' for line breaks within these environments.
        ONLY return the LaTeX string. Do not include any explanation or delimiters like '$' or '$$'.

        Description: "{description}"
        """
        return self._generate_text_content(prompt)

    def generate_animation_spec(self, description: str, duration_seconds: int = 5) -> str:

        prompt = f"""
        You are a world-class motion graphics designer with a unique genius for explaining any concept with stunning clarity and creativity. Your animations transform complex topics into visual stories that are instantly understandable and captivating.

        Your task is to generate a JSON specification for a beautiful, minimalist, and highly creative animation that visually explains the user-provided concept.

        The user wants: **"{description}"**
        The total animation should last **{duration_seconds} seconds**.

        ### Core Creative Mandate

        **1. Geometric Storytelling:**

          * Your primary creative tools are **squares, squircles (shapes blending squares and circles), and lines**.
          * Represent objects, actions, and ideas using these shapes. A large, stable square could be a core foundation; a cluster of small, energetic squircles could be data points; a line can show a connection or path.
          * Give them profound meaning through their interaction, size, color, and motion.

        **2. Notion-Inspired Aesthetic:**

          * The entire design language must be modern, clean, and inspired by the organized calm of Notion.
          * **Layout:** Use a block-based layout with generous, consistent spacing for a structured, minimalist elegance.
          * **Color Palette:** Strictly use the following harmonious, earthy palette. The main animation background is Cream.
              * **Background:** `#FEF5ED` (Cream)
              * **Shapes:** `#D3E4CD` (Light Sage), `#ADC2A9` (Medium Sage), `#99A799` (Dark Sage)
              * **Text & Strokes:** Use a dark color like `#333333` or `#000000` for high contrast and legibility.
          * **Typography:** Use a modern, geometric sans-serif font. Text must be an integral part of the clean design, centered within its shape or placed cleanly below it.

        **3. Create "Aha\!" Moments:**

          * The animation's flow must be meticulously choreographed to guide the viewer's understanding, making the complex simple and the simple profound.

        ### RULES FOR THE JSON

        1.  **Valid JSON only**: No comments, no trailing commas, no markdown.

        2.  **Root object**: Must have `duration` (int) and `elements` (array).

        3.  **Element objects**: Each object in `elements` represents a layer in the animation. It must have a `kind`.

        4.  **Kinds of elements**:

              * `"text"`, `"box"`: Simple elements. They have `style`, `initial`, `animate`, `exit` keys. For text, also include a `text` key with a **string value**.
              * `"svg"`: **This is PREFERRED** for creating your squares, squircles, and lines. An "svg" element has an `svg` object containing:
                  * `viewBox`: string (e.g., "-400 -300 800 600").
                  * `elements`: An array of SVG shapes to render. Each shape has:
                      * `tag`: string for an SVG element (e.g., `"path"`, `"rect"`, `"text"`). **For SVG text, the content goes in a `text` property inside this object.**
                      * SVG attributes (`d`, `x`, `y`, `width`, `height`, `fill`, `stroke`, `strokeWidth`, `textAnchor`, etc.).
                      * `initial`, `animate`, `exit` properties for Framer Motion on that specific shape. This is how you create drawing effects (e.g., animate `pathLength` on a `path`).

        5.  **Animation Properties**:

              * `initial`, `animate`, `exit` follow Framer Motion's API. You can animate properties like `opacity`, `scale`, `x`, `y`, and SVG-specific attributes like `pathLength`.
              * You can include a `transition` object inside them (`duration`, `delay`, `type: "spring"`, etc.).
              * The total duration of any animation (delay + duration) should not exceed the root `duration`. Use delays to sequence animations precisely.
              * Use coordinates within a rough `-400` to `400` viewport for `x` and `y` positioning.


        """
        return self._generate_text_content(prompt)

diagrams_model = DiagramsModel() 