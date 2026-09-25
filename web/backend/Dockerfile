# Development backend image — hot-reload via uvicorn --reload
FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg2 and other compiled packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy source (overridden by volume mount in dev)
COPY . .

# Create ML models directory
RUN mkdir -p models

EXPOSE 8000

# Default command — docker-compose.yml overrides this
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
