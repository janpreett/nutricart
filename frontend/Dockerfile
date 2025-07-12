# frontend/Dockerfile
FROM node:18-alpine

# Allow passing in the API URL at build time (and also at run time)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Set working directory
WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your source
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Simple healthcheck so compose can tell when it's up
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

# Run the Vite dev server, binding to all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
