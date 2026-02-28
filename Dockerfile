FROM node:22-slim AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Build the application
FROM deps AS build
COPY . .
RUN npm run build

# Production image
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3000

# Copy built output and necessary files
COPY --from=build /app/.output .output
COPY --from=build /app/data data
COPY --from=build /app/workflows workflows

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
