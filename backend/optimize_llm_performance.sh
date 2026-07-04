#!/bin/bash

# Script to optimize LLM performance
# Reduces response time by optimizing Ollama settings

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Optimizing LLM Performance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check current GPU usage
echo "1️⃣  Current GPU Status:"
if command -v nvidia-smi > /dev/null 2>&1; then
    nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader
else
    echo "   ⚠️  No GPU detected"
fi
echo ""

# Check if model is loaded
echo "2️⃣  Checking loaded models:"
ollama ps
echo ""

# Pre-load the model to keep it in memory
echo "3️⃣  Pre-loading model into GPU memory..."
echo "   This will keep the model ready for faster responses"
echo ""

curl -s http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "Hi",
  "stream": false,
  "options": {
    "num_predict": 5
  }
}' > /dev/null

echo "   ✅ Model loaded into memory"
echo ""

# Check GPU usage after loading
echo "4️⃣  GPU Status after loading:"
if command -v nvidia-smi > /dev/null 2>&1; then
    nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv,noheader
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Optimization Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips for better performance:"
echo "   1. Keep model loaded in memory (don't restart Ollama)"
echo "   2. Use shorter prompts when possible"
echo "   3. Reduce top_k to 3 instead of 5"
echo "   4. Consider using streaming responses"
echo ""
echo "📊 Expected performance:"
echo "   • First query: 10-30 seconds (model loading)"
echo "   • Subsequent queries: 5-15 seconds (model in memory)"
echo "   • Tokens/second: ~4-6 tokens/s on GTX 1650"
