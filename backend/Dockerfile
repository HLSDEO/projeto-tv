FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

# Create entrypoint script
RUN echo '#!/bin/bash\n\
echo "🚀 Initializing TV DLOG Backend..."\n\
python init_db.py\n\
echo "✅ Database initialization complete, starting server..."\n\
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
