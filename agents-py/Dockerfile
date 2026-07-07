# ============================================================================
# Ghost Customer AI — Python engine image
# Build:  docker build -t ghost-engine .
# Run:    docker run -p 8000:8000 --env-file .env ghost-engine
# ============================================================================
FROM python:3.12-slim

# Avoid .pyc files and buffered stdout in containers.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the application source.
COPY . .

EXPOSE 8000

# Render/Railway inject $PORT; default to 8000 locally.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
