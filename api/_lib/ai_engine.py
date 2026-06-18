import os
import json
from google import genai
from google.genai import types
from google.genai.errors import APIError

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing critical environment variable: GEMINI_API_KEY is not configured.")
    return genai.Client(api_key=api_key)

AI_SYSTEM_INSTRUCTION = """
You are the core AI architectural layout sub-engine for EduSentiAI.
Your sole task is to generate complete web form field layout configurations based on an administrative text prompt.

You MUST respond with a valid, clean JSON array of objects, and absolutely nothing else.
Do NOT include markdown formatting, backticks, or wrapping text like ```json```. Your entire output must parse cleanly as a single JSON array.

Each object in the array must match this structural schema layout model exactly:
{
  "field_name": "lowercase_snake_case_string_used_as_the_key",
  "field_label": "Human readable question or input instruction statement",
  "field_type": "text" | "paragraph" | "email" | "phone" | "number" | "date" | "dropdown" | "radio" | "checkbox" | "rating",
  "is_required": true | false,
  "options": ["Option 1", "Option 2"]
}

Rules for Fields:
1. 'field_name' must be a unique snake_case string per field.
2. Provide an 'options' array ONLY if field_type is 'dropdown', 'radio', or 'checkbox'. For all other field types, 'options' must be null.
3. If field_type is 'rating', the frontend implies a 1-5 selection scale. Set 'options' to null.
4. Keep the fields practical, relevant to educational settings, and concise.
5. Generate between 4 and 10 fields per form depending on complexity.
"""

def generate_form_schema(admin_prompt: str) -> list:
    try:
        client = get_gemini_client()
        config = types.GenerateContentConfig(
            system_instruction=AI_SYSTEM_INSTRUCTION,
            temperature=0.2,
            response_mime_type="application/json"
        )
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Generate a form configuration based on this requirement: {admin_prompt}",
            config=config
        )
        if not response.text:
            raise ValueError("Gemini API returned an empty content string.")
        parsed_fields_array = json.loads(response.text)
        if not isinstance(parsed_fields_array, list):
            raise ValueError("AI response format invalid: Output root object must be a JSON array list.")
        return parsed_fields_array
    except json.JSONDecodeError:
        raise ValueError("AI output format was structurally corrupted. Please try a different prompt description.")
    except APIError as e:
        raise RuntimeError(f"Gemini API Gateway communication error: {str(e)}")
    except Exception as e:
        raise e
