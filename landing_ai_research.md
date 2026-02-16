# Landing AI (ADE) Research & Integration Strategy

## 1. Overview
Landing AI's **Agentic Document Extraction (ADE)** is a system designed to process unstructured documents (PDFs, images, scans) and structured files (Excel, CSV) into clean, usable data. Unlike traditional OCR, it uses Large Multimodal Models (LMMs) to understand layout, context, and visual elements.

The core workflow consists of three main stages:
1.  **Parse**: Converts raw documents into "Grounded Markdown" and semantic chunks.
2.  **Split** (Optional): Logically divides a document into sections (e.g., separating "Bank Statement" from "Pay Stub" in a single PDF).
3.  **Extract**: Transforms the Markdown content into structured JSON data based on a defined schema (Pydantic model or JSON Schema).

## 2. Key Concepts & Terminology
-   **Grounded Markdown**: A markdown representation of the document that retains layout information effectively.
-   **Splits**: Logical sections of a document defined by rules.
-   **Schema**: A definition (Pydantic or JSON) of the data structure you want to extract.
-   **Vision Agent**: The underlying engine powered by Landing AI's models.

## 3. Technical Implementation Details

### 3.1 Authentication
-   **API Key**: Required. Obtain from Landing AI settings.
-   **Environment Variable**: `VISION_AGENT_API_KEY`
-   **Python Setup**:
    ```python
    from dotenv import load_dotenv
    load_dotenv() # Loads VISION_AGENT_API_KEY
    ```

### 3.2 Python SDK (`landingai-ade`)
The primary way to interact with the service is via the Python SDK.
-   **Installation**: `pip install landingai-ade`
-   **Client Initialization**:
    ```python
    from landingai_ade import LandingAIADE
    client = LandingAIADE()
    ```

### 3.3 Core Operations

#### A. Parsing (The Foundation)
Converts a file to Markdown. This is the prerequisite for extraction.
```python
response = client.parse(
    document=Path("/path/to/file.pdf"),
    model="dpt-2-latest" # Current best model for parsing
)
markdown_content = response.markdown
chunks = response.chunks # Useful for RAG or detailed inspection
```

#### B. Splitting (Optional)
Useful for processing multi-document files.
```python
split_rules = [
    {"name": "Invoice", "description": "..."},
    {"name": "Receipt", "description": "..."}
]
split_response = client.split(
    split_class=split_rules,
    markdown=markdown_content,
    model="split-latest"
)
```

#### C. Extraction (The Intelligence)
Extracts structured data using a schema.
```python
# Define Schema using Pydantic (Recommended)
class InvoiceData(BaseModel):
    invoice_number: str = Field(description="The unique invoice ID")
    total_amount: float = Field(description="Total due")

# Extract
schema = pydantic_to_json_schema(InvoiceData)
extract_response = client.extract(
    schema=schema,
    markdown=markdown_content, 
    model="extract-latest"
)
print(extract_response.extraction)
```

## 4. Integration Plan for DataIQ

### Backend (Django)
1.  **Service Layer**: Create `services/document_intelligence.py` to wrap the `LandingAIADE` client.
2.  **API Endpoint**: 
    -   POST `/api/v1/documents/analyze`: Accepts a file upload.
    -   Process:
        1.  Save file to temporary storage or S3/Firebase.
        2.  Call `client.parse()` to get Markdown.
        3.  Start an async job for `client.extract()` based on user-selected or auto-detected schema.
    -   Store results (Markdown + Extracted JSON) in the database (Supabase/Postgres).

### Frontend (React)
1.  **DocumentIntelligencePage**:
    -   Drag & Drop zone (already implemented).
    -   **Schema Builder**: A UI to let users define what fields they want to extract (generating the JSON schema dynamically).
    -   **Results View**: 
        -   Left pane: PDF Preview (using a viewer).
        -   Right pane: Extracted Data Form (editable).
        -   "Markdown View" toggle to see the raw parsed content.

## 5. Next Steps
1.  Install `landingai-ade` in the backend environment.
2.  Set `VISION_AGENT_API_KEY` in `.env`.
3.  Implement the backend service to handle the Parse -> Extract flow.
4.  Update the frontend to send files to this new backend endpoint instead of the current mock/client-side parsing.
