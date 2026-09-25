import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ["GROQ_API_KEY"]) if os.environ.get("GROQ_API_KEY") else None

def ask_groq(system_prompt, user_message):
    """Send a message to Groq LLaMA 3 and return the text response."""
    if client is None:
        raise RuntimeError("GROQ_API_KEY is not configured")

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.8,
        max_tokens=1024,
    )
    return response.choices[0].message.content
