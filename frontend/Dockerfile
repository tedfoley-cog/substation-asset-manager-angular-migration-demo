# Stage 1 — build the Angular bundle into src/ng/ (DES-SETCMP-006).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2 — runtime: static dev server + /api proxy only (no devDependencies).
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server ./server
COPY --from=build /app/src ./src
EXPOSE 3000
ENV BACKEND_URL=http://backend:8080
CMD ["node", "server/dev-server.js"]
