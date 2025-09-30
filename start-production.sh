#!/bin/bash
set -e

# Trap to kill backend on exit
trap 'kill $BACKEND_PID 2>/dev/null' EXIT

# Start backend
echo "Starting backend server on port 8000..."
cd backend
python main_simple.py &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "Waiting for backend to start..."
for i in {1..20}; do
  if curl -sf http://127.0.0.1:8000/ > /dev/null 2>&1; then
    echo "✓ Backend is ready (PID: $BACKEND_PID)"
    break
  fi
  sleep 1
done

# Start frontend (foreground)
echo "Starting frontend server on port 5000..."
cd frontend
export BACKEND_URL="http://127.0.0.1:8000"
npm start
