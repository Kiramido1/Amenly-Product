"""
Position-Based AI Question Generator
Generates dynamic assessment questions based on user position, department, and framework
"""
import json
from typing import Any

import structlog
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm import get_ollama_service
from app.models.compliance import ControlPosition, Framework, FrameworkControl
from app.models.identity import Department, Position

logger = structlog.get_logger(__name__)


class QuestionGenerator:
    """
    Generates AI questions dynamically based on position and framework
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ollama = get_ollama_service()

    async def generate_initial_greeting(
        self,
        position: Position,
        department: Department,
        framework: Framework,
    ) -> str:
        """
        Generate initial AI greeting for assessment session
        """
        try:
            prompt = self._build_greeting_prompt(position, department, framework)

            response = await self.ollama.generate(
                prompt=prompt,
                system=self._get_greeting_system_prompt(),
                temperature=0.7,
                max_tokens=500,
            )

            return response.response.strip()

        except Exception as e:
            logger.error("greeting_generation_failed", error=str(e))
            return f"Hello! I'm here to help you with your {framework.name} compliance assessment. Let's start by discussing your role as {position.name} in the {department.name} department."

    def _get_greeting_system_prompt(self) -> str:
        """System prompt for greeting generation"""
        return """You are a professional compliance assessment assistant. Your role is to:
1. Welcome the user to the assessment
2. Explain the assessment process briefly
3. Set expectations for the conversation
4. Be professional, friendly, and encouraging

Keep the greeting concise (2-3 sentences) and conversational."""

    def _build_greeting_prompt(
        self,
        position: Position,
        department: Department,
        framework: Framework,
    ) -> str:
        """Build prompt for greeting generation"""
        return f"""Generate a welcoming greeting for a compliance assessment.

Context:
- User's Position: {position.name}
- User's Department: {department.name}
- Compliance Framework: {framework.name} ({framework.version if framework.version else 'latest version'})
- Framework Category: {framework.category.value if framework.category else 'General'}

Generate a professional greeting that:
1. Welcomes the user by name/position
2. Mentions the framework being assessed
3. Briefly explains what to expect
4. Encourages the user to share information about their role"""

    async def generate_dynamic_questions(
        self,
        position: Position,
        framework: Framework,
        conversation_context: str | None = None,
        num_questions: int = 3,
    ) -> list[dict[str, Any]]:
        """
        Generate dynamic questions based on position and framework
        
        Args:
            position: User's position
            framework: Compliance framework
            conversation_context: Previous conversation context (optional)
            num_questions: Number of questions to generate
            
        Returns:
            List of generated questions with metadata
        """
        try:
            # Get controls mapped to this position
            controls_result = await self.db.execute(
                select(FrameworkControl)
                .join(ControlPosition, FrameworkControl.id == ControlPosition.control_id)
                .where(
                    and_(
                        FrameworkControl.framework_id == framework.id,
                        ControlPosition.position_id == position.id,
                    )
                )
                .order_by(ControlPosition.importance_weight.desc())
                .limit(10)  # Get top 10 relevant controls
            )
            controls = controls_result.scalars().all()

            if not controls:
                # Fallback: generate questions without specific controls
                return await self._generate_generic_questions(
                    position=position,
                    framework=framework,
                    conversation_context=conversation_context,
                    num_questions=num_questions,
                )

            # Build context from controls
            controls_context = self._build_controls_context(controls)

            # Generate questions using LLM
            prompt = self._build_question_generation_prompt(
                position=position,
                framework=framework,
                controls_context=controls_context,
                conversation_context=conversation_context,
                num_questions=num_questions,
            )

            response = await self.ollama.generate(
                prompt=prompt,
                system=self._get_question_generation_system_prompt(),
                temperature=0.8,
                max_tokens=1024,
            )

            # Parse questions from response
            questions = self._parse_generated_questions(response.response, controls)

            logger.info(
                "dynamic_questions_generated",
                position_id=str(position.id),
                framework_id=str(framework.id),
                count=len(questions),
            )

            return questions

        except Exception as e:
            logger.error("question_generation_failed", error=str(e))
            return []

    def _get_question_generation_system_prompt(self) -> str:
        """System prompt for question generation"""
        return """You are an expert compliance auditor. Your task is to generate relevant assessment questions based on:
1. The user's position and role
2. The compliance framework controls
3. Previous conversation context (if provided)

Generate questions that:
- Are specific to the user's position
- Map to the provided framework controls
- Are actionable and clear
- Encourage detailed responses
- Focus on evidence and implementation

Return ONLY valid JSON in this format:
{
    "questions": [
        {
            "question": "The question text",
            "control_id": "A.5.1",
            "control_title": "Control title",
            "category": "evidence-based | process-based | knowledge-based"
        }
    ]
}

If no specific controls are provided, generate general questions relevant to the position and framework."""

    def _build_controls_context(self, controls: list[FrameworkControl]) -> str:
        """Build context string from controls"""
        context_parts = []
        for control in controls:
            context_parts.append(
                f"Control {control.code}: {control.title}\n"
                f"Description: {control.description or 'N/A'}\n"
                f"Guidance: {control.guidance or 'N/A'}"
            )
        return "\n\n".join(context_parts)

    def _build_question_generation_prompt(
        self,
        position: Position,
        framework: Framework,
        controls_context: str,
        conversation_context: str | None,
        num_questions: int,
    ) -> str:
        """Build prompt for question generation"""
        prompt = f"""Generate {num_questions} assessment questions for a user in the {position.name} position.

Framework: {framework.name} ({framework.version if framework.version else 'latest'})
Framework Category: {framework.category.value if framework.category else 'General'}

Relevant Controls:
{controls_context}
"""

        if conversation_context:
            prompt += f"\nPrevious Conversation Context:\n{conversation_context}\n"
            prompt += "\nGenerate follow-up questions based on this context."
        else:
            prompt += "\nGenerate initial questions to start the assessment."

        return prompt

    async def _generate_generic_questions(
        self,
        position: Position,
        framework: Framework,
        conversation_context: str | None,
        num_questions: int,
    ) -> list[dict[str, Any]]:
        """Generate generic questions when no specific controls are mapped"""
        prompt = f"""Generate {num_questions} general compliance assessment questions for a {position.name}.

Framework: {framework.name}
Framework Category: {framework.category.value if framework.category else 'General'}

Focus on:
- The user's role and responsibilities
- Common compliance requirements for this position
- General implementation practices
"""

        if conversation_context:
            prompt += f"\nPrevious context: {conversation_context}"

        response = await self.ollama.generate(
            prompt=prompt,
            system=self._get_question_generation_system_prompt(),
            temperature=0.8,
            max_tokens=1024,
        )

        return self._parse_generated_questions(response.response, [])

    def _parse_generated_questions(
        self,
        response_text: str,
        controls: list[FrameworkControl],
    ) -> list[dict[str, Any]]:
        """Parse LLM response and extract questions"""
        try:
            # Try to extract JSON from response
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                data = json.loads(json_str)

                questions = []
                for q in data.get("questions", []):
                    # Find matching control if available
                    control_id = q.get("control_id")
                    control = next((c for c in controls if c.code == control_id), None)

                    questions.append({
                        "question": q.get("question", ""),
                        "control_id": control_id,
                        "control_title": q.get("control_title") or (control.title if control else None),
                        "category": q.get("category", "knowledge-based"),
                    })

                return questions

            # Fallback: try parsing entire response
            data = json.loads(response_text)
            return data.get("questions", [])

        except json.JSONDecodeError as e:
            logger.error("json_parse_error", error=str(e), response=response_text[:200])
            return []

    async def generate_followup_question(
        self,
        position: Position,
        framework: Framework,
        last_answer: str,
        last_question: str,
    ) -> str:
        """
        Generate a follow-up question based on the user's last answer
        """
        try:
            prompt = f"""Generate a follow-up question based on the user's response.

User's Position: {position.name}
Framework: {framework.name}

Last Question: {last_question}
User's Answer: {last_answer}

Generate a relevant follow-up question that:
1. Digs deeper into the user's response
2. Asks for specific evidence or examples
3. Relates to the compliance framework
4. Is conversational and natural"""

            response = await self.ollama.generate(
                prompt=prompt,
                system="You are a professional compliance auditor. Generate relevant follow-up questions.",
                temperature=0.7,
                max_tokens=300,
            )

            return response.response.strip()

        except Exception as e:
            logger.error("followup_generation_failed", error=str(e))
            return "Could you provide more details about your implementation?"
