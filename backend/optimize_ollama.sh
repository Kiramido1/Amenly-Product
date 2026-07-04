#!/bin/bash

# سكريبت تحسين أداء Ollama
# يحمل الموديل الأصغر ويعدل الإعدادات

echo "================================================================================"
echo "تحسين أداء Ollama للعمل على GPU"
echo "================================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}✗ Ollama غير مثبت${NC}"
    echo "لتثبيته: curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

echo -e "${GREEN}✓ Ollama مثبت${NC}"
echo ""

# Check GPU
echo "فحص GPU..."
if nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader)
    GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader)
    echo -e "${GREEN}✓ GPU متاح: $GPU_NAME ($GPU_MEM)${NC}"
else
    echo -e "${YELLOW}⚠ لا يوجد GPU NVIDIA${NC}"
    echo "سيتم استخدام CPU"
fi
echo ""

# Check current model
echo "الموديل الحالي:"
CURRENT_MODEL=$(grep OLLAMA_MODEL .env | cut -d'=' -f2)
echo "  $CURRENT_MODEL"
echo ""

# Recommend model based on GPU
if nvidia-smi &> /dev/null; then
    GPU_MEM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits)
    
    if [ "$GPU_MEM_MB" -lt 6000 ]; then
        RECOMMENDED="qwen2.5:1.5b"
        echo -e "${YELLOW}توصية: استخدم $RECOMMENDED (GPU صغير)${NC}"
    else
        RECOMMENDED="qwen2.5:7b"
        echo -e "${GREEN}توصية: يمكنك استخدام $RECOMMENDED (GPU كبير)${NC}"
    fi
else
    RECOMMENDED="qwen2.5:1.5b"
    echo -e "${YELLOW}توصية: استخدم $RECOMMENDED (CPU)${NC}"
fi
echo ""

# Ask user
read -p "هل تريد تحميل الموديل الموصى به ($RECOMMENDED)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "تحميل $RECOMMENDED..."
    ollama pull $RECOMMENDED
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ تم التحميل بنجاح${NC}"
        echo ""
        
        # Update .env
        echo "تحديث ملف .env..."
        if grep -q "OLLAMA_MODEL=" .env; then
            sed -i "s/OLLAMA_MODEL=.*/OLLAMA_MODEL=$RECOMMENDED/" .env
            echo -e "${GREEN}✓ تم تحديث .env${NC}"
        else
            echo "OLLAMA_MODEL=$RECOMMENDED" >> .env
            echo -e "${GREEN}✓ تم إضافة OLLAMA_MODEL إلى .env${NC}"
        fi
        echo ""
        
        # Restart Ollama
        echo "إعادة تشغيل Ollama..."
        pkill ollama 2>/dev/null
        sleep 2
        
        echo -e "${YELLOW}شغل Ollama يدوياً:${NC}"
        echo "  ollama serve"
        echo ""
        
        # Test speed
        echo "لاختبار السرعة:"
        echo "  python test_gpu_vs_cpu.py"
        echo ""
        
        echo -e "${GREEN}✓ تم التحسين بنجاح!${NC}"
    else
        echo -e "${RED}✗ فشل التحميل${NC}"
        exit 1
    fi
else
    echo "تم الإلغاء"
fi

echo ""
echo "================================================================================"
echo "معلومات مفيدة"
echo "================================================================================"
echo ""
echo "الموديلات المتاحة:"
echo "  - qwen2.5:0.5b  (سريع جداً، دقة متوسطة)"
echo "  - qwen2.5:1.5b  (سريع، دقة جيدة) ⭐ موصى به"
echo "  - qwen2.5:7b    (بطيء، دقة عالية)"
echo ""
echo "لتحميل موديل آخر:"
echo "  ollama pull qwen2.5:0.5b"
echo ""
echo "لعرض الموديلات المحملة:"
echo "  ollama list"
echo ""
echo "لحذف موديل:"
echo "  ollama rm qwen2.5:7b"
echo ""
