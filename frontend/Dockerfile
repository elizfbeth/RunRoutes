FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]

