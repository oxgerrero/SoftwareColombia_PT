#!/bin/bash
set -e

echo "==> Running database seed..."
python scripts/seed.py

echo "==> Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
