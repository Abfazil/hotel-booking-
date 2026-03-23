# Use a lightweight Node.js image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Express listens on this port (override with PORT env var if needed)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]

