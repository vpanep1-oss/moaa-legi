FROM node:20-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production
COPY backend ./
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/index.js"]
