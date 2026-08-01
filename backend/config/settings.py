"""
Runtime configuration for the Enterprise Compliance Intelligence Platform.

All tuneable parameters live here.  API keys should be supplied via
environment variables; the placeholder strings below are defaults that
will raise obvious errors rather than silently calling the wrong endpoint.

Directory layout (relative to project root):
  data/input/    — source PDFs
  data/working/  — intermediate build artefacts  (gitignored)
  data/output/   — final knowledge-graph files    (gitignored)
  data/cache/    — LLM response cache             (gitignored)
"""
import os
from sentence_transformers import SentenceTransformer

# ============ LLM Configuration ============
API_KEY   = os.environ.get("LLM_API_KEY",    "Looking for the API key? So am I.")
API_BASE  = os.environ.get("LLM_API_BASE",   "https://dashscope.aliyuncs.com/compatible-mode/v1")
MODEL_NAME = os.environ.get("LLM_MODEL_NAME", "qwen3-max")

MM_API_KEY   = os.environ.get("MM_API_KEY",    "If you find it, please don't tell me. That's safer for both of us.")
MM_API_BASE  = os.environ.get("MM_API_BASE",   "https://dashscope.aliyuncs.com/compatible-mode/v1")
MM_MODEL_NAME = os.environ.get("MM_MODEL_NAME", "qwen-vl-max")

# ============ Embedding Model ============
EMBEDDING_MODEL_DIR = os.environ.get("EMBEDDING_MODEL_DIR", "./models/all-MiniLM-L6-v2")
EMBED_MODEL = SentenceTransformer(EMBEDDING_MODEL_DIR, device="cpu")

# ============ Directory Paths ============
INPUT_PDF_PATH = os.environ.get("INPUT_PDF_PATH", "data/input/2020.acl-main.45.pdf")
CACHE_PATH     = os.environ.get("CACHE_PATH",     "data/cache")
WORKING_DIR    = os.environ.get("WORKING_DIR",    "data/working")
OUTPUT_DIR     = os.environ.get("OUTPUT_DIR",     "data/output")
MMKG_NAME      = os.environ.get("MMKG_NAME",      "example_mmkg")

# ============ Processing Parameters ============
ENTITY_EXTRACT_MAX_GLEANING  = int(os.environ.get("ENTITY_EXTRACT_MAX_GLEANING",  "0"))
ENTITY_SUMMARY_MAX_TOKENS    = int(os.environ.get("ENTITY_SUMMARY_MAX_TOKENS",    "500"))
SUMMARY_CONTEXT_MAX_TOKENS   = int(os.environ.get("SUMMARY_CONTEXT_MAX_TOKENS",   "10000"))
USE_MINERU = os.environ.get("USE_MINERU", "true").lower() in ("1", "true", "yes")

# ============ RAG Retrieval Configuration ============
class QueryParam:
    top_k: int = 5
    response_type: str = "Detailed System-like Response"
    local_max_token_for_local_context: int = 4000
    number_of_mmentities: int = 3
    local_max_token_for_text_unit: int = 4000

RETRIEVAL_THRESHOLD: float = 0.2
