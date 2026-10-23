FROM node:20-bullseye-slim

# Install system dependencies: Linux ffmpeg, python3, and latest yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

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
ENV PORT=3000
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Build Next.js production bundle
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
