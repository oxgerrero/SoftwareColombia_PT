FROM python:3.11-slim

WORKDIR /app

# Install deps first (docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Use shell form to avoid Windows line-ending issues with entrypoint scripts
CMD ["sh", "-c", "python scripts/seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
