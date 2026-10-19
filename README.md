# Task 03 — Multi-Stage Docker Containerization & Optimization

A small Node.js + Express application backed by PostgreSQL. It demonstrates:
- A multi-stage Docker build.
- Production-only Node.js dependencies.
- Non-root application execution (`node` user).
- Docker Compose orchestration.
- Application and database health checks.
- PostgreSQL named-volume persistence.
- Basic container hardening (read-only root filesystem, dropped Linux capabilities, `no-new-privileges`).

## Project structure

```text
.
├── src/server.js
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── .dockerignore
├── .env.example
└── README.md
```

## Prerequisites

Install Docker Desktop (Windows/macOS) or Docker Engine + the Docker Compose plugin (Linux). Start Docker before running the commands.

## 1. Configure

Copy `.env.example` to `.env` and change `POSTGRES_PASSWORD` to a strong local password. Keep `.env` private; do not commit it.

Linux/macOS:
```bash
cp .env.example .env
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

## 2. Build and start

```bash
docker compose up --build -d
docker compose ps
```

The `app` service waits for PostgreSQL's health check before starting. The app is available at `http://localhost:3000`.

## 3. Test endpoints

```bash
curl http://localhost:3000/health
curl http://localhost:3000/
curl http://localhost:3000/api/visits
curl http://localhost:3000/api/visits
```

Expected:
- `/health` returns `{"status":"healthy"}`.
- `/` returns application status and a database timestamp.
- `/api/visits` adds a row to PostgreSQL and returns the total count. Calling it repeatedly should increase `totalVisits`.

On Windows PowerShell, you can open the URLs in a browser instead of using `curl`.

## 4. Verify non-root execution

```bash
docker compose exec app id
docker compose exec app sh -c 'id -u'
```

The user should be `node`, and the numeric UID should not be `0`.

## 5. Verify health checks

```bash
docker inspect --format='{{json .State.Health}}' task03-app
docker inspect --format='{{json .State.Health}}' task03-db
```

Wait a short time if health status initially says `starting`.

## 6. Verify persistence after restart

First record a visit:
```bash
curl http://localhost:3000/api/visits
```

Restart the services:
```bash
docker compose restart
```

After the app is healthy again, call:
```bash
curl http://localhost:3000/api/visits
```

The total should continue increasing instead of resetting. The PostgreSQL data lives in the named volume `postgres_data`.

> `docker compose down` keeps the named volume. `docker compose down -v` deletes the volume and all stored visit data. Do not use `-v` for the persistence test.

## 7. Check final image size

```bash
docker image ls task03-node-postgres:local
docker image inspect task03-node-postgres:local --format='{{.Size}}'
```

`docker image inspect` reports bytes. Convert to MiB by dividing by 1,048,576. The assignment target is below 150 MB. Build results depend on the platform and dependency versions; if the image exceeds the target, record the actual size and optimize/rebuild rather than claiming it passed.

## 8. Save build and test logs as evidence

Create a `logs` folder locally (do not commit secrets):
```bash
mkdir -p logs
docker compose build --no-cache 2>&1 | tee logs/build.log
docker compose up -d 2>&1 | tee logs/start.log
docker compose ps 2>&1 | tee logs/compose-ps.log
docker compose logs --no-color 2>&1 | tee logs/container.log
docker image inspect task03-node-postgres:local --format='{{.Size}}' > logs/image-size-bytes.txt
```

If using PowerShell:
```powershell
New-Item -ItemType Directory -Force logs
docker compose build --no-cache 2>&1 | Tee-Object logs/build.log
docker compose up -d 2>&1 | Tee-Object logs/start.log
docker compose ps 2>&1 | Tee-Object logs/compose-ps.log
docker compose logs --no-color 2>&1 | Tee-Object logs/container.log
docker image inspect task03-node-postgres:local --format='{{.Size}}' | Out-File logs/image-size-bytes.txt
```

Review logs before sharing them. Do not include `.env`, passwords, tokens, or other secrets. The `.gitignore` excludes `logs/` by default; if your course explicitly requires logs in the repository, remove that ignore line and inspect the files carefully first.

## 9. Common commands

```bash
docker compose logs -f
docker compose logs app
docker compose logs db
docker compose down
```

If a port is already in use, change the left side of `"3000:3000"` in `docker-compose.yml` to `"3001:3000"` and open `http://localhost:3001`.

If you change environment values after the database has already initialized, PostgreSQL does not automatically recreate the existing database/user. For a clean local reset only, `docker compose down -v` removes the data volume.

## 10. Publish to GitHub

1. Create a **public** GitHub repository named `task03-multistage-docker`.
2. Do not initialize it with a README if you plan to push this existing project (or follow GitHub's instructions if you do).
3. From this project directory run:

```bash
git init
git add .
git status
git commit -m "Complete Task 03 multi-stage Docker project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/task03-multistage-docker.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Check `git status` before committing and ensure `.env` is not listed.

## Submission checklist

- [ ] Public GitHub repository opens without signing in.
- [ ] `Dockerfile` uses multi-stage builds and runs as non-root.
- [ ] `docker-compose.yml` defines app + PostgreSQL, health checks, and persistent volume.
- [ ] `docker compose up --build -d` succeeds.
- [ ] `/health`, `/`, and `/api/visits` work.
- [ ] Visit count persists after restarting containers.
- [ ] Final image size is measured and is below 150 MB (if required).
- [ ] Build logs and test evidence are available and contain no secrets.
- [ ] Submit the public repository URL only, as requested by the portal.
