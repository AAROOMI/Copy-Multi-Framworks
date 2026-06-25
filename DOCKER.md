# Docker Deployment Guide for Sovereign GRC Platform

This guide provides complete instructions to build, package, and deploy the Sovereign GRC & Enterprise AI Orchestration Platform using Docker.

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) (optional, for orchestrating services).

## Building the Docker Image

To build the Docker image locally, run the following command in the project root directory:

```bash
docker build -t sovereign-grc-platform:latest .
```

This performs a multi-stage production build:
1. **Build Stage**: Installs all npm dependencies, processes TypeScript/Vite compilations, and bundles production static assets inside `/dist`.
2. **Serve Stage**: Packages the lightweight `nginx:alpine` image and configures it to host the static application securely.

## Running the Container

Once built, you can run the application container using:

```bash
docker run -d -p 3000:3000 --name grc-platform sovereign-grc-platform:latest
```

The application is now accessible via your browser at `http://localhost:3000`.

## Docker Compose Configuration (Recommended)

To configure the container with continuous state, local fallbacks, or port configurations, you can use `docker-compose.yml`:

```yaml
version: '3.8'

services:
  grc-platform:
    image: sovereign-grc-platform:latest
    build: .
    ports:
      - "3000:3000"
    restart: always
    environment:
      - NODE_ENV=production
```

Run using:
```bash
docker compose up -d
```

## Production Security Notes
- The internal server is configured to serve assets exclusively on **Port 3000** over `http` internally.
- It is recommended to terminate TLS/SSL at a reverse proxy (e.g., Nginx, Cloudflare, AWS ALB) in front of the container in live corporate environments.
