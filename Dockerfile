# Stage 1: Build frontend
FROM node:14 AS frontend-builder
WORKDIR /app/frontend
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend .

# Stage 2: Build backend
FROM node:14 AS backend-builder
WORKDIR /app/backend
COPY ./backend/package*.json ./
RUN npm install
COPY ./backend .

# Final stage: Run the application
FROM node:14
WORKDIR /app

# Install react-scripts globally
RUN npm install -g react-scripts

# Copy built frontend files
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy backend files
COPY --from=backend-builder /app/backend .

# Expose necessary ports
EXPOSE 3000 8000

# Start both frontend and backend
CMD ["sh", "-c", "cd /app/backend && node index.js & cd /app/frontend && npm start"]