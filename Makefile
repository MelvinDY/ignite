SHELL := /bin/bash
.DEFAULT_GOAL := help

# Detect backend port from backend/.env if present; default to 5000
BACK_PORT := $(shell awk -F= '/^PORT=/{print $$2}' backend/.env 2>/dev/null | tr -d '[:space:]')
BACK_PORT := $(if $(BACK_PORT),$(BACK_PORT),5000)

.PHONY: help bootstrap dev frontend backend supabase stop doctor env test lint build

help: ## Show available make targets
	@echo "Available targets:"; \
	grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | \
	awk 'BEGIN {FS=":.*?## "}; {printf "  %-16s %s\n", $$1, $$2}' | sort

## Copy envs, install deps
bootstrap: ## Copy envs, install deps
	@echo "==> Bootstrapping project"
	@if [ -f frontend/env.example ] && [ ! -f frontend/.env ]; then \
	  cp frontend/env.example frontend/.env; \
	  echo "Created frontend/.env from env.example (update keys as needed)"; \
	fi
	@if [ -f backend/env.example ] && [ ! -f backend/.env ]; then \
	  cp backend/env.example backend/.env; \
	  echo "Created backend/.env from env.example (update keys as needed)"; \
	fi
	@echo "Installing dependencies (backend)"
	@(cd backend && if [ ! -d node_modules ]; then npm ci || npm install; else echo "backend/node_modules present — skipping"; fi)
	@echo "Installing dependencies (frontend)"
	@(cd frontend && if [ ! -d node_modules ]; then npm ci || npm install; else echo "frontend/node_modules present — skipping"; fi)
	@$(MAKE) env
	@echo "Bootstrap complete."

## Start both backend and frontend with hot-reload
dev: ## Start Supabase (if installed), backend and frontend with hot reload
	@echo "==> Developer mode"
	@$(MAKE) doctor
	@$(MAKE) env
	@if command -v supabase >/dev/null 2>&1; then \
	  if ! supabase status >/dev/null 2>&1; then \
	    echo "Starting Supabase (first run may take a while)..."; \
	    supabase start; \
	  else \
	    echo "Supabase is running."; \
	  fi; \
	else \
	  echo "Supabase CLI not found — skipping Supabase startup. See SETUP.md to install."; \
	fi
	@echo "Starting backend on http://localhost:$(BACK_PORT)"
	@(cd backend && npm run dev) &
	BACK_PID=$$!
	@echo "Starting frontend on http://localhost:3000"
	@(cd frontend && npm run dev) &
	FRONT_PID=$$!
	@echo ""
	@echo "Servers starting:"
	@echo "  • Backend:  http://localhost:$(BACK_PORT)"
	@echo "  • Frontend: http://localhost:3000"
	@echo "Press Ctrl+C to stop both."
	@trap 'echo "\nStopping..."; kill $$BACK_PID $$FRONT_PID 2>/dev/null || true' INT TERM; \
	wait $$BACK_PID $$FRONT_PID

frontend: ## Start frontend only
	@(cd frontend && npm run dev)

backend: ## Start backend only
	@(cd backend && npm run dev)

## Attempt to stop typical dev ports (best effort)
stop: ## Stop dev services and Supabase (best effort)
	@echo "==> Stopping dev services (best effort)"
	-@if command -v lsof >/dev/null 2>&1; then \
	  for p in 3000 8000 54321 54322 54323; do \
	    pid=$$(lsof -t -i :$$p -sTCP:LISTEN 2>/dev/null || true); \
	    if [ -n "$$pid" ]; then echo "Killing PID $$pid on port $$p"; kill $$pid || true; fi; \
	  done; \
	fi
	-@if command -v supabase >/dev/null 2>&1; then supabase stop || true; fi
	@echo "Done."

## Start local Supabase, then sync env files
supabase:
	@if ! command -v supabase >/dev/null 2>&1; then \
	  echo "Supabase CLI not installed. See SETUP.md for installation."; \
	  exit 1; \
	fi
	@echo "==> Starting Supabase services"
	@supabase start
	@echo "==> Syncing env to frontend/.env and backend/.env"
	@node scripts/sync-supabase-env.mjs
	@$(MAKE) doctor

## Quick environment and tooling checks
doctor: ## Check env files, tools, and backend health
	@echo "==> Preflight checks"
	@if [ -f frontend/.env ]; then echo "✓ frontend/.env present"; else echo "! frontend/.env missing (run: make bootstrap)"; fi
	@if [ -f backend/.env ]; then echo "✓ backend/.env present"; else echo "! backend/.env missing (run: make bootstrap)"; fi
	@if command -v node >/dev/null 2>&1; then echo "✓ node installed: $$(node -v)"; else echo "! node not found"; fi
	@if command -v npm >/dev/null 2>&1; then echo "✓ npm installed: $$(npm -v)"; else echo "! npm not found"; fi
	@if command -v supabase >/dev/null 2>&1; then \
	  if supabase status >/dev/null 2>&1; then echo "✓ Supabase running"; else echo "! Supabase not running (will start if available)"; fi; \
	else \
	  echo "! Supabase CLI not installed (optional)"; \
	fi
	@# Check backend health (best effort)
	@URL="http://localhost:$(BACK_PORT)/api/health"; \
	if command -v curl >/dev/null 2>&1; then \
	  echo "Checking backend health at $$URL"; \
	  curl -fsS $$URL >/dev/null && echo "✓ Backend healthy" || echo "! Backend not responding yet"; \
	fi

## Ensure VITE_API_BASE_URL matches backend port
env: ## Ensure frontend API base URL matches backend port
	@echo "==> Ensuring frontend API base URL"
	@BE_PORT=$(BACK_PORT); \
	FE_ENV=frontend/.env; \
	LINE="VITE_API_BASE_URL=http://localhost:$$BE_PORT/api"; \
	if [ -f $$FE_ENV ]; then \
	  if grep -q '^VITE_API_BASE_URL=' $$FE_ENV; then \
	    sed -i.bak "s#^VITE_API_BASE_URL=.*#$$LINE#" $$FE_ENV && rm -f $$FE_ENV.bak; \
	  else \
	    echo "$$LINE" >> $$FE_ENV; \
	  fi; \
	  echo "✓ frontend/.env -> $$LINE"; \
	else \
		  echo "! frontend/.env missing (run: make bootstrap)"; \
	fi

test: ## Run tests in backend and frontend
	@echo "==> Running backend tests"
	@(cd backend && npm run test)
	@echo "==> Running frontend tests"
	@(cd frontend && npm run test)

lint: ## Run lints (frontend)
	@echo "==> Linting frontend"
	@(cd frontend && npm run lint)

build: ## Build backend and frontend
	@echo "==> Building backend"
	@(cd backend && npm run build)
	@echo "==> Building frontend"
	@(cd frontend && npm run build)
