FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn flask-cors

COPY . .

EXPOSE 7860

CMD ["sh", "-c", "exec gunicorn -w 1 --threads 8 -k gthread -t 120 -b 0.0.0.0:$PORT app:app"]
