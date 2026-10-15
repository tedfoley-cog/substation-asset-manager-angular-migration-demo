FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server ./server
COPY src ./src
EXPOSE 3000
ENV BACKEND_URL=http://backend:8080
CMD ["node", "server/dev-server.js"]
