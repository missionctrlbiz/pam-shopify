FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build
RUN npm prune --omit=dev

EXPOSE 8080
CMD ["node", "dist/index.js"]
