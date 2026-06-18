# 🚀 BigQuery Release Notes Explorer

A premium, interactive web application designed to explore, search, and share Google Cloud BigQuery release updates. Built using a **Python Flask** backend and a **vanilla HTML5, CSS3, and JavaScript** frontend.

🔗 **GitHub Repository:** [https://github.com/DrFavs/antigravity-event-talks-app](https://github.com/DrFavs/antigravity-event-talks-app)  
👉 **Local Address:** [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## ✨ Key Features

* **Granular Decomposition**: Splits consolidated daily release feed entries into separate, standalone update cards (e.g., Features, Announcements, Deprecations, Fixes) grouped by their category.
* **Server-Side Caching**: Automatically caches parsed XML feed content for 5 minutes in memory, optimizing performance and protecting public feeds from rate-limiting.
* **Live Search & Filters**: Zero-latency search matching keywords against update texts, dates, and types, along with filter tabs.
* **Dual-Mode Tweet Hub**: 
  * *Single Share*: Share any individual update instantly to Twitter.
  * *Aggregated Share*: Check multiple updates to open a bottom drawer, compose a consolidated summary, check characters, and Tweet them together in one click.
* **Premium Dark Mode Aesthetics**: Uses the modern *Plus Jakarta Sans* typography, custom moving background glows, and glowing frosted glass (glassmorphism) cards matching their category color.

---

## 📂 Project Architecture

```
bq-releases-notes/
├── app.py                  # Flask server & XML Atom feed parser/cacher
├── requirements.txt        # Backend dependencies (Flask, Requests)
├── task.md                 # Development checklist & progress tracker
├── templates/
│   └── index.html          # Frontend page template
└── static/
    ├── css/
    │   └── style.css       # Custom styles, animations, and dark theme variables
    └── js/
        └── app.js          # Client-side filtering, state, and Twitter intents
```

---

## 🛠️ Setup and Execution

This project uses the fast Python manager [uv](https://github.com/astral-sh/uv). Follow these steps to run the server locally:

### 1. Prerequisites
Ensure you have `uv` installed. If not, install it via WinGet:
```powershell
winget install astral-sh.uv
```

### 2. Set Up Virtual Environment & Install Dependencies
Initialize the `.venv` and install the package requirements:
```powershell
uv venv
uv pip install -r requirements.txt
```

### 3. Run the Server
Launch the Flask application using the virtual environment's Python interpreter:
```powershell
.\.venv\Scripts\python.exe app.py
```

Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 🔌 API Endpoints

### `GET /`
Renders the client interface home page.

### `GET /api/releases`
Fetches and parses the XML feed, returning clean JSON results.
* **Parameters**: 
  * `force` (bool, optional): If `true`, bypasses the 5-minute memory cache and fetches fresh XML from Google.
* **Response format**:
```json
{
  "status": "success",
  "cached_at": 1781849156.12,
  "releases": [
    {
      "id": "June_17,_2026_0",
      "date": "June 17, 2026",
      "type": "Feature",
      "html": "<p>Autonomous embedding generation is GA...</p>",
      "clean_desc": "Autonomous embedding generation is GA...",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_17_2026",
      "tweet_text": "Google Cloud BigQuery Update [June 17, 2026] - Feature: Autonomous embedding generation is GA..."
    }
  ]
}
```
