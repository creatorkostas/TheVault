FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["bun", "run", "start"]
