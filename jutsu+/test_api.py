import time
import json
import requests

APIS = [
    ("Consumet (base)", "https://consumet-api-yij6.onrender.com"),
    ("Consumet (animekai search naruto)", "https://consumet-api-yij6.onrender.com/anime/animekai/naruto?page=1"),
    ("Consumet (animekai search one piece)", "https://consumet-api-yij6.onrender.com/anime/animekai/one%20piece?page=1"),
    ("Consumet (animekai servers ep1)", "https://consumet-api-yij6.onrender.com/anime/animekai/servers/naruto-shippuden-1-episode-1?dub=false"),
]

def check_api(name, url, method="GET", payload=None):
    start = time.time()
    try:
        if method == "POST":
            resp = requests.post(url, json=payload, timeout=10)
        else:
            resp = requests.get(url, timeout=10)
        elapsed = round((time.time() - start) * 1000)
        ok = 200 <= resp.status_code < 300
        try:
            data = resp.json()
            data_ok = True
        except Exception:
            data = resp.text[:200]
            data_ok = False

        return {
            "name": name,
            "status": resp.status_code,
            "ok": ok,
            "json": data_ok,
            "ms": elapsed,
            "sample": data if data_ok else data
        }
    except Exception as e:
        return {"name": name, "status": None, "ok": False, "json": False, "ms": None, "error": str(e)}

def main():
    results = []
    for entry in APIS:
        if len(entry) == 2:
            name, url = entry
            res = check_api(name, url)
        else:
            name, url, method, payload = entry
            res = check_api(name, url, method, payload)
        results.append(res)

    with open("responses.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()