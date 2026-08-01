# PolyGraphRAG

**A Multi-Modal Knowledge Graph RAG Framework**

From documents to multi-modal knowledge graphs — an all-in-one PolyGraphRAG solution.

---

## Key Features

- **Text + Image unified modeling** — builds a single knowledge graph from both text and images
- **YOLO-based image segmentation** — extracts visual entities from figures and charts
- **Multi-modal entity fusion** — spectral clustering merges text and image graphs
- **Semantic RAG retrieval** — entity-level similarity search with multi-modal context
- **Interactive visualization** — built-in web server with force-directed graph explorer
- **Flexible ingestion** — supports PDF, DOCX, Excel, audio, and image inputs
- **Dual PDF engine** — MinerU (recommended) or PyMuPDF fallback
- **LLM response caching** — faster re-runs without redundant API calls

---

## About

This project extends nano-graphrag to support multi-modal inputs. The image processing pipeline uses YOLO and a Multi-modal LLM (MLLM) to convert images into scene graphs. A spectral clustering fusion step then merges the text knowledge graph and image knowledge graph into a unified multi-modal knowledge graph (MMKG).

PolyGraphRAG handles diverse input modalities — PDF, DOCX, Excel, audio, and images — and unifies them into a single queryable knowledge graph.

---

## Environment Setup

### Install Dependencies

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install openai
pip install sentence-transformers
pip install networkx
pip install numpy
pip install scikit-learn
pip install Pillow
pip install tqdm
pip install tiktoken
pip install ultralytics
pip install opencv-python
pip install flask
pip install flask-cors
```

### PDF Parsing

Install at least one of the following:

| Option | Command | Notes |
|--------|---------|-------|
| MinerU (recommended) | `pip install -U "mineru[all]"` | Better layout and image extraction |
| PyMuPDF | `pip install pymupdf` | Lightweight, simpler PDFs |

Set `USE_MINERU = True/False` in `backend/config/settings.py` to switch between them. If MinerU is unavailable, the system falls back to PyMuPDF automatically.

For MinerU setup, download the required model files per the MinerU documentation before use.

---

## Configuration

All parameters are in `backend/config/settings.py`.

### Model Configuration

Three model types are required:

**Text LLM** — entity extraction, relation building:
```python
API_KEY = "your-api-key"
API_BASE = "https://your-api-endpoint/v1"
MODEL_NAME = "qwen3-max"
```

**Multi-Modal LLM** — image understanding, visual entity extraction:
```python
MM_API_KEY = "your-api-key"
MM_API_BASE = "https://your-api-endpoint/v1"
MM_MODEL_NAME = "qwen-vl-max"
```

**Embedding Model** — entity vectorization and semantic retrieval:
```python
EMBEDDING_MODEL_DIR = './models/all-MiniLM-L6-v2'
EMBED_MODEL = SentenceTransformer(EMBEDDING_MODEL_DIR, device="cpu")
```

The embedding model can be auto-downloaded by name or pointed to a local path.

### Directory Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `INPUT_PDF_PATH` | Input file path | — |
| `CACHE_PATH` | LLM response cache | `cache` |
| `WORKING_DIR` | Intermediate files | `working` |
| `OUTPUT_DIR` | Final graph output | `output` |
| `MMKG_NAME` | Output graph name | `mmkg_timestamp` |

### Processing Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `USE_MINERU` | Use MinerU for PDF parsing | `True` |
| `ENTITY_EXTRACT_MAX_GLEANING` | Max entity extraction iterations | `0` |
| `ENTITY_SUMMARY_MAX_TOKENS` | Max tokens for entity summary | `500` |
| `SUMMARY_CONTEXT_MAX_TOKENS` | Max tokens for summary context | `10000` |

### RAG Retrieval Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `QueryParam.top_k` | Entities to retrieve | `5` |
| `QueryParam.response_type` | Response style | `Detailed System-like Response` |
| `QueryParam.local_max_token_for_local_context` | Max local context tokens | `4000` |
| `QueryParam.number_of_mmentities` | Multi-modal entities to include | `3` |
| `QueryParam.local_max_token_for_text_unit` | Max text unit tokens | `4000` |
| `RETRIEVAL_THRESHOLD` | Similarity threshold | `0.2` |

---

## Usage

### Build Knowledge Graph

```bash
python main.py -i path/to/document.pdf
```

```bash
# Specify directories
python main.py -i document.pdf -w ./working -o ./output

# Use PyMuPDF instead of MinerU
python main.py -i document.pdf -m pymupdf

# Force rebuild from scratch
python main.py -i document.pdf -f

# Verbose logging
python main.py -i document.pdf -v
```

### Query

```bash
python main.py -q "Your question"

# With parameters
python main.py -q "Your question" --top_k 10 --response_type "Concise answer"

# Build and query in one step
python main.py -i document.pdf -q "Your question"
```

### Visualization Server

```bash
python main.py -s
# Open http://localhost:8080
```

```bash
# Custom port and graph file
python main.py -s --port 8888 --graph path/to/graph.graphml
```

Features:
- Force-directed layout
- Real-time entity search
- Subgraph highlighting by query
- Click nodes to view entity details
- Color-coded entity types

### CLI Reference

| Argument | Short | Description |
|----------|-------|-------------|
| `--input` | `-i` | Input file path |
| `--working` | `-w` | Working directory |
| `--output` | `-o` | Output directory |
| `--method` | `-m` | PDF engine: `mineru` or `pymupdf` |
| `--force` | `-f` | Force rebuild |
| `--verbose` | `-v` | Verbose logs |
| `--query` | `-q` | RAG query |
| `--top_k` | — | Entities to retrieve |
| `--response_type` | — | Response style |
| `--server` | `-s` | Start visualization server |
| `--port` | — | Server port (default: 8080) |
| `--graph` | — | Graph file path |

---

## Project Structure

```
PolyGraphRAG/
├── backend/                        # Active codebase
│   ├── api/
│   │   ├── main.py                 # FastAPI app entry point
│   │   └── routes/
│   │       ├── upload.py
│   │       ├── query.py
│   │       ├── graph.py
│   │       └── report.py
│   ├── compliance/
│   │   ├── citation_engine.py
│   │   └── evidence_engine.py
│   ├── config/
│   │   └── settings.py             # All configuration parameters
│   ├── core/
│   │   └── prompt.py               # LLM prompt templates
│   ├── graph/
│   │   ├── text2graph.py           # Text entity/relation extraction
│   │   ├── img2graph.py            # Image scene graph extraction
│   │   ├── fusion.py               # Multi-modal graph fusion
│   │   └── utils.py
│   ├── ingestion/
│   │   ├── pdf_preprocessing.py
│   │   ├── audio_preprocessing.py
│   │   ├── docx_preprocessing.py
│   │   ├── excel_preprocessing.py
│   │   ├── image_preprocessing.py
│   │   └── image_utils.py
│   ├── llm/
│   │   └── client.py               # LLM / embedding API client
│   ├── retrieval/
│   │   └── query.py                # RAG retrieval logic
│   ├── services/
│   │   ├── document_service.py
│   │   ├── multidocument_service.py
│   │   └── query_service.py
│   ├── storage/
│   │   ├── graph_storage.py
│   │   └── kv_storage.py
│   ├── utils/
│   │   └── base.py
│   ├── visualization/
│   │   ├── server.py               # Flask visualization server
│   │   └── graph_explorer.html     # Interactive graph UI
│   └── builder.py                  # Pipeline orchestrator
│
├── examples/
│   ├── example_input/
│   │   ├── 2020.acl-main.45.pdf    # Sample academic paper
│   │   └── 13_qa.jsonl             # 13 Q&A pairs with ground truth
│   ├── example_working/            # Intermediate results (auto-generated)
│   ├── example_output/
│   │   ├── example_mmkg.graphml    # Final multi-modal knowledge graph
│   │   ├── example_mmkg_emb.npy    # Node embeddings
│   │   └── retrieval_log.md        # RAG query logs
│   ├── paper/
│   │   ├── framework.png
│   │   └── mmgraphrag.pdf
│   └── docqa_example.py            # End-to-end Q&A evaluation script
│
├── models/                         # Local embedding model weights
├── frontend/                       # Frontend (placeholder)
├── scripts/
│   └── _verify_imports.py
├── src/                            # Legacy research code (superseded by backend/)
├── main.py                         # CLI entry point
├── requirements.txt
└── README.md
```

---

## Running the Example

```bash
python examples/docqa_example.py
```

This script:
1. Reads `examples/example_input/2020.acl-main.45.pdf` and builds a knowledge graph
2. Loads 13 questions from `13_qa.jsonl` (text and multi-modal chart questions)
3. Runs RAG retrieval and generates answers
4. Outputs a results report comparing answers against ground truth
