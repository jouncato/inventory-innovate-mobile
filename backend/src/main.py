from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.src.config import settings


# Gestor de conexiones WebSockets para actualizaciones en vivo a Mobile y Web
class WebSocketConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast_to_session(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_json(message)


ws_manager = WebSocketConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de recursos (pools de base de datos, modelos cargados)
    yield
    # Limpieza


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend Hexagonal DDD para inventario asistido por visión artificial (Solgar Colombia).",
    lifespan=lifespan,
)

# CORS para aplicaciones Flutter y frontend web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from backend.src.contexts.inventory.presentation.session_router import router as session_router

app.include_router(session_router)


@app.get("/health", tags=["Infraestructura"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "postgresql_18_pgvector",
        "storage": "minio_s3_compatible",
    }


@app.websocket("/ws/sessions/{session_id}")
async def websocket_session_endpoint(websocket: WebSocket, session_id: str):
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            # Mantener conexión viva y recibir pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
