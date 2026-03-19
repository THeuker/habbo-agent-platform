FROM oven/bun:1.2-alpine

WORKDIR /app

COPY package.json ./
COPY src/ ./src/
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 3004

ENTRYPOINT ["/app/entrypoint.sh"]
