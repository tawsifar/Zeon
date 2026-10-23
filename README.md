# ZEON — Experimental Media Toolkit & Privacy Engine

> ### 🚧 ACTIVE DEVELOPMENT STATUS
> **PLEASE NOTE:** This project is **currently under active development and is not ready for full or production use**. It may contain minor bugs, intermittent stream handling quirks, or unfinished edge cases as features continue to be refined and tested.

> ### ⚠️ STRICT LEGAL NOTICE & RESEARCH DISCLAIMER
> **PLEASE READ BEFORE CLONING OR RUNNING THIS CODE:**
>
> 1. **NON-COMMERCIAL PROTOTYPE (WORK IN PROGRESS):** This repository and software application is strictly an **experimental, educational prototype created solely for personal testing, academic research, and private developer evaluation**. It is not intended for general public reliance.
> 2. **NO PUBLIC MARKETING OR COMMERCIAL OPERATION:** This project is **not** a commercial product, is not being marketed, does not run advertisements, does not solicit donations or subscriptions, and is not operated as a public commercial service.
> 3. **NO SEARCH ENGINE INDEXING:** This website is deliberately configured to **block all search engine crawlers and web robots** (`Disallow: /`, `noindex, nofollow`, no cache). It is intentionally kept unindexed from Google, Bing, Yahoo, DuckDuckGo, and other web indexers.
> 4. **NO HOSTING OR DISTRIBUTION OF COPYRIGHTED CONTENT:** Zeon **does not host, cache, index, or distribute any media files or copyright-protected content** on its servers. All transient operations are piped on-the-fly directly to the end-user's local system for authorized personal backup purposes under fair-use principles. Users are solely responsible for ensuring they possess lawful access to content they interact with.
> 5. **TRADEMARK ATTRIBUTION:** All product names, logos, platform marks, and registered trademarks displayed in this prototype (including YouTube, TikTok, Instagram, Facebook, X, Spotify, Twitch, Vimeo, Reddit, and Pinterest) remain the property of their respective trademark holders. Their inclusion in this personal UI prototype is strictly nominative and does not imply endorsement, affiliation, or sponsorship.

---

## 🚀 Overview

Zeon combines three media utilities into a unified, high-performance interface:

1. **Universal Stream Pipe (Backend):** Fast single-command media retrieval across 15+ supported web platforms in highest quality MP4 video or MP3 audio via native Linux `yt-dlp` and `ffmpeg` pipelines.
2. **Precision Range Trimming:** Keyframe-accurate time slicing down to the second, downloading only the exact clipped duration without redundant file transfers.
3. **Client-Side AI Metadata Stripper (100% In-Browser):** Zero-telemetry binary parser that strips C2PA JUMBF provenance manifests, XMP metadata packets, Midjourney prompts, and EXIF tracking identifiers entirely inside client browser memory using WebAssembly and pure TypeScript with zero server upload.

---

## 🛠️ Architecture & Tech Stack

* **Framework:** Next.js (App Router) + React 19
* **Typography:** Plus Jakarta Sans & JetBrains Mono (via `next/font`)
* **Styling:** Tailwind CSS v4 + Glassmorphism UI
* **Physics & Motion:** Motion (Framer Motion)
* **Media Engines:** Native Linux `yt-dlp` + `ffmpeg`
* **Client Cleaning:** Binary array parsing for JPEG, PNG, WebP, AVIF, HEIC

---

## 📦 Local Development

### Prerequisites
* [Node.js 20+](https://nodejs.org/)
* `yt-dlp` and `ffmpeg` installed on your system PATH (or located in `./bin/`)

### Quickstart
```bash
# Clone the repository
git clone https://github.com/tawsifar/Zeon.git
cd Zeon

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker / Render Deployment (Free Container)

This repository includes a pre-configured production [`Dockerfile`](./Dockerfile) and [`.dockerignore`](./.dockerignore) designed for one-click hosting on platforms like [Render](https://render.com) or [Hugging Face Spaces](https://huggingface.co):

```bash
# Build the production Docker image
docker build -t zeon:latest .

# Run container locally on port 3000
docker run -p 3000:3000 zeon:latest
```

---

## 🛡️ License

This experimental prototype code is released under the **MIT License** for personal developer education and private experimentation. See the disclaimer above for usage boundaries.
