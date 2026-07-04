# 🏗️ AMENLY ENTERPRISE REFACTOR - MASTER PLAN

**Status:** In Progress  
**Start Date:** 2026-05-11  
**Target:** Production-Grade Enterprise AI Compliance Platform

---

## 📋 EXECUTIVE SUMMARY

This document outlines the complete refactoring strategy for Amenly, transforming it from a prototype into a production-grade enterprise SaaS platform.

### Current State Assessment
- ✅ Basic auth system exists
- ✅ RAG pipeline functional
- ✅ Database schema partially complete
- ⚠️ Frontend/backend integration broken
- ⚠️ Assessment chat disconnected from RAG
- ⚠️ No proper permissions system
- ⚠️ Test/demo code mixed with production
- ⚠️ No asset extraction system

---

## 🎯 PHASE 1: DATABASE SCHEMA & MIGRATIONS

### 1.1 New Tables Required

#### `permissions` table
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `role_permissions` table
```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, permission_id)
);
```

#### `positions` table (if not exists)
```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `ai_questions` table
```sql
CREATE TABLE ai_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID REFERENCES positions(id),
    framework_id UUID REFERENCES frameworks(id),
    control_id UUID REFERENCES framework_controls(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50),
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `infrastructure_assets` table
```sql
CREATE TABLE infrastructure_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    assessment_session_id UUID REFERENCES assessment_sessions(id),
    asset_type VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    description TEXT,
    extracted_from_message_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `chat_messages` table
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES assessment_sessions(id),
    sender_type VARCHAR(20) NOT NULL, -- 'user' or 'ai'
    message_text TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Default Permissions Seed Data

```python
DEFAULT_PERMISSIONS = [
    # Assessment permissions
    ("start_assessment", "Create and start new assessments", "assessment"),
    ("participate_in_assessment", "Participate in assigned assessments", "assessment"),
    ("view_assessment_results", "View assessment results", "assessment"),
    
    # Dashboard permissions
    ("view_org_dashboard", "View organization-wide dashboard", "dashboard"),
    ("view_personal_dashboard", "View personal dashboard", "dashboard"),
    
    # Asset permissions
    ("view_all_assets", "View all organization assets", "assets"),
    ("view_assigned_assets_only", "View only assigned assets", "assets"),
    
    # Compliance permissions
    ("view_final_compliance_score", "View final compliance scores", "compliance"),
    ("view_personal_compliance", "View personal compliance data", "compliance"),
    
    # Admin permissions
    ("manage_permissions", "Manage user permissions", "admin"),
    ("manage_users", "Manage organization users", "admin"),
    ("manage_frameworks", "Manage compliance frameworks", "admin"),
    
    # Infrastructure permissions
    ("view_infrastructure_map", "View infrastructure map", "infrastructure"),
]

ROLE_PERMISSION_MAPPING = {
    "org_admin": [
        "start_assessment",
        "view_assessment_results",
        "view_org_dashboard",
        "view_all_assets",
        "view_final_compliance_score",
        "manage_permissions",
        "manage_users",
        "manage_frameworks",
        "view_infrastructure_map",
    ],
    "org_member": [
        "participate_in_assessment",
        "view_personal_dashboard",
        "view_assigned_assets_only",
        "view_personal_compliance",
    ],
}
```

---

## 🎯 PHASE 2: BACKEND CORE REFACTORING

### 2.1 Permissions System

**File:** `backend/app/auth/permissions.py`

```python
from functools import wraps
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user
from app.database.session import get_db

class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission
    
    async def __call__(
        self,
        current_user = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not await self.user_has_permission(db, current_user, self.required_permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {self.required_permission} required"
            )
        return current_user
    
    @staticmethod
    async def user_has_permission(db: Session, user, permission: str) -> bool:
        # Check if user's role has this permission
        query = """
            SELECT EXISTS(
                SELECT 1 FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role = :role AND p.name = :permission
            )
        """
        result = db.execute(query, {"role": user.role, "permission": permission})
        return result.scalar()

# Convenience functions
def require_permission(permission: str):
    return Depends(PermissionChecker(permission))

def require_org_admin():
    async def check_admin(current_user = Depends(get_current_user)):
        if current_user.role != "org_admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return current_user
    return Depends(check_admin)
```

### 2.2 Assessment Service Refactor

**File:** `backend/app/assessments/service.py`

```python
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.assessments import Assessment, AssessmentSession, AssessmentAnswer
from app.models.identity import User
from app.ai.rag.rag_service import RAGService
from app.assessments.question_generator import QuestionGenerator

class AssessmentService:
    def __init__(self, db: Session):
        self.db = db
        self.rag_service = RAGService()
        self.question_generator = QuestionGenerator(db)
    
    async def create_assessment(
        self,
        organization_id: UUID,
        framework_id: UUID,
        name: str,
        created_by: UUID
    ) -> Assessment:
        """Create new assessment"""
        assessment = Assessment(
            organization_id=organization_id,
            framework_id=framework_id,
            name=name,
            status="pending"
        )
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment
    
    async def start_session(
        self,
        assessment_id: UUID,
        user: User
    ) -> AssessmentSession:
        """Start assessment session for user"""
        session = AssessmentSession(
            assessment_id=assessment_id,
            user_id=user.id,
            status="in_progress"
        )
        self.db.add(session)
        self.db.commit()
        
        # Generate position-based questions
        await self.question_generator.generate_questions_for_session(
            session_id=session.id,
            position_id=user.position_id,
            framework_id=assessment.framework_id
        )
        
        return session
    
    async def process_chat_message(
        self,
        session_id: UUID,
        message: str,
        user: User
    ) -> dict:
        """Process chat message with RAG"""
        session = self.db.query(AssessmentSession).filter_by(id=session_id).first()
        
        # Get context from RAG
        rag_context = await self.rag_service.retrieve_context(
            query=message,
            framework_id=session.assessment.framework_id,
            position_id=user.position_id
        )
        
        # Generate AI response
        ai_response = await self.rag_service.generate_response(
            user_message=message,
            context=rag_context,
            session_history=self._get_session_history(session_id)
        )
        
        # Extract assets from conversation
        assets = await self._extract_assets(message, ai_response)
        if assets:
            await self._save_assets(session_id, assets)
        
        # Save messages
        await self._save_chat_messages(session_id, message, ai_response)
        
        return {
            "response": ai_response,
            "sources": rag_context.get("sources", []),
            "extracted_assets": assets
        }
```

### 2.3 RAG Integration

**File:** `backend/app/ai/rag/rag_service.py` (Enhanced)

```python
class RAGService:
    async def retrieve_context(
        self,
        query: str,
        framework_id: UUID,
        position_id: Optional[UUID] = None
    ) -> dict:
        """Retrieve relevant context from vector store"""
        
        # Get relevant controls for position
        controls = await self._get_position_controls(position_id, framework_id)
        
        # Vector search
        search_results = await self.retrieval_service.search(
            query=query,
            framework_id=framework_id,
            top_k=10
        )
        
        # Build context
        context = await self.context_builder.build_context(
            search_results=search_results,
            controls=controls,
            position_id=position_id
        )
        
        return context
    
    async def generate_response(
        self,
        user_message: str,
        context: dict,
        session_history: List[dict]
    ) -> str:
        """Generate AI response using LLM"""
        
        prompt = self._build_prompt(user_message, context, session_history)
        
        response = await self.llm_service.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=1000
        )
        
        return response
```

---

## 🎯 PHASE 3: FRONTEND REFACTORING

### 3.1 API Client Layer

**File:** `frontend/src/services/api/assessments.ts`

```typescript
import { apiClient } from './client';

export interface Assessment {
  id: string;
  name: string;
  framework_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  overall_score?: number;
}

export interface AssessmentSession {
  id: string;
  assessment_id: string;
  user_id: string;
  status: string;
  started_at: string;
}

export interface ChatMessage {
  id: string;
  sender_type: 'user' | 'ai';
  message_text: string;
  created_at: string;
  metadata?: any;
}

export const assessmentApi = {
  create: async (data: {
    name: string;
    framework_id: string;
  }): Promise<Assessment> => {
    const response = await apiClient.post('/assessments', data);
    return response.data;
  },
  
  startSession: async (assessmentId: string): Promise<AssessmentSession> => {
    const response = await apiClient.post(`/assessments/${assessmentId}/start`);
    return response.data;
  },
  
  sendMessage: async (sessionId: string, message: string) => {
    const response = await apiClient.post(`/assessments/sessions/${sessionId}/chat`, {
      message
    });
    return response.data;
  },
  
  getHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/assessments/sessions/${sessionId}/messages`);
    return response.data;
  }
};
```

### 3.2 Assessment Chat Component

**File:** `frontend/src/components/assessment/AssessmentChat.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { assessmentApi } from '@/services/api/assessments';
import { useWebSocket } from '@/hooks/useWebSocket';

export const AssessmentChat: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { connected, sendMessage: wsSend } = useWebSocket(`/ws/assessment/${sessionId}`);
  
  useEffect(() => {
    loadHistory();
  }, [sessionId]);
  
  const loadHistory = async () => {
    const history = await assessmentApi.getHistory(sessionId);
    setMessages(history);
  };
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const response = await assessmentApi.sendMessage(sessionId, input);
      
      setMessages(prev => [
        ...prev,
        { sender_type: 'user', message_text: input, created_at: new Date().toISOString() },
        { sender_type: 'ai', message_text: response.response, created_at: new Date().toISOString() }
      ]);
      
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎯 PHASE 4: CLEANUP & OPTIMIZATION

### 4.1 Files to Remove
- All `test_*.py` files in root
- `*_SUMMARY.md` files
- `*_REPORT.md` files
- Unused mock data
- Demo components

### 4.2 Code Quality
- Add type hints to all Python functions
- Add TypeScript types to all frontend code
- Remove console.logs
- Remove commented code
- Fix all linting errors

---

## 🎯 PHASE 5: TESTING & VALIDATION

### 5.1 Backend Tests
- [ ] Auth flow
- [ ] Permission checks
- [ ] Assessment creation
- [ ] RAG retrieval
- [ ] Asset extraction

### 5.2 Frontend Tests
- [ ] Login/logout
- [ ] Protected routes
- [ ] Assessment chat
- [ ] Dashboard access
- [ ] Permission UI

---

## 📊 PROGRESS TRACKING

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Database | 🟡 In Progress | 0% |
| Phase 2: Backend | ⚪ Not Started | 0% |
| Phase 3: Frontend | ⚪ Not Started | 0% |
| Phase 4: Cleanup | ⚪ Not Started | 0% |
| Phase 5: Testing | ⚪ Not Started | 0% |

**Overall Progress: 0%**

---

## 🚀 NEXT STEPS

1. Create database migrations
2. Implement permissions system
3. Refactor assessment service
4. Connect RAG to chat
5. Build frontend components
6. Clean codebase
7. Test everything

---

**Last Updated:** 2026-05-11  
**Document Version:** 1.0
