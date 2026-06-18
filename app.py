import os
import re
import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache
cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION = 300  # 5 minutes

def clean_text(html_text):
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_feed(force=False):
    now = time.time()
    if not force and cache["data"] and (now - cache["last_fetched"] < CACHE_DURATION):
        return cache["data"]
        
    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        xml_content = response.content
    except Exception as e:
        if cache["data"]:
            return cache["data"]
        raise e

    root = ET.fromstring(xml_content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    for entry_el in root.findall('atom:entry', ns):
        title_el = entry_el.find('atom:title', ns)
        date_str = title_el.text.strip() if title_el is not None else "Unknown Date"
        
        updated_el = entry_el.find('atom:updated', ns)
        updated_str = updated_el.text.strip() if updated_el is not None else ""
        
        link_el = entry_el.find('atom:link', ns)
        link_href = ""
        if link_el is not None:
            link_href = link_el.attrib.get('href', '')
            
        content_el = entry_el.find('atom:content', ns)
        content_html = content_el.text if content_el is not None else ""
        
        # Split by <h3> headings
        parts = re.split(r'(<h3>.*?</h3>)', content_html)
        
        sections = []
        if parts[0].strip():
            sections.append({
                "type": "General",
                "html": parts[0].strip()
            })
            
        for i in range(1, len(parts), 2):
            h3_text = parts[i]
            type_match = re.search(r'<h3>(.*?)</h3>', h3_text)
            type_str = type_match.group(1).strip() if type_match else "Update"
            
            body_html = parts[i+1].strip() if i+1 < len(parts) else ""
            
            sections.append({
                "type": type_str,
                "html": body_html
            })
            
        for idx, sec in enumerate(sections):
            item_id = f"{date_str.replace(' ', '_')}_{idx}"
            clean_desc = clean_text(sec["html"])
            
            # Truncate description for Twitter
            tweet_desc = clean_desc
            if len(tweet_desc) > 130:
                tweet_desc = tweet_desc[:127] + "..."
                
            tweet_text = f"Google Cloud BigQuery Update [{date_str}] - {sec['type']}: {tweet_desc}"
            
            entries.append({
                "id": item_id,
                "date": date_str,
                "updated": updated_str,
                "type": sec["type"],
                "html": sec["html"],
                "clean_desc": clean_desc,
                "link": link_href,
                "tweet_text": tweet_text
            })
            
    cache["data"] = entries
    cache["last_fetched"] = now
    return entries

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def api_releases():
    force = request.args.get("force", "false").lower() == "true"
    try:
        releases = parse_feed(force=force)
        return jsonify({
            "status": "success",
            "releases": releases,
            "cached_at": cache["last_fetched"]
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
