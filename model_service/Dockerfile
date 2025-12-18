FROM python:3.10-slim

# Avoid Python buffering and create non-root user later if needed
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (minimal). Uncomment if you face wheels issues
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     && rm -rf /var/lib/apt/lists/*

# Install python dependencies first for better layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (including model .h5 files)
COPY . .

EXPOSE 5000

# Default: run the Flask app directly
CMD ["python", "app.py"]
