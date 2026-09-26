import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ["GROQ_API_KEY"]) if os.environ.get("GROQ_API_KEY") else None


def ask_groq_chat(system_prompt, messages, max_tokens=600):
    """Send a conversation to Groq and return the assistant response."""
    if client is None:
        raise RuntimeError("GROQ_API_KEY is not configured")

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "system", "content": system_prompt}, *messages],
        temperature=0.8,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def ask_groq(system_prompt, user_message):
    """Send a single user message to Groq and return the text response."""
    return ask_groq_chat(system_prompt, [{"role": "user", "content": user_message}], 1024)
