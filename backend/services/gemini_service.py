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

# Singleton instance
gemini_service = GeminiService()
