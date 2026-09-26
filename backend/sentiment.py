from functools import lru_cache

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


@lru_cache(maxsize=1)
def get_sentiment_analyzer():
    return SentimentIntensityAnalyzer()


def analyze_sentiment(text: str) -> dict[str, str | float]:
    scores = get_sentiment_analyzer().polarity_scores(text)
    compound = scores["compound"]
    label = "positive" if compound >= 0.05 else "negative" if compound <= -0.05 else "neutral"
    return {
        "label": label,
        "score": round(abs(compound), 4),
        "model": "vaderSentiment",
    }