FROM oven/bun:1.2-alpine

WORKDIR /app

COPY package.json ./
COPY src/ ./src/

EXPOSE 3004

CMD ["bun", "run", "src/server.ts"]
