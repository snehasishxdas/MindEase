import re


_BURNOUT_GROUPS = {
    "exhaustion": (
        r"\bburn(?:ed|t)\s+out\b",
        r"\bexhaust(?:ed|ion)\b",
        r"\bdrained\b",
        r"\btired all the time\b",
        r"\boverwhelmed\b",
    ),
    "detachment": (
        r"\bemotionally numb\b",
        r"\bdetached\b",
        r"\blost interest\b",
        r"\bdreading\b",
        r"\bdon't care about\b",
    ),
    "reduced_capacity": (
        r"\bcan't focus\b",
        r"\bcannot focus\b",
        r"\bno motivation\b",
        r"\bcan't cope\b",
        r"\bcannot cope\b",
        r"\bfailing at everything\b",
    ),
}

_SELF_HARM_PATTERNS = (
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\btake my own life\b",
    r"\bwant to die\b",
    r"\bwish I (?:was|were) dead\b",
    r"\bsuicidal(?: thoughts| ideation)?\b",
    r"\bthinking about suicide\b",
    r"\bhurt myself\b",
    r"\bharm myself\b",
    r"\bself[- ]harm(?:ing)?\b",
    r"\bcut myself\b",
    r"\bno reason to live\b",
)

_NEGATION = re.compile(r"\b(?:not|never|no|don't|dont|do not|wouldn't|would not)\b(?:\W+\w+){0,3}\W*$")


def assess_journal(text: str) -> dict[str, object]:
    normalized = text.lower()
    burnout_signals = [
        signal
        for signal, patterns in _BURNOUT_GROUPS.items()
        if any(re.search(pattern, normalized) for pattern in patterns)
    ]
    if len(burnout_signals) >= 2:
        burnout_level = "high"
    elif burnout_signals:
        burnout_level = "moderate"
    else:
        burnout_level = "low"

    self_harm_concern = False
    for pattern in _SELF_HARM_PATTERNS:
        for match in re.finditer(pattern, normalized):
            prefix = normalized[max(0, match.start() - 60):match.start()]
            clause_prefix = re.split(r"[,;.!?]|\b(?:but|however|although|yet)\b", prefix)[-1]
            if not _NEGATION.search(clause_prefix):
                self_harm_concern = True
                break
        if self_harm_concern:
            break

    return {
        "burnout_level": burnout_level,
        "burnout_signals": burnout_signals,
        "self_harm_concern": self_harm_concern,
    }