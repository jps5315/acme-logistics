import json
import logging
import os
import uuid
from datetime import datetime
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, HTTPException, Security, Query
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import google.generativeai as genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY = os.getenv("API_KEY", "acme-secret-key-2024")

# ── Gemini Client ─────────────────────────────────────────────────────────────
GEMINI_PROMPT_TEMPLATE = """\
You are a logistics sales analyst. Based on the following carrier call KPIs, provide 3-5 concise, actionable insights and recommendations for the sales team.

KPIs:
- Total calls: {total_calls}
- Success rate: {success_rate_pct}%
- Total gross profit: ${total_gross_profit}
- Avg gross profit margin: {avg_gross_profit_margin}%
- Deal outcomes: {outcomes}
- Carrier sentiments: {sentiments}

Respond in plain text with bullet points. Be specific and actionable."""


class GeminiClient:
    def __init__(self, api_key: str | None):
        if not api_key:
            logger.warning(
                "GEMINI_API_KEY is not set. AI insights will be unavailable."
            )
            self._model = None
        else:
            if genai is None:
                logger.warning(
                    "google-generativeai package is not installed. AI insights will be unavailable."
                )
                self._model = None
            else:
                genai.configure(api_key=api_key)
                self._model = genai.GenerativeModel("gemini-1.5-flash")

    async def generate_insights(self, kpi_context: dict) -> str | None:
        if self._model is None:
            return None
        try:
            prompt = GEMINI_PROMPT_TEMPLATE.format(**kpi_context)
            response = await self._model.generate_content_async(prompt)
            return response.text
        except Exception as exc:
            logger.error("Gemini API call failed: %s", exc)
            return None


gemini_client = GeminiClient(os.getenv("GEMINI_API_KEY"))

API_KEY_NAME = "X-API-Key"
DATA_DIR = Path(os.getenv("DATA_DIR", str(Path(__file__).parent / "data")))
DATA_DIR.mkdir(parents=True, exist_ok=True)  # ensure directory exists on startup

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

app = FastAPI(
    title="Acme Logistics API",
    description="Load search, booking confirmation, and call metrics for Acme Logistics inbound carrier sales.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────
async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return api_key

# ── Data helpers ──────────────────────────────────────────────────────────────
def load_json(filename: str):
    path = DATA_DIR / filename
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)

def save_json(filename: str, data):
    path = DATA_DIR / filename
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)

# ── Models ────────────────────────────────────────────────────────────────────
class BookingRequest(BaseModel):
    load_id: str
    agreed_rate: float
    carrier_mc: str
    transfer_status: Optional[str] = None

class CallResult(BaseModel):
    session_id: Optional[str] = None
    mc_number: Optional[str] = None
    carrier_name: Optional[str] = None
    load_id: Optional[str] = None
    agreed_price: Optional[float] = None
    loadboard_rate: Optional[float] = None
    deal_outcome: Optional[str] = None        # successful | failed | could do better
    customer_sentiment: Optional[str] = None  # happy | unsatisfied | interested
    gross_profit: Optional[float] = None
    gross_profit_margin: Optional[float] = None
    call_summary: Optional[str] = None
    notes: Optional[str] = None
    transcript: Optional[str] = None
    call_duration: Optional[float] = None
    timestamp: Optional[str] = None

# ── Loads ─────────────────────────────────────────────────────────────────────
@app.get("/loads/search")
async def search_loads(
    origin: Optional[str] = Query(None),
    equipment_type: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    api_key: str = Security(verify_api_key),
):
    """Search for loads matching carrier preferences."""
    loads = load_json("loads.json")
    results = loads

    if origin:
        origin_state = origin.strip().split(",")[-1].strip().upper()
        origin_city = origin.strip().split(",")[0].strip().lower()
        results = [
            l for l in results
            if origin_city in l["origin"].lower()
            or origin_state in l["origin"].upper()
        ]

    if equipment_type:
        eq = equipment_type.strip().lower()
        results = [l for l in results if eq in l["equipment_type"].lower()]

    if destination:
        dest_lower = destination.strip().lower()
        results = [
            l for l in results
            if dest_lower in l["destination"].lower()
        ]

    # Sort by loadboard_rate descending (best revenue first)
    results = sorted(results, key=lambda x: x["loadboard_rate"], reverse=True)

    return {"loads": results[:5], "total": len(results)}


@app.get("/loads")
async def list_loads(api_key: str = Security(verify_api_key)):
    """List all available loads."""
    loads = load_json("loads.json")
    return {"loads": loads, "total": len(loads)}


# ── Bookings ──────────────────────────────────────────────────────────────────
@app.post("/bookings/confirm")
async def confirm_booking(
    booking: BookingRequest,
    api_key: str = Security(verify_api_key),
):
    """Confirm a load booking after deal is agreed."""
    bookings = load_json("bookings.json")
    entry = {
        "booking_id": str(uuid.uuid4()),
        "load_id": booking.load_id,
        "agreed_rate": booking.agreed_rate,
        "carrier_mc": booking.carrier_mc,
        "booked_at": datetime.utcnow().isoformat(),
        "status": "confirmed",
    }
    bookings.append(entry)
    save_json("bookings.json", bookings)
    return {
        "success": True,
        "booking_id": entry["booking_id"],
        "message": "Transfer was successful and now you can wrap up the conversation.",
    }


# ── Call Results (from HappyRobot webhook) ────────────────────────────────────
@app.post("/calls/result")
async def receive_call_result(
    result: CallResult,
    api_key: str = Security(verify_api_key),
):
    """Receive extracted call data from HappyRobot after each call ends."""
    calls = load_json("call_results.json")
    entry = result.dict()
    entry["id"] = str(uuid.uuid4())
    entry["received_at"] = datetime.utcnow().isoformat()
    if not entry.get("timestamp"):
        entry["timestamp"] = entry["received_at"]
    calls.append(entry)
    save_json("call_results.json", calls)
    return {"success": True, "id": entry["id"]}


# ── Metrics ───────────────────────────────────────────────────────────────────
@app.get("/metrics")
async def get_metrics(api_key: str = Security(verify_api_key)):
    """Aggregate call metrics for the dashboard."""
    calls = load_json("call_results.json")

    total_calls = len(calls)
    if total_calls == 0:
        return _empty_metrics()

    # Outcome counts
    outcomes = {"successful": 0, "failed": 0, "could do better": 0, "unknown": 0}
    sentiments = {"happy": 0, "unsatisfied": 0, "interested": 0, "unknown": 0}
    agreed_prices = []
    loadboard_rates = []
    durations = []

    gross_profits = []
    gross_profit_margins = []

    for c in calls:
        outcome = (c.get("deal_outcome") or "unknown").lower().strip()
        outcomes[outcome] = outcomes.get(outcome, 0) + 1

        sentiment = (c.get("customer_sentiment") or "unknown").lower().strip()
        sentiments[sentiment] = sentiments.get(sentiment, 0) + 1

        if c.get("agreed_price"):
            try:
                agreed_prices.append(float(c["agreed_price"]))
            except (ValueError, TypeError):
                pass

        if c.get("loadboard_rate"):
            try:
                loadboard_rates.append(float(c["loadboard_rate"]))
            except (ValueError, TypeError):
                pass

        if c.get("call_duration"):
            try:
                durations.append(float(c["call_duration"]))
            except (ValueError, TypeError):
                pass

        if c.get("gross_profit") is not None:
            try:
                gross_profits.append(float(c["gross_profit"]))
            except (ValueError, TypeError):
                pass

        if c.get("gross_profit_margin") is not None:
            try:
                gross_profit_margins.append(float(c["gross_profit_margin"]))
            except (ValueError, TypeError):
                pass

    success_rate = round((outcomes.get("successful", 0) / total_calls) * 100, 1)
    avg_agreed = round(sum(agreed_prices) / len(agreed_prices), 2) if agreed_prices else 0
    avg_loadboard = round(sum(loadboard_rates) / len(loadboard_rates), 2) if loadboard_rates else 0
    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0
    price_vs_loadboard_pct = round(((avg_agreed - avg_loadboard) / avg_loadboard) * 100, 1) if avg_loadboard else 0
    total_gross_profit = round(sum(gross_profits), 2) if gross_profits else 0
    avg_gross_profit_margin = round(sum(gross_profit_margins) / len(gross_profit_margins), 1) if gross_profit_margins else 0.0

    # Calls over time (by day)
    from collections import defaultdict
    calls_by_day = defaultdict(int)
    for c in calls:
        ts = c.get("timestamp") or c.get("received_at", "")
        day = ts[:10] if ts else "unknown"
        calls_by_day[day] += 1

    calls_over_time = [{"date": d, "count": v} for d, v in sorted(calls_by_day.items())]

    # Recent calls (last 10)
    recent = sorted(calls, key=lambda x: x.get("received_at", ""), reverse=True)[:10]

    # AI insights from Gemini
    try:
        ai_insights = await gemini_client.generate_insights({
            "total_calls": total_calls,
            "success_rate_pct": success_rate,
            "total_gross_profit": total_gross_profit,
            "avg_gross_profit_margin": avg_gross_profit_margin,
            "outcomes": outcomes,
            "sentiments": sentiments,
        })
    except Exception as exc:
        logger.error("Gemini insights call failed: %s", exc)
        ai_insights = None

    return {
        "summary": {
            "total_calls": total_calls,
            "success_rate_pct": success_rate,
            "avg_agreed_rate": avg_agreed,
            "avg_loadboard_rate": avg_loadboard,
            "price_vs_loadboard_pct": price_vs_loadboard_pct,
            "avg_call_duration_secs": avg_duration,
            "total_gross_profit": total_gross_profit,
            "avg_gross_profit_margin": avg_gross_profit_margin,
        },
        "outcomes": outcomes,
        "sentiments": sentiments,
        "calls_over_time": calls_over_time,
        "recent_calls": recent,
        "ai_insights": ai_insights,
    }


def _empty_metrics():
    return {
        "summary": {
            "total_calls": 0,
            "success_rate_pct": 0,
            "avg_agreed_rate": 0,
            "avg_loadboard_rate": 0,
            "price_vs_loadboard_pct": 0,
            "avg_call_duration_secs": 0,
            "total_gross_profit": 0,
            "avg_gross_profit_margin": 0.0,
        },
        "outcomes": {"successful": 0, "failed": 0, "could do better": 0, "unknown": 0},
        "sentiments": {"happy": 0, "unsatisfied": 0, "interested": 0, "unknown": 0},
        "calls_over_time": [],
        "recent_calls": [],
        "ai_insights": None,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Acme Logistics API", "version": "1.0.0"}
