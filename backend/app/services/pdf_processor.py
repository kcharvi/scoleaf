import fitz  # PyMuPDF
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path
import base64
import io
from PIL import Image

from ..models.file import PDFDocument, PDFElement, PageDimensions


class PDFProcessor:
    """
    PDF processing service using PyMuPDF for robust document parsing.
    Extracts text, images, and tables with precise coordinate information.
    """
    
    def __init__(self):
        self.supported_formats = ['.pdf']
    
    async def process_pdf(self, file_path: str, filename: str) -> PDFDocument:
        """
        Process a PDF file and extract all content with coordinates.
        
        Args:
            file_path: Path to the PDF file
            filename: Original filename
            
        Returns:
            PDFDocument with extracted elements and metadata
        """
        doc_id = str(uuid.uuid4())
        
        try:
            # Open PDF document
            pdf_document = fitz.open(file_path)
            page_count = len(pdf_document)
            file_size = Path(file_path).stat().st_size
            
            # Extract all elements from all pages
            elements = []
            full_text = ""
            page_dimensions = []
            
            for page_num in range(page_count):
                page = pdf_document[page_num]
                
                # Store page dimensions
                page_rect = page.rect
                page_dimensions.append(
                    PageDimensions(
                        page_number=page_num + 1,
                        width=page_rect.width,
                        height=page_rect.height
                    )
                )

                page_elements = await self._extract_page_elements(page, page_num + 1)
                elements.extend(page_elements)
                
                # Extract full text for each page
                page_text = page.get_text()
                full_text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            
            pdf_document.close()
            
            return PDFDocument(
                id=doc_id,
                filename=filename,
                file_path=file_path,
                file_size=file_size,
                page_count=page_count,
                elements=elements,
                page_dimensions=page_dimensions,
                full_text=full_text,
                upload_timestamp=datetime.now()
            )
            
        except Exception as e:
            raise Exception(f"Error processing PDF: {str(e)}")
    
    async def _extract_page_elements(self, page: fitz.Page, page_number: int) -> List[PDFElement]:
        """Extract all elements from a single PDF page."""
        elements = []
        
        # Extract text blocks with coordinates
        text_blocks = page.get_text("dict")
        for block in text_blocks.get("blocks", []):
            if block.get("type") == 0:  # Text block
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if span.get("text", "").strip():
                            bbox = span["bbox"]
                            element = PDFElement(
                                type="text",
                                content=span["text"],
                                page_number=page_number,
                                bbox={
                                    "x0": bbox[0],
                                    "y0": bbox[1],
                                    "x1": bbox[2],
                                    "y1": bbox[3]
                                },
                                font_info={
                                    "font": span.get("font", ""),
                                    "size": span.get("size", 0),
                                    "flags": span.get("flags", 0),
                                    "color": span.get("color", 0)
                                }
                            )
                            elements.append(element)
        
        # Extract images
        image_list = page.get_images()
        for img_index, img in enumerate(image_list):
            try:
                # Get image data
                base_image = page.parent.extract_image(img[0])
                image_bytes = base_image["image"]
                
                # Convert to base64 for storage/transmission
                image_base64 = base64.b64encode(image_bytes).decode()
                
                # Get image rectangle
                image_rects = page.get_image_rects(img)
                if image_rects:
                    rect = image_rects[0]
                    element = PDFElement(
                        type="image",
                        content=f"data:image/{base_image['ext']};base64,{image_base64}",
                        page_number=page_number,
                        bbox={
                            "x0": rect.x0,
                            "y0": rect.y0,
                            "x1": rect.x1,
                            "y1": rect.y1
                        }
                    )
                    elements.append(element)
            except Exception as e:
                print(f"Error extracting image {img_index} on page {page_number}: {e}")
                continue
        
        # Extract tables (basic table detection)
        tables = page.find_tables()
        for table_index, table in enumerate(tables):
            try:
                table_data = table.extract()
                if table_data:
                    # Convert table to text representation
                    table_text = self._table_to_text(table_data)
                    bbox = table.bbox
                    
                    element = PDFElement(
                        type="table",
                        content=table_text,
                        page_number=page_number,
                        bbox={
                            "x0": bbox[0],
                            "y0": bbox[1],
                            "x1": bbox[2],
                            "y1": bbox[3]
                        }
                    )
                    elements.append(element)
            except Exception as e:
                print(f"Error extracting table {table_index} on page {page_number}: {e}")
                continue
        
        return elements
    
    def _table_to_text(self, table_data: List[List[str]]) -> str:
        """Convert table data to a readable text format."""
        if not table_data:
            return ""
        
        # Create a simple text representation of the table
        text_lines = []
        for row in table_data:
            # Clean and join cells
            clean_row = [str(cell).strip() if cell else "" for cell in row]
            text_lines.append(" | ".join(clean_row))
        
        return "\n".join(text_lines)
    
    def search_for_snippet(self, file_path: str, text_snippet: str) -> List[Dict[str, Any]]:
        """
        Search for an exact text snippet across all pages and return its coordinates.
        This is more robust than iterating through elements for phrase matching.
        """
        all_coords = []
        try:
            pdf_document = fitz.open(file_path)
            
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                # Use quads=False to get simple Rect objects, which are sufficient.
                rects = page.search_for(text_snippet, quads=False) 
                
                if rects:
                    page_dims = {"width": page.rect.width, "height": page.rect.height}
                    for rect in rects:
                        all_coords.append({
                            "page_number": page_num + 1,
                            "bbox": {
                                "x0": rect.x0,
                                "y0": rect.y0,
                                "x1": rect.x1,
                                "y1": rect.y1,
                            },
                            "page_dims": page_dims,
                            "content": text_snippet 
                        })
            
            pdf_document.close()
        except Exception as e:
            print(f"Error during PDF snippet search: {e}")
            return []
            
        return all_coords
    
    def find_text_coordinates(self, pdf_document: PDFDocument, search_text: str) -> List[Dict[str, Any]]:
        """
        Find coordinates of specific text in the document.
        Used for creating highlights based on AI responses.
        """
        coordinates = []
        
        for element in pdf_document.elements:
            if element.type == "text" and search_text.lower() in element.content.lower():
                coordinates.append({
                    "page_number": element.page_number,
                    "bbox": element.bbox,
                    "content": element.content
                })
        
        return coordinates
    
    async def create_highlight_coordinates(
        self, 
        pdf_document: PDFDocument, 
        text_snippets: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Create highlight coordinate data for specific text snippets.
        Returns data in the format expected by the frontend highlighter.
        """
        highlights = []
        
        for snippet in text_snippets:
            coords = self.find_text_coordinates(pdf_document, snippet)
            
            for coord in coords:
                # The coordinate systems match, so no transformation is needed.
                bbox = coord["bbox"]
                highlight_data = {
                    "position": {
                        "boundingRect": {
                            "x1": bbox["x0"],
                            "y1": bbox["y0"], 
                            "x2": bbox["x1"],
                            "y2": bbox["y1"],
                            "width": bbox["x1"] - bbox["x0"],
                            "height": bbox["y1"] - bbox["y0"]
                        },
                        "rects": [{
                            "x1": bbox["x0"],
                            "y1": bbox["y0"],
                            "x2": bbox["x1"], 
                            "y2": bbox["y1"],
                            "width": bbox["x1"] - bbox["x0"],
                            "height": bbox["y1"] - bbox["y0"]
                        }],
                        "pageNumber": coord["page_number"]
                    },
                    "content": {
                        "text": coord["content"]
                    }
                }
                highlights.append(highlight_data)
        
        return highlights 