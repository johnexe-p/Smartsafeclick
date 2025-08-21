# SmartSafe Click

AI-assisted link safety checker for Gmail, social platforms, and the web.

## Quick start
1) Start backend:
```bash
cd backend
npm install
npm start
```
2) Load the `extension/` in Chrome: `chrome://extensions` → Developer mode → Load unpacked.
3) Click any link; risky ones (with words like `login`, `verify`, `free`, `urgent`) will show a warning.
