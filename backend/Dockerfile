FROM python:3.9-slim
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Copy the entrypoint script, convert line endings and make it executable
COPY entrypoint.sh /app/
RUN sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh
EXPOSE 5000
CMD ["/bin/sh", "/app/entrypoint.sh"]
