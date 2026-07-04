#!/bin/bash

echo "🔍 Testing if Ollama uses GPU..."
echo ""

# Check initial GPU state
echo "📊 GPU Status BEFORE running model:"
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits
echo ""

# Run a simple query
echo "🤖 Running test query with qwen2.5:7b..."
curl -s http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "Say hello in one word",
  "stream": false
}' > /tmp/ollama_test.json &

CURL_PID=$!

# Wait a moment for model to load
sleep 3

# Check GPU usage while model is running
echo "📊 GPU Status WHILE model is running:"
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits
echo ""

# Wait for completion
wait $CURL_PID

# Check final state
echo "📊 GPU Status AFTER model finished:"
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits
echo ""

# Show detailed GPU info
echo "📋 Detailed GPU Info:"
nvidia-smi --query-gpu=index,name,driver_version,memory.total,memory.used,memory.free,utilization.gpu,utilization.memory --format=csv,noheader
echo ""

# Check if model is loaded in GPU
echo "🔍 Checking Ollama process GPU usage:"
nvidia-smi | grep -A 10 "Processes:"
echo ""

# Show response
echo "💬 Model Response:"
cat /tmp/ollama_test.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('response', 'No response'))" 2>/dev/null || echo "Could not parse response"
echo ""

rm -f /tmp/ollama_test.json
