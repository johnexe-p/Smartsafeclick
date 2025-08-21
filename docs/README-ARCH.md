# Architecture (Starter)

- **Extension (MV3)**: content script captures link clicks → background fetches `/score` → notifications if risky.
- **Backend (Express)**: `/score?url=...` returns `{risk, reason}`. Replace stub with real AI/heuristics.
- **AI Path**: Add URL features, NLP, and model scoring service as `/ml/score` later.
