# Stage 1: Build the application (Heavy)
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production Environment (Slim)
FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install production dependencies only (omit dev dependencies)
RUN npm install --omit=dev

# Copy only the compiled JavaScript code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

# Run the compiled JavaScript code directly with Node.js
CMD ["node", "dist/index.js"]