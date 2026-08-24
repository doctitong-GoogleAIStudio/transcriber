import os
import asyncio
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment variables")
    
    async def detect_language(self, audio_base64: str, mime_type: str) -> str:
        """
        Detect the language spoken in the audio file.
        
        Args:
            audio_base64: Base64 encoded audio file
            mime_type: MIME type of the audio file (e.g., 'audio/webm', 'audio/mp3')
        
        Returns:
            Detected language as a string
        """
        try:
            # Create a unique session for this request
            session_id = f"detect_{id(audio_base64)}"
            
            # Supported languages list
            supported_languages = [
                'Arabic', 'Bikol', 'Cebuano', 'English', 'French', 'German',
                'Hindi', 'Ilocano', 'Ilonggo (Hiligaynon)', 'Indonesian', 'Italian',
                'Japanese', 'Korean', 'Mandarin Chinese', 'Portuguese', 'Russian',
                'Spanish', 'Tagalog', 'Thai', 'Vietnamese', 'Waray'
            ]
            
            prompt = f"""You are an expert language detection service. Analyze the following audio file and identify the primary spoken language. 
            
Respond with ONLY the name of the language from this list: {', '.join(supported_languages)}. 
            
If you cannot determine the language with high confidence, respond with "Unknown"."""
            
            # Create file content
            file_content = FileContent(
                content_type=mime_type,
                file_content_base64=audio_base64
            )
            
            # Create user message with audio file
            user_message = UserMessage(
                text=prompt,
                file_contents=[file_content]
            )
            
            # Initialize chat with Gemini
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="You are a language detection expert."
            ).with_model("gemini", "gemini-2.5-flash")
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            detected_language = response.strip()
            
            # Validate if detected language is in supported list
            if detected_language in supported_languages:
                return detected_language
            else:
                # Default to English if detection fails
                return "English"
        
        except Exception as e:
            print(f"Error in language detection: {str(e)}")
            raise Exception(f"Language detection failed: {str(e)}")
    
    async def transcribe_audio(self, audio_base64: str, mime_type: str, language: str) -> str:
        """
        Transcribe audio file to text in the specified language.
        
        Args:
            audio_base64: Base64 encoded audio file
            mime_type: MIME type of the audio file
            language: Target language for transcription
        
        Returns:
            Transcribed text
        """
        try:
            # Create a unique session for this request
            session_id = f"transcribe_{id(audio_base64)}"
            
            prompt = f"""Transcribe the following audio file. The spoken language is {language}. 
            
Provide ONLY the transcribed text without any additional commentary or formatting."""
            
            # Create file content
            file_content = FileContent(
                content_type=mime_type,
                file_content_base64=audio_base64
            )
            
            # Create user message with audio file
            user_message = UserMessage(
                text=prompt,
                file_contents=[file_content]
            )
            
            # Initialize chat with Gemini
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="You are an expert audio transcription assistant."
            ).with_model("gemini", "gemini-2.5-flash")
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            return response.strip()
        
        except Exception as e:
            print(f"Error in transcription: {str(e)}")
            raise Exception(f"Transcription failed: {str(e)}")
    
    async def translate_text(self, text: str, source_language: str) -> str:
        """
        Translate text from source language to English.
        
        Args:
            text: Text to translate
            source_language: Source language of the text
        
        Returns:
            Translated text in English
        """
        try:
            # Create a unique session for this request
            session_id = f"translate_{id(text)}"
            
            prompt = f"""Translate the following text from {source_language} to English. 
            
Provide ONLY the final English translation without any additional commentary.
            
Text:
\"\"\"
{text}
\"\"\""""
            
            # Create user message
            user_message = UserMessage(text=prompt)
            
            # Initialize chat with Gemini
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="You are an expert translator."
            ).with_model("gemini", "gemini-2.5-flash")
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            return response.strip()
        
        except Exception as e:
            print(f"Error in translation: {str(e)}")
            raise Exception(f"Translation failed: {str(e)}")
    
    async def generate_summary(self, transcription: str, language: str) -> str:
        """Generate a concise summary from transcription."""
        try:
            session_id = f"summary_{id(transcription)}"
            prompt = f"""Summarize the following transcription (in {language}) into a clear, concise summary.
Include the key points, main topics discussed, and any important conclusions or decisions.
Keep the summary to 3-5 paragraphs maximum.

Transcription:
\"\"\"
{transcription}
\"\"\"

Provide ONLY the summary text without any headers or labels."""

            user_message = UserMessage(text=prompt)
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="You are an expert at creating clear, accurate summaries."
            ).with_model("gemini", "gemini-2.5-flash")

            response = await chat.send_message(user_message)
            return response.strip()
        except Exception as e:
            print(f"Error in summary generation: {str(e)}")
            raise Exception(f"Summary generation failed: {str(e)}")

    async def generate_insights(self, transcription: str, language: str, mode: str) -> dict:
        """Generate mode-specific AI insights from transcription."""
        try:
            session_id = f"insights_{mode}_{id(transcription)}"

            prompts = {
                "meeting": """Analyze this meeting transcription and produce structured meeting minutes.

Format your response EXACTLY with these sections (use these exact labels):
DISCUSSION: [Key topics and points discussed]
DECISIONS: [Decisions that were made]
ACTION_ITEMS: [Action items identified]
RESPONSIBLE: [Who is responsible for each action item]
DEADLINES: [Any deadlines or timelines mentioned]""",

                "medical": """Analyze this medical/clinical transcription and generate structured SOAP notes.
IMPORTANT: This is an AI-assisted tool. The clinician MUST verify all output.

Format your response EXACTLY with these sections:
SUBJECTIVE: [Patient's reported symptoms, concerns, history]
OBJECTIVE: [Observable findings, vital signs, examination results]
ASSESSMENT: [Medical diagnosis or clinical impression]
PLAN: [Treatment plan, medications, follow-up]
CONSENT_NOTE: [Note about patient consent for recording if mentioned, or state "Consent status not documented in recording"]""",

                "lecture": """Analyze this lecture/educational transcription and produce organized study notes.

Format your response EXACTLY with these sections:
KEY_POINTS: [Main points and concepts covered]
DEFINITIONS: [Important terms and their definitions]
NOTES: [Detailed organized notes from the lecture]
REVIEW_QUESTIONS: [3-5 review questions based on the content]""",

                "interview": """Analyze this interview transcription and format it as structured dialogue.

Format your response EXACTLY with these sections:
PARTICIPANTS: [Identified participants/roles]
DIALOGUE: [Formatted as Interviewer/Respondent dialogue]
KEY_TAKEAWAYS: [Main insights from the interview]""",

                "general": """Analyze this transcription and provide useful insights.

Format your response EXACTLY with these sections:
OVERVIEW: [Brief overview of the content]
KEY_POINTS: [Main points discussed]
NOTABLE_QUOTES: [Any notable statements]
FOLLOW_UP: [Suggested follow-up actions if applicable]"""
            }

            mode_key = mode.lower() if mode.lower() in prompts else "general"
            prompt = f"""{prompts[mode_key]}

Transcription (in {language}):
\"\"\"
{transcription}
\"\"\""""

            user_message = UserMessage(text=prompt)
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=f"You are an expert at analyzing transcriptions in {mode_key} mode."
            ).with_model("gemini", "gemini-2.5-flash")

            response = await chat.send_message(user_message)
            return self._parse_insights_response(response, mode_key)
        except Exception as e:
            print(f"Error in insights generation: {str(e)}")
            raise Exception(f"Insights generation failed: {str(e)}")

    def _parse_insights_response(self, response: str, mode: str) -> dict:
        """Parse mode-specific insights response into sections."""
        sections = {}
        lines = response.strip().split('\n')
        current_key = None
        current_content = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                if current_key:
                    current_content.append('')
                continue

            # Check if line starts a new section (e.g., "KEY_POINTS:" or "**KEY_POINTS:**")
            clean = stripped.replace('**', '').replace('*', '')
            found_key = None
            for potential_key in ['DISCUSSION', 'DECISIONS', 'ACTION_ITEMS', 'RESPONSIBLE', 'DEADLINES',
                                  'SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN', 'CONSENT_NOTE',
                                  'KEY_POINTS', 'DEFINITIONS', 'NOTES', 'REVIEW_QUESTIONS',
                                  'PARTICIPANTS', 'DIALOGUE', 'KEY_TAKEAWAYS',
                                  'OVERVIEW', 'NOTABLE_QUOTES', 'FOLLOW_UP']:
                if clean.upper().startswith(potential_key + ':'):
                    found_key = potential_key.lower()
                    break

            if found_key:
                if current_key and current_content:
                    sections[current_key] = '\n'.join(current_content).strip()
                current_key = found_key
                remainder = stripped.split(':', 1)[1].strip() if ':' in stripped else ''
                # Clean markdown bold
                remainder = remainder.replace('**', '')
                current_content = [remainder] if remainder else []
            elif current_key:
                current_content.append(stripped)

        if current_key and current_content:
            sections[current_key] = '\n'.join(current_content).strip()

        return sections

    async def generate_soap_summary(self, transcription: str, language: str) -> dict:
        """
        Generate a SOAP (Subjective, Objective, Assessment, Plan) summary from transcription.
        
        Args:
            transcription: The medical transcription text
            language: The language of the transcription
        
        Returns:
            Dictionary with SOAP sections
        """
        try:
            # Create a unique session for this request
            session_id = f"soap_{id(transcription)}"
            
            prompt = f"""You are a medical documentation expert. Analyze the following medical transcription (in {language}) and generate a structured SOAP note.

SOAP Format:
- S (Subjective): Patient's reported symptoms, concerns, and history
- O (Objective): Observable and measurable findings, vital signs, examination results
- A (Assessment): Medical diagnosis or clinical impression
- P (Plan): Treatment plan, medications, follow-up, patient education

Transcription:
\"\"\"
{transcription}
\"\"\"

Generate a comprehensive SOAP note. Use clear, concise medical terminology. If certain SOAP sections lack information in the transcription, note "Not documented" or provide reasonable clinical interpretation based on context.

Format your response EXACTLY as follows:
S: [Subjective findings]
O: [Objective findings]
A: [Assessment/Diagnosis]
P: [Plan/Treatment]
"""
            
            # Create user message
            user_message = UserMessage(text=prompt)
            
            # Initialize chat with Gemini
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="You are an expert medical documentation specialist trained in creating SOAP notes from clinical transcriptions."
            ).with_model("gemini", "gemini-2.5-flash")
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            # Parse the response into SOAP sections
            soap_dict = self._parse_soap_response(response)
            
            return soap_dict
        
        except Exception as e:
            print(f"Error in SOAP generation: {str(e)}")
            raise Exception(f"SOAP generation failed: {str(e)}")
    
    def _parse_soap_response(self, response: str) -> dict:
        """
        Parse the SOAP response into structured sections.
        
        Args:
            response: The AI-generated SOAP note text
        
        Returns:
            Dictionary with S, O, A, P keys
        """
        soap_dict = {
            "subjective": "",
            "objective": "",
            "assessment": "",
            "plan": ""
        }
        
        lines = response.strip().split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for section headers
            if line.startswith('S:') or line.startswith('Subjective:'):
                current_section = 'subjective'
                content = line.split(':', 1)[1].strip() if ':' in line else ''
                if content:
                    soap_dict[current_section] = content
            elif line.startswith('O:') or line.startswith('Objective:'):
                current_section = 'objective'
                content = line.split(':', 1)[1].strip() if ':' in line else ''
                if content:
                    soap_dict[current_section] = content
            elif line.startswith('A:') or line.startswith('Assessment:'):
                current_section = 'assessment'
                content = line.split(':', 1)[1].strip() if ':' in line else ''
                if content:
                    soap_dict[current_section] = content
            elif line.startswith('P:') or line.startswith('Plan:'):
                current_section = 'plan'
                content = line.split(':', 1)[1].strip() if ':' in line else ''
                if content:
                    soap_dict[current_section] = content
            elif current_section:
                # Continue adding to current section
                if soap_dict[current_section]:
                    soap_dict[current_section] += ' ' + line
                else:
                    soap_dict[current_section] = line
        
        return soap_dict

    async def identify_speakers(self, transcription: str, language: str) -> str:
        """Identify and label different speakers in a transcription."""
        try:
            session_id = f"speakers_{id(transcription)}"
            prompt = f"""Analyze this transcription and identify different speakers. Reformat the text with speaker labels.

Rules:
- Label speakers as "Speaker 1:", "Speaker 2:", etc.
- If the context makes roles clear (e.g., Doctor/Patient, Interviewer/Interviewee), you may note that in parentheses: "Speaker 1 (Doctor):"
- Preserve the original text as closely as possible
- Each time a different person speaks, start a new line with their speaker label
- If there is only one speaker, label them as "Speaker 1:"

Transcription (in {language}):
\"\"\"
{transcription}
\"\"\"

Return ONLY the reformatted text with speaker labels. No other commentary."""

            user_message = UserMessage(text=prompt)
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="You are an expert at identifying different speakers in transcribed audio."
            ).with_model("gemini", "gemini-2.5-flash")

            response = await chat.send_message(user_message)
            return response.strip()
        except Exception as e:
            print(f"Error in speaker identification: {str(e)}")
            raise Exception(f"Speaker identification failed: {str(e)}")

    async def ask_recording(self, transcription: str, language: str, question: str) -> str:
        """Answer a question about the transcription content."""
        try:
            session_id = f"ask_{id(question)}"
            prompt = f"""Based on the following transcription, answer this question accurately and concisely.

Question: {question}

Transcription (in {language}):
\"\"\"
{transcription}
\"\"\"

Provide a clear, direct answer based ONLY on what is in the transcription. If the answer cannot be found in the transcription, say "This information is not found in the recording." Keep your answer concise but thorough."""

            user_message = UserMessage(text=prompt)
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="You answer questions about transcribed audio content accurately and concisely."
            ).with_model("gemini", "gemini-2.5-flash")

            response = await chat.send_message(user_message)
            return response.strip()
        except Exception as e:
            print(f"Error in ask recording: {str(e)}")
            raise Exception(f"Ask recording failed: {str(e)}")


# Singleton instance
gemini_service = GeminiService()
