# دليل استخدام Swagger UI للـ RAG System

## 🌐 الوصول إلى Swagger UI

افتح المتصفح واذهب إلى:
```
http://localhost:8001/docs
```

## 🔐 خطوات الاستخدام

### 1. تسجيل الدخول (Login)

1. ابحث عن endpoint: **POST /api/v1/auth/login**
2. اضغط على "Try it out"
3. أدخل البيانات التالية:
```json
{
  "email": "admin@first.com",
  "password": "AdminPassword123!"
}
```
4. اضغط "Execute"
5. **انسخ الـ `access_token`** من الـ Response

### 2. إضافة الـ Token للـ Authorization

1. اضغط على زر **"Authorize"** في أعلى الصفحة (🔓)
2. في خانة **Value**، اكتب:
```
Bearer YOUR_ACCESS_TOKEN_HERE
```
   (استبدل `YOUR_ACCESS_TOKEN_HERE` بالـ token اللي نسخته)
3. اضغط **"Authorize"**
4. اضغط **"Close"**

الآن أنت مصرح لك باستخدام جميع الـ endpoints! 🎉

### 3. اختبار RAG Health

1. ابحث عن endpoint: **GET /api/v1/rag/health**
2. اضغط "Try it out"
3. اضغط "Execute"
4. يجب أن ترى:
```json
{
  "status": "healthy",
  "ollama": {
    "available": true,
    "llm_model": "qwen2.5",
    "embedding_model": "nomic-embed-text",
    "models": [
      "qwen2.5:1.5b",
      "nomic-embed-text:latest",
      "qwen2.5:7b"
    ]
  },
  "qdrant": {
    "url": "http://localhost:6333",
    "status": "connected",
    "collections": ["compliance_frameworks"]
  }
}
```

### 4. استعلام RAG (RAG Query)

1. ابحث عن endpoint: **POST /api/v1/rag/query**
2. اضغط "Try it out"
3. أدخل سؤالك:
```json
{
  "question": "What does ISO 27001 require for MFA?",
  "top_k": 5,
  "framework": "ISO27001"
}
```

**الحقول المتاحة:**
- `question` (مطلوب): السؤال الخاص بك
- `top_k` (اختياري، افتراضي: 5): عدد المستندات المسترجعة
- `score_threshold` (اختياري، افتراضي: 0.5): الحد الأدنى لدرجة التشابه
- `framework` (اختياري): تصفية حسب الإطار
  - `"ISO27001"`
  - `"NIST"`
  - `"SOC2"`
  - `"GDPR"`
  - `"HIPAA"`
  - أو اتركه فارغاً للبحث في جميع الأطر
- `include_metadata` (اختياري، افتراضي: true): تضمين البيانات الوصفية

4. اضغط "Execute"
5. انتظر 30-60 ثانية (الموديل يعمل على CPU)
6. ستحصل على إجابة مع المصادر!

**مثال على الاستجابة:**
```json
{
  "success": true,
  "message": "Query processed successfully",
  "data": {
    "answer": "ISO 27001 requires...",
    "sources": [
      {
        "framework": "iso27001",
        "section": null,
        "control_id": null,
        "source_file": "ISO27001\\ISO 27001 Implementation Guide.pdf",
        "page_number": 28,
        "relevance_score": 0.84
      }
    ],
    "confidence_score": 0.91,
    "retrieved_chunks": 5,
    "processing_time_ms": 49600,
    "framework_filter": "ISO27001"
  }
}
```

### 5. البحث بدون LLM (RAG Search)

إذا كنت تريد فقط البحث عن المستندات ذات الصلة **بدون توليد إجابة**:

1. ابحث عن endpoint: **POST /api/v1/rag/search**
2. اضغط "Try it out"
3. أدخل:
```json
{
  "query": "multi-factor authentication",
  "top_k": 5,
  "framework": "ISO27001"
}
```
4. اضغط "Execute"
5. ستحصل على المستندات المسترجعة فقط (أسرع بكثير!)

## 📝 أمثلة على الأسئلة

### أسئلة ISO 27001:
```
- What does ISO 27001 require for MFA?
- What are the access control requirements in ISO 27001?
- How does ISO 27001 address incident management?
- What are the key controls in ISO 27001?
```

### أسئلة NIST:
```
- What are NIST password requirements?
- How does NIST define risk assessment?
- What are NIST encryption standards?
```

### أسئلة SOC 2:
```
- What are SOC 2 Type II requirements?
- How does SOC 2 address data security?
- What are the trust service criteria in SOC 2?
```

### أسئلة GDPR:
```
- What are GDPR data retention requirements?
- How does GDPR define personal data?
- What are the rights of data subjects under GDPR?
```

## ⚡ نصائح للأداء

1. **الاستعلامات الأولى أبطأ**: أول استعلام قد يأخذ 60-70 ثانية
2. **الاستعلامات التالية أسرع**: بعد ذلك تأخذ 30-50 ثانية
3. **استخدم `top_k` أقل**: إذا كنت تريد إجابات أسرع، استخدم `top_k: 3`
4. **استخدم التصفية**: استخدم `framework` لتصفية النتائج وتحسين الدقة
5. **استخدم Search للاستكشاف**: استخدم `/search` للاستكشاف السريع بدون LLM

## 🔧 استكشاف الأخطاء

### خطأ 401 Unauthorized
- تأكد من أنك قمت بتسجيل الدخول
- تأكد من أنك أضفت الـ token في "Authorize"
- تأكد من أن الـ token يبدأ بـ `Bearer `

### خطأ 422 Validation Error
- تحقق من صحة JSON
- تأكد من أن `question` موجود
- تأكد من أن `framework` (إذا استخدمته) من القيم المسموحة

### خطأ 500 Internal Server Error
- تحقق من أن Ollama يعمل: `ollama list`
- تحقق من أن Qdrant يعمل: `curl http://localhost:6333`
- تحقق من logs الـ backend

### الاستعلام يأخذ وقتاً طويلاً
- هذا طبيعي على CPU (30-60 ثانية)
- إذا أخذ أكثر من 120 ثانية، قد يكون هناك مشكلة
- تحقق من أن الموديل المستخدم هو `qwen2.5:1.5b` وليس `qwen2.5:7b`

## 📊 مراقبة الأداء

كل استجابة تحتوي على:
- `processing_time_ms`: الوقت المستغرق بالميلي ثانية
- `confidence_score`: درجة الثقة في الإجابة (0.0 - 1.0)
- `retrieved_chunks`: عدد المستندات المسترجعة

**درجات الثقة:**
- `0.8 - 1.0`: ثقة عالية جداً ✅
- `0.6 - 0.8`: ثقة جيدة ✅
- `0.4 - 0.6`: ثقة متوسطة ⚠️
- `< 0.4`: ثقة منخفضة ❌

## 🎯 الخلاصة

1. ✅ سجل الدخول واحصل على token
2. ✅ أضف الـ token في "Authorize"
3. ✅ اختبر `/rag/health` للتأكد من أن كل شيء يعمل
4. ✅ استخدم `/rag/query` للحصول على إجابات
5. ✅ استخدم `/rag/search` للبحث السريع

**الآن يمكنك استخدام RAG System من Swagger UI! 🚀**
