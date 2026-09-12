from fastapi import FastAPI

app = FastAPI(title="RescueAI")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "RescueAI"}
