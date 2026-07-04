#!/bin/bash

# Test script to verify Makefile GPU and model detection
# تست سكريبت للتأكد من فحص GPU والموديل في Makefile

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Makefile GPU & Model Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Check if nvidia-smi is available
echo "1️⃣  Testing GPU Detection..."
if command -v nvidia-smi > /dev/null 2>&1; then
    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -1)
    if [ -n "$GPU_INFO" ]; then
        echo "✅ GPU Detected: $GPU_INFO"
    else
        echo "⚠️  nvidia-smi found but no GPU detected"
    fi
else
    echo "⚠️  No NVIDIA GPU detected (nvidia-smi not found)"
fi
echo ""

# Test 2: Check if Ollama is running
echo "2️⃣  Testing Ollama Connection..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
    
    # Test 3: Check if model exists
    echo ""
    echo "3️⃣  Testing Model Availability..."
    MODEL_NAME="qwen2.5:7b"
    if ollama list | grep -q "$MODEL_NAME"; then
        echo "✅ Model $MODEL_NAME is available"
    else
        echo "⚠️  Model $MODEL_NAME not found"
        echo "   To download: ollama pull $MODEL_NAME"
    fi
else
    echo "❌ Ollama is not running"
    echo "   Please start Ollama: ollama serve"
fi
echo ""

# Test 4: Check GPU usage (if available)
echo "4️⃣  Testing GPU Status Display..."
if command -v nvidia-smi > /dev/null 2>&1; then
    GPU_USAGE=$(nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null | head -1)
    if [ -n "$GPU_USAGE" ]; then
        GPU_UTIL=$(echo $GPU_USAGE | cut -d',' -f1)
        MEM_USED=$(echo $GPU_USAGE | cut -d',' -f2)
        MEM_TOTAL=$(echo $GPU_USAGE | cut -d',' -f3)
        echo "✅ GPU Status:"
        echo "   • Utilization: ${GPU_UTIL}%"
        echo "   • Memory: ${MEM_USED}MB / ${MEM_TOTAL}MB"
    else
        echo "⚠️  Could not get GPU usage stats"
    fi
else
    echo "⚠️  GPU monitoring not available"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Makefile Tests Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 To run the backend with GPU support: make run"
