# Nutricart
Capstone Project

## Branch Structure

This repository uses a two-feature-branch system to separate the frontend and backend development:

- `feat/init-frontend`: Contains the frontend codebase (React + Tailwind CSS)
- `feat/init-backend`: Contains the backend codebase (FastAPI)

### Workflow

- Each branch is independent and can be:
  - Built
  - Tested
  - Reviewed

- Once both branches are ready, they will be merged into the main branch for production.

### Start both backend and frontend services using Docker
docker-compose up

### Stop services using Docker
docker-compose down