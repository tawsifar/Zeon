FROM node:20-bookworm-slim

# Install system dependencies: Linux ffmpeg, python3, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install latest official yt-dlp binary and verify
RUN curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && /usr/local/bin/yt-dlp --version

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Remove any local Windows executables if present
RUN rm -rf ./bin

# Set production environment variables
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Build Next.js production bundle
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
