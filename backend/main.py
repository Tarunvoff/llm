"""
FastAPI Server Entrypoint
Hosts STEM Chat API and serves static frontend application.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.model import ModelEngine
from backend.benchmark import get_all_benchmark_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model once at startup if weights exist locally
    print("[INFO] Starting server and initializing model engine...")
    engine = ModelEngine.get_instance()
    engine.load_model()
    yield
    print("[INFO] Shutting down server...")


app = FastAPI(
    title="STEM LLM Inference Server",
    description="FastAPI Backend for STEM reasoning, benchmarking, and interactive chat interface.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Text content of the message")


class ChatRequest(BaseModel):
    message: Optional[str] = Field(None, description="Current user message (for single-turn / quick query)")
    messages: Optional[List[ChatMessage]] = Field(None, description="Full conversation history for multi-turn chat")
    max_tokens: Optional[int] = Field(None, description="Maximum new tokens to generate")
    temperature: Optional[float] = Field(None, description="Sampling temperature")


class ChatResponse(BaseModel):
    response: str
    generation_time: float
    input_tokens: int
    output_tokens: int
    tokens_per_sec: float
    error: Optional[str] = None


@app.get("/health")
def health_check():
    engine = ModelEngine.get_instance()
    return {
        "status": "ok",
        "model_loaded": engine.is_loaded,
        "device": engine.device,
        "model_path": engine.model_path or "model/aryabhata-2.0"
    }


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    engine = ModelEngine.get_instance()

    conversation = []
    if request.messages:
        conversation = [{"role": m.role, "content": m.content} for m in request.messages]
    elif request.message:
        conversation = [{"role": "user", "content": request.message}]
    else:
        raise HTTPException(status_code=400, detail="Either 'message' or 'messages' must be provided.")

    result = engine.generate(
        messages=conversation,
        max_new_tokens=request.max_tokens,
        temperature=request.temperature
    )

    return ChatResponse(
        response=result["response"],
        generation_time=result["generation_time"],
        input_tokens=result["input_tokens"],
        output_tokens=result["output_tokens"],
        tokens_per_sec=result["tokens_per_sec"],
        error=result.get("error")
    )


@app.get("/benchmarks")
def benchmarks_endpoint():
    return get_all_benchmark_data()


# Serve Frontend
frontend_dir = Path("frontend").resolve()
dist_dir = frontend_dir / "dist"
if dist_dir.exists() and (dist_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/")
    def serve_root():
        if dist_dir.exists() and (dist_dir / "index.html").exists():
            return FileResponse(str(dist_dir / "index.html"))
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Frontend index.html not found."}
