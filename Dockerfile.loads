FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY loads_database.py .
EXPOSE 8001
CMD ["sh", "-c", "uvicorn loads_database:app --host 0.0.0.0 --port ${PORT:-8001}"]
