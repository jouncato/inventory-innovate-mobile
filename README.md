# Innovate Nutrition • Plataforma Inteligente de Inventario Visual IA

Sistema móvil y web de inventario visual asistido por inteligencia artificial para la línea **Solgar Colombia / Innovate Nutrition**. Permite detectar productos en estantería, contar unidades físicas, identificar referencias mediante lectura bimodal de códigos de barras (UPC/EAN-13) y OCR/búsqueda vectorial (`pgvector`), deduplicar tomas consecutivas mediante homografía y registrar una cadena de trazabilidad forense inmutable en **PostgreSQL 18** y **MinIO S3**.

![Innovate Nutrition Logo](LOGO-Innovate-RGB-Blue-1.png)

---

## 🏛️ Arquitectura del Sistema (DDD & Clean Architecture)

El proyecto está organizado en 4 módulos físicos completamente desacoplados:

```
inventory-innovate-mobile/
├── infra/                 # Infraestructura Local 100% contenida (Docker Compose)
│   ├── docker-compose.yml # PostgreSQL 18 (pgvector), MinIO S3, Redis 7, Ollama
│   ├── postgres/          # DDL init.sql con particionamiento e índice HNSW
│   └── minio/             # Buckets 'raw-captures' y 'crops' con URLs prefirmadas
├── backend/               # Core de Dominio y Pipeline de IA (FastAPI, Celery, OpenCV)
│   ├── src/contexts/      # Bounded Contexts: inventory, perception, catalog, audit
│   └── tests/             # 32 pruebas unitarias y de integración E2E automatizadas
├── mobile/                # Aplicación Móvil en Flutter (Android / iOS)
│   ├── lib/core/          # Tokens corporativos Innovate Nutrition y analizador de calidad
│   └── lib/features/      # Captura asistida, retícula guía, Drift SQLite, HITL review
└── frontend/              # Consola Web Administrativa (React 19, TypeScript, Vite)
    ├── src/components/    # Dashboard en tiempo real, Conciliación HITL, Auditoría Forense
    └── dist/              # Bundle compilado para producción
```

---

## 🚀 Componentes Principales

### 1. Pipeline de Visión y Resolución Bimodal (`backend/`)
- **Detección de Frascos:** YOLOv8x especializado en frascos cilíndricos de vidrio ámbar y tapas doradas estriadas.
- **Lectura de Códigos de Barras:** Pyzbar con preprocesamiento CLAHE (detección en 360° de UPC-A y EAN-13).
- **Extracción de Etiquetas Frontales:** PaddleOCR v4 para segmentación de concentración (ej. *1000 mg*), conteo de dosis (*90 comprimidos*) y principios activos.
- **Búsqueda Vectorial Semántica:** Embeddings de 768 dimensiones vía `embeddinggemma:latest` y vecinos más cercanos (HNSW con métrica coseno `<=>` en PostgreSQL 18).
- **Árbitro Multimodal (VLM):** Invocación condicional de `qwen3-vl:2b` / `gemma4:12b` para desambiguar tomas con reflejos o etiquetas rotadas.
- **Deduplicación Espacial Inter-Tomas:** `HomographyTracker` estimando la matriz de homografía $H$ con ORB + RANSAC y emparejamiento húngaro de mínima pérdida para evitar el doble conteo en barridos continuos de estantería.

### 2. Aplicación Móvil en Flutter (`mobile/`)
- **Diseño Corporativo:** Paleta Innovate Nutrition (Azul Primario `#33499C`, Dark Navy `#1B2559`, Solgar Gold `#86754D`).
- **Control de Calidad Pre-Disparo:** Analizador en el dispositivo de varianza Laplaciana (desenfoque) y luminancia (sub/sobreexposición).
- **Operación Offline-First:** Base de datos local SQLite (Drift) con sincronización idempotente vía cabecera `X-Idempotency-Key`.
- **Resolución Rápida de Excepciones:** Interfaz táctil *Human-in-the-Loop* (HITL) para validar sugerencias o reasignar referencias.

### 3. Consola Web Administrativa y Auditoría (`frontend/`)
- **Monitoreo en Tiempo Real:** Dashboard con recepción de eventos WebSocket (`/ws/sessions/{id}`), telemetría de operadores y vista esquemática de repisa con *bounding boxes* coloreadas.
- **Conciliación de Discrepancias:** Pantalla dividida interactiva que compara el recorte de la botella en MinIO contra la ficha maestra del catálogo Solgar.
- **Visor Forense Inmutable:** Linaje auditable con cálculo de hash SHA-256 de cada imagen cruda, registro del modelo interviniente (nombre, versión, latencia, score) y firma del supervisor.

---

## 🧪 Pruebas y Validación

La plataforma cuenta con una suite completa de pruebas automatizadas:
```bash
# Ejecución de pruebas unitarias y E2E de catálogo Solgar (50 SKUs)
pytest backend/tests/ -v
# ==================== 32 passed in 3.12s ====================

# Compilación de la consola web
cd frontend && npm run build
# ✓ built in 3.28s

# Análisis estático de Flutter
cd mobile && flutter analyze --no-fatal-infos
# 0 errors found
```

---

## 📦 Puesta en Marcha Local

```bash
# 1. Levantar infraestructura completa
cd infra
docker compose up -d

# 2. Iniciar Backend FastAPI
cd ../backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Iniciar Consola Web
cd ../frontend
npm run dev

# 4. Iniciar Aplicación Móvil
cd ../mobile
flutter run
```

---

Desarrollado para **Innovate Nutrition & Solgar Colombia**.
