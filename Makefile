.PHONY: backend frontend dev test

backend:
	cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Run backend and frontend in two terminals:"
	@echo "  make backend"
	@echo "  make frontend"

test:
	cd backend && PYTHONPATH=. python -m unittest discover -s tests -p 'test_*.py'
