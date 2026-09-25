from functools import lru_cache

from transformers import pipeline


MODEL_NAME = "syedkhalid0/RoBERTa-Sentimental-Analysis-v1"


@lru_cache(maxsize=1)
def get_sentiment_pipeline():
    """Load the model once, on the first sentiment request."""
    return pipeline("text-classification", model=MODEL_NAME)


def analyze_sentiment(text: str) -> dict[str, str | float]:
    result = get_sentiment_pipeline()(text, truncation=True)[0]
    return {
        "label": str(result["label"]),
        "score": round(float(result["score"]), 4),
        "model": MODEL_NAME,
    }