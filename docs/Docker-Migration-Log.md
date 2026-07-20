# 🚀 Low-Risk Docker Migration & CI/CD Refactoring Log

This document serves as the complete technical log for migrating the `tbsosick` (SMRT SCRUB Enterprise API) project from a traditional PM2 deployment to a fully Dockerized setup on AWS EC2, implementing industry-standard practices with minimal downtime during the initial cutover.

---

## 📑 Table of Contents
1. [Migration Strategy & Objectives](#1-migration-strategy--objectives)
2. [Phase 1: Local Environment Preparation & Testing](#2-phase-1-local-environment-preparation--testing)
3. [Phase 2: EC2 Server Architecture Discovery](#3-phase-2-ec2-server-architecture-discovery)
4. [Phase 3: Production Docker Deployment](#4-phase-3-production-docker-deployment)
5. [Phase 4: Finalizing & Sunsetting Legacy Systems (Pending)](#5-phase-4-finalizing--sunsetting-legacy-systems-pending)

---

## 1. Migration Strategy & Objectives
* **Goal:** Transition the backend API from PM2 to Docker on AWS EC2.
* **Why Docker?** To eliminate "it works on my machine" issues, isolate dependencies, and establish an industry-standard deployment pipeline that doesn't rely on global server packages.
* **The "Zero-Risk" Strategy:** Instead of bringing down the live PM2 server, we decided to run Docker on an alternate port (`5003`) side-by-side with the live PM2 server (`5000`). Once Docker is verified to work perfectly, we simply swap the Nginx port and delete PM2. 

---

## 2. Phase 1: Local Environment Preparation & Testing

Before touching the live server, we ensured the Docker image builds and runs perfectly on the local machine.

### 🔴 Issue 1: Canvas Package Build Failure
- **What happened:** When running `docker build -t lms-backend .` locally, the build crashed at the `npm ci` step.
- **Cause:** The `Dockerfile` was using `node:20-alpine`. Alpine Linux is ultra-lightweight and lacks `glibc` and build tools (C++/Python). The `canvas` dependency requires these tools to compile native addons.
- **The Fix:** We modified the `Dockerfile` to use `node:20-slim`. Slim is based on Debian (which has `glibc`) but is still highly optimized.
  ```dockerfile
  # Changed from:
  FROM node:20-alpine AS builder
  # Changed to:
  FROM node:20-slim AS builder
  ```

### 🔴 Issue 2: Production Dependency Missing (`Cannot find module 'ora'`)
- **What happened:** The image built successfully, but when we ran `docker run -p 5001:5000 --env-file .env tbsosick`, the container crashed with:
  > `Error: Cannot find module 'ora'`
- **Cause:** In the Dockerfile, we used industry-standard `RUN npm ci --only=production` to keep the image small. However, `ora` was listed under `devDependencies` in `package.json`, so it was skipped. The API (`server.ts`) relies on `ora` for terminal spinners at runtime.
- **The Fix:** We manually moved `"ora": "^5.4.1"` from `devDependencies` to `dependencies` in `package.json` and rebuilt the image.

### ✅ Local Test Success
- **Command Used:** `docker run -p 5002:5002 --env-file .env tbsosick`
- **Result:** The API started perfectly, connected to the local MongoDB, and displayed the "S M R T S C R U B" ASCII art in the terminal.

---

## 3. Phase 2: EC2 Server Architecture Discovery

Before executing commands on the live AWS EC2 instance, we ran diagnostic commands to map out the current architecture.

1. **Check Nginx Configuration:**
   - **Command:** `cat /etc/nginx/sites-available/smrtscrub.app.conf`
   - **Finding:** Nginx is proxying `api.smrtscrub.app` to `http://127.0.0.1:5000`.

2. **Check Running PM2 Processes:**
   - **Command:** `sudo pm2 list` and `sudo pm2 info backend2`
   - **Finding:** The live API is running as `backend2` under the `root` user, using the folder `/var/www/backend2`.

3. **Check Docker Status:**
   - **Command:** `docker --version`
   - **Finding:** Docker was **not installed** on the server.

4. **Verify GitHub Actions Path:**
   - **Finding:** The existing `.github/workflows/deploy-aws.yml` file was incorrectly pointing to `/var/www/lms-mackteplace`, which did not exist on the server. This means the legacy CI/CD pipeline was broken.

---

## 4. Phase 3: Production Docker Deployment

With the architecture fully mapped, we proceeded to deploy Docker on the live EC2 server securely.

### Step 3.1: Install Docker on EC2
To support the new infrastructure, Docker was installed manually.
- **Commands Used:**
  ```bash
  sudo apt update
  sudo apt install docker.io -y
  sudo systemctl start docker
  sudo systemctl enable docker
  ```
- **Why:** `systemctl enable` ensures Docker automatically starts if the AWS EC2 instance is rebooted.

### Step 3.2: Pull Latest Code
- **Commands Used:**
  ```bash
  cd /var/www/backend
  sudo git pull origin main
  ```
- **Why:** We navigated to the correct production directory and pulled our fixed `Dockerfile` and `package.json`.

### Step 3.3: Build the Docker Image on Server
- **Command Used:** `sudo docker build -t tbsosick .`
- **Why:** This compiles the TypeScript code and installs production dependencies inside an isolated Docker image directly on the server.

### 🔴 Issue 3: MongoDB Connection Refused from Docker
- **What happened:** When running the container, it crashed with:
  > `❌ MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017`
- **Cause:** The `.env` file uses `127.0.0.1`. Inside a Docker container, `127.0.0.1` means "inside the container itself", not the host EC2 server where MongoDB is actually running.
- **The Fix (Zero-Risk Approach):** Instead of altering the `.env` file (which could break the currently running PM2 app), we utilized Docker's host networking mode and overrode the port.
  
### Step 3.4: Final Live Run Command
- **Command Used:**
  ```bash
  sudo docker run -d --name tbsosick_api --network host --env-file .env --restart unless-stopped -e PORT=5003 tbsosick
  ```
- **Detailed Breakdown of Flags:**
  - `-d`: Runs in the background (Detached mode) so the server terminal can be closed.
  - `--name tbsosick_api`: Assigns a readable name to the container instead of a random ID.
  - `--network host`: **(CRITICAL)** Tells Docker to bypass its isolated network and bind directly to the EC2 host's network. This allows `127.0.0.1:27017` to correctly route to the host's MongoDB.
  - `--env-file .env`: Injects all secrets from the existing environment file.
  - `--restart unless-stopped`: Ensures the API automatically restarts if the app crashes or the EC2 server reboots.
  - `-e PORT=5003`: Overrides the `PORT=5000` set in the `.env` file to prevent an `EADDRINUSE` crash, since PM2 is still occupying port `5000`.

- **Result:** **100% Success.** The Docker container started perfectly on port `5003`, successfully connected to MongoDB, and is now waiting for live traffic.

---

## 5. Phase 4: Finalizing & Sunsetting Legacy Systems (Completed ✅)

These final steps were executed to transition 100% of live traffic to Docker and automate future deployments.

### ✅ Task 1: Route Traffic to Docker via Nginx
- Opened Nginx config: `sudo nano /etc/nginx/sites-available/smrtscrub.app.conf`
- Changed the API proxy block to point to Docker:
  ```nginx
  proxy_pass http://127.0.0.1:5003;
  ```
- Verified syntax: `sudo nginx -t` (Result: `syntax is ok`, `test is successful`)
- Reloaded Nginx: `sudo systemctl reload nginx`
- *Live traffic is now successfully routed to the Docker container.*

### ✅ Task 2: Sunset the Legacy PM2 App
Once Docker was verified as receiving live traffic, we permanently removed the old PM2 app.
- **Commands Executed:**
  ```bash
  sudo pm2 stop backend2
  sudo pm2 delete backend2
  sudo pm2 save
  ```
- **Result:** The `backend2` process was successfully stopped and removed from the server, freeing up port 5000 and saving server resources.

### ✅ Task 3: Refactor GitHub Actions CI/CD Pipeline
Modified `.github/workflows/deploy-aws.yml` to replace the old `npm run build` and `pm2 reload` commands with an automated Docker deployment script. 
- **Result:** Future code pushes to the `main` branch will automatically pull the latest code, build a new Docker image (`tbsosick`), stop the old container, run the new one on `--network host`, and prune unused images—providing automated single-server deployments with a short container recreation window.

---

## 6. Phase 5: Security & Stability Optimization (Completed ✅)

To meet industry standards and the `docker-expert` guidelines, we implemented the following critical best practices in the `Dockerfile`:
1. **Non-root User Execution:** Added `USER node` and `--chown=node:node` during the build process to prevent the container from running as `root`, significantly reducing security vulnerabilities.
2. **Docker Healthcheck:** Installed `curl` and implemented a `HEALTHCHECK` directive. This ensures application failure is observable, while the restart policy restarts the container if the main Node.js process exits.
3. **Optimized CMD Execution:** Replaced `CMD ["npm", "start"]` with `CMD ["node", "dist/server.js"]` to allow the Node.js process to receive OS signals (like `SIGTERM`) directly, enabling graceful shutdowns.

These optimizations guarantee a robust, restart-capable, and health-observable architecture with production-grade security.

---

## 7. Phase 6: Enterprise CI/CD Hardening & Secrets Management (Completed ✅)

To further elevate the deployment pipeline to a true DevOps standard, we implemented the following enhancements:

1. **Docker Compose Integration:** Transitioned from raw `docker run` commands to a `docker-compose.yml` file. This centralizes container configuration (network, restart policies, environment variables) and is the industry gold standard for single-node deployments.
2. **Dynamic `.env` Generation (Single Secret Architecture):** Instead of manually storing secrets on the EC2 server or mapping dozens of individual variables, we configured GitHub Actions to inject the entire 64-line environment configuration using a single `PRODUCTION_ENV` secret. This is safely written to the server via `printenv` to avoid bash variable expansion corruption. 
3. **Atomic File Writes:** The `.env` generation uses a secure temporary file (`mktemp`) and an atomic move (`mv`) to prevent partial secret writes and protect against deployment interruptions.
4. **Resilient Health Checks:** Replaced static `sleep` timeouts with a robust `curl --retry 6` command. This ensures the pipeline waits intelligently for the Node.js process to fully bind to the port before marking the deployment as successful.
5. **Post-Deployment Pruning:** Moved the `docker image prune` step to *after* the health check passes. This delays image pruning until health verification, reducing immediate image-loss risk (note: versioned rollback is not yet implemented).

## 8. Phase 7: Enterprise DevOps Optimization (Completed ✅)

Based on a senior-level DevOps review, we implemented the final layer of polish to our architecture:

1. **Dedicated Health Endpoint:** Added a lightweight `GET /health` route in `app.ts`. The Docker `HEALTHCHECK` and GitHub Actions now point to this dedicated route rather than the root `/`, preventing false failures if the root route is ever redirected or auth-protected.
2. **Container Orchestration Hardening:** Updated `docker-compose.yml` by removing the legacy `version` tag, adding `init: true` (to prevent Node.js zombie processes), defining `stop_grace_period: 30s` (for clean shutdowns), and implementing JSON log rotation (max 10MB per file) to prevent disk exhaustion.
3. **Strict `.env` Validation:** Added a validation step in the GitHub Actions pipeline that uses `grep` to ensure critical keys (like `DATABASE_URL` and `JWT_SECRET`) actually exist inside the generated `PRODUCTION_ENV` before attempting deployment. This prevented a live crash when the `MONGO_URI` was incorrectly provided.
4. **Precise Directory Permissions:** Updated the `Dockerfile` to explicitly create and grant the non-root `node` user write access to `/app/winston` and `/app/uploads`, while keeping the rest of the application source code securely read-only.

---

**🎉 CORE MIGRATION COMPLETE! 🎉**

---

## 🗺️ Appendix A: EC2 Server Folder Structure Map

To help future maintainers understand the exact layout of the production AWS EC2 instance, here is the complete folder structure map:

### 1. Application Source Code (Backend & Frontend)
**Backend Location:** `/var/www/backend/`
The main API project directory where GitHub Actions pushes code.
* **`.env`**: The production secrets file generated automatically by GitHub Actions.
* **`docker-compose.yml`**: Docker orchestration configuration.
* **`Dockerfile`**: The blueprint for the Node.js production image.
* **`winston/`**: Application logs generated by the Docker container.
* **`uploads/`**: User-uploaded files and assets.

**Frontend Location:** `/var/www/frontend/`
The directory containing the compiled frontend application (likely React/Next.js/Vue) served to users.

### 2. Nginx (Reverse Proxy)
**Location:** `/etc/nginx/`
Handles all incoming internet traffic and routes it to the Docker container.
* **`/etc/nginx/sites-available/`**: Contains the actual server blocks (domain configuration).
* **`/etc/nginx/sites-enabled/`**: Symlinks to active sites that are currently serving traffic.

### 3. MongoDB (Database)
**Location:** `/var/lib/mongodb/`
Where the raw, encrypted physical database files are stored on the EC2 instance. (Accessed via `mongosh`).

### 4. System Logs
**Location:** `/var/log/`
Critical for debugging server-level crashes.
* **`/var/log/nginx/`**: Contains `access.log` (API hits) and `error.log` (Nginx crashes).
* **`/var/log/mongodb/`**: MongoDB startup and error logs.

**At a Glance:**
```text
/ (Root)
├── var/
│   ├── www/
│   │   ├── backend/         (Node.js Backend Code & Docker Config)
│   │   ├── frontend/        (Compiled Frontend Application)
│   │   └── html/            (Default Nginx directory)
│   ├── lib/
│   │   └── mongodb/         (Physical Database Files)
│   └── log/
│       ├── nginx/           (Nginx Access/Error Logs)
│       └── mongodb/         (Database Logs)
└── etc/
    └── nginx/               (Nginx Configurations)
```
