"""
Acme Logistics — Loads API
Standalone, zero-database loads search API.
Deploy to Render / Railway / Fly.io as a single Python file.

Auth: X-API-Key header (set API_KEY env var, default: acme-secret-key-2024)
"""
import os
from fastapi import FastAPI, Query, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

API_KEY     = os.getenv("API_KEY", "acme-secret-key-2024")
api_key_hdr = APIKeyHeader(name="X-API-Key", auto_error=False)

app = FastAPI(title="Acme Logistics — Loads API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

async def auth(key: str = Security(api_key_hdr)):
    if key != API_KEY:
        raise HTTPException(403, "Invalid or missing API key")
    return key

# ── Sample loads database ──────────────────────────────────────────────────────
LOADS = [
    {
        "load_id":           "LD-1001",
        "origin":            "Chicago, IL",
        "destination":       "Dallas, TX",
        "pickup_datetime":   "2026-05-10T08:00:00",
        "delivery_datetime": "2026-05-12T17:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    2850,
        "notes":             "No touch freight. Dock to dock.",
        "weight":            42000,
        "commodity_type":    "Consumer Goods",
        "num_of_pieces":     24,
        "miles":             921,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1002",
        "origin":            "Atlanta, GA",
        "destination":       "Miami, FL",
        "pickup_datetime":   "2026-05-11T10:00:00",
        "delivery_datetime": "2026-05-12T14:00:00",
        "equipment_type":    "reefer",
        "loadboard_rate":    1950,
        "notes":             "Temp: 34F. Produce load. On time delivery critical.",
        "weight":            38000,
        "commodity_type":    "Produce",
        "num_of_pieces":     40,
        "miles":             662,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1003",
        "origin":            "Los Angeles, CA",
        "destination":       "Phoenix, AZ",
        "pickup_datetime":   "2026-05-10T06:00:00",
        "delivery_datetime": "2026-05-10T18:00:00",
        "equipment_type":    "flatbed",
        "loadboard_rate":    1200,
        "notes":             "Tarps required. Steel coils.",
        "weight":            44000,
        "commodity_type":    "Steel",
        "num_of_pieces":     8,
        "miles":             372,
        "dimensions":        "48x102",
        "status":            "available",
    },
    {
        "load_id":           "LD-1004",
        "origin":            "Houston, TX",
        "destination":       "Memphis, TN",
        "pickup_datetime":   "2026-05-12T07:00:00",
        "delivery_datetime": "2026-05-13T12:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    1750,
        "notes":             "Palletized freight. Team driver preferred.",
        "weight":            35000,
        "commodity_type":    "Auto Parts",
        "num_of_pieces":     18,
        "miles":             572,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1005",
        "origin":            "Chicago, IL",
        "destination":       "New York, NY",
        "pickup_datetime":   "2026-05-11T09:00:00",
        "delivery_datetime": "2026-05-12T20:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    3100,
        "notes":             "Residential delivery. Liftgate required.",
        "weight":            28000,
        "commodity_type":    "Electronics",
        "num_of_pieces":     60,
        "miles":             790,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1006",
        "origin":            "Dallas, TX",
        "destination":       "Denver, CO",
        "pickup_datetime":   "2026-05-13T08:00:00",
        "delivery_datetime": "2026-05-14T16:00:00",
        "equipment_type":    "flatbed",
        "loadboard_rate":    2200,
        "notes":             "Oversize load. Permits provided by shipper.",
        "weight":            48000,
        "commodity_type":    "Construction Equipment",
        "num_of_pieces":     2,
        "miles":             781,
        "dimensions":        "53x102",
        "status":            "available",
    },
    {
        "load_id":           "LD-1007",
        "origin":            "Seattle, WA",
        "destination":       "Portland, OR",
        "pickup_datetime":   "2026-05-10T12:00:00",
        "delivery_datetime": "2026-05-10T18:00:00",
        "equipment_type":    "reefer",
        "loadboard_rate":    850,
        "notes":             "Frozen seafood. Temp: 0F.",
        "weight":            22000,
        "commodity_type":    "Seafood",
        "num_of_pieces":     30,
        "miles":             174,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1008",
        "origin":            "Nashville, TN",
        "destination":       "Charlotte, NC",
        "pickup_datetime":   "2026-05-11T11:00:00",
        "delivery_datetime": "2026-05-12T09:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    1400,
        "notes":             "Floor loaded. Straps and load bars required.",
        "weight":            30000,
        "commodity_type":    "Paper Products",
        "num_of_pieces":     50,
        "miles":             409,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1009",
        "origin":            "Phoenix, AZ",
        "destination":       "Las Vegas, NV",
        "pickup_datetime":   "2026-05-10T07:00:00",
        "delivery_datetime": "2026-05-10T13:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    780,
        "notes":             "Hazmat placard required. Class 3.",
        "weight":            18000,
        "commodity_type":    "Chemicals",
        "num_of_pieces":     12,
        "miles":             297,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1010",
        "origin":            "Miami, FL",
        "destination":       "Orlando, FL",
        "pickup_datetime":   "2026-05-12T09:00:00",
        "delivery_datetime": "2026-05-12T13:00:00",
        "equipment_type":    "reefer",
        "loadboard_rate":    620,
        "notes":             "Fresh produce. Temp: 38F.",
        "weight":            15000,
        "commodity_type":    "Produce",
        "num_of_pieces":     20,
        "miles":             235,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1011",
        "origin":            "Denver, CO",
        "destination":       "Kansas City, MO",
        "pickup_datetime":   "2026-05-13T08:00:00",
        "delivery_datetime": "2026-05-14T14:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    1650,
        "notes":             "Palletized. No appointment needed.",
        "weight":            32000,
        "commodity_type":    "Building Materials",
        "num_of_pieces":     36,
        "miles":             602,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1012",
        "origin":            "New York, NY",
        "destination":       "Boston, MA",
        "pickup_datetime":   "2026-05-11T10:00:00",
        "delivery_datetime": "2026-05-11T16:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    950,
        "notes":             "White glove delivery. Two-man team required.",
        "weight":            12000,
        "commodity_type":    "Furniture",
        "num_of_pieces":     8,
        "miles":             215,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1013",
        "origin":            "Memphis, TN",
        "destination":       "St. Louis, MO",
        "pickup_datetime":   "2026-05-12T06:00:00",
        "delivery_datetime": "2026-05-12T12:00:00",
        "equipment_type":    "flatbed",
        "loadboard_rate":    1100,
        "notes":             "Lumber load. Tarps required.",
        "weight":            40000,
        "commodity_type":    "Lumber",
        "num_of_pieces":     1,
        "miles":             284,
        "dimensions":        "48x102",
        "status":            "available",
    },
    {
        "load_id":           "LD-1014",
        "origin":            "Portland, OR",
        "destination":       "San Francisco, CA",
        "pickup_datetime":   "2026-05-13T07:00:00",
        "delivery_datetime": "2026-05-14T18:00:00",
        "equipment_type":    "reefer",
        "loadboard_rate":    1800,
        "notes":             "Wine. Temp controlled. 55F.",
        "weight":            24000,
        "commodity_type":    "Wine",
        "num_of_pieces":     480,
        "miles":             637,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
    {
        "load_id":           "LD-1015",
        "origin":            "Kansas City, MO",
        "destination":       "Chicago, IL",
        "pickup_datetime":   "2026-05-12T12:00:00",
        "delivery_datetime": "2026-05-13T08:00:00",
        "equipment_type":    "dry van",
        "loadboard_rate":    1200,
        "notes":             "Drop and hook. No touch.",
        "weight":            38000,
        "commodity_type":    "Packaged Foods",
        "num_of_pieces":     48,
        "miles":             512,
        "dimensions":        "48x102x96",
        "status":            "available",
    },
]


def _match(load: dict, origin: str, equipment_type: str, destination: str) -> bool:
    """Fuzzy match a load against search params. All params optional."""
    if origin:
        city  = origin.split(",")[0].strip().lower()
        state = origin.split(",")[-1].strip().lower()
        if city  not in load["origin"].lower() and \
           state not in load["origin"].lower():
            return False
    if equipment_type:
        if equipment_type.strip().lower() not in load["equipment_type"].lower():
            return False
    if destination:
        dest = destination.split(",")[0].strip().lower()
        if dest not in load["destination"].lower():
            return False
    return True


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/loads/search", summary="Search available loads (used by HappyRobot agent)")
async def search_loads(
    origin:         Optional[str] = Query(None, description="Carrier's current location, e.g. 'Chicago, IL'"),
    equipment_type: Optional[str] = Query(None, description="Equipment type: dry van | flatbed | reefer"),
    destination:    Optional[str] = Query(None, description="Preferred destination, e.g. 'Dallas, TX'"),
    _key: str = Security(auth),
):
    """
    Search available loads by origin, equipment type, and/or destination.
    Returns up to 5 best-matching loads sorted by rate (highest first).
    All parameters are optional — omit any to broaden the search.
    """
    available = [l for l in LOADS if l["status"] == "available"]
    results   = [l for l in available if _match(l, origin, equipment_type, destination)]

    # Fallback: if no match on all 3, relax to equipment_type only
    if not results and equipment_type:
        results = [l for l in available if _match(l, None, equipment_type, None)]

    # Fallback: if still nothing, return top available loads
    if not results:
        results = available

    results = sorted(results, key=lambda x: x["loadboard_rate"], reverse=True)[:5]
    return {"loads": results, "total": len(results)}


@app.get("/loads", summary="List all loads")
async def list_loads(_key: str = Security(auth)):
    """Returns the full loads database."""
    return {"loads": LOADS, "total": len(LOADS)}


@app.get("/loads/{load_id}", summary="Get a single load by ID")
async def get_load(load_id: str, _key: str = Security(auth)):
    """Fetch a specific load by its ID."""
    load = next((l for l in LOADS if l["load_id"] == load_id), None)
    if not load:
        raise HTTPException(404, f"Load {load_id} not found")
    return load


@app.get("/health")
async def health():
    return {"status": "ok", "loads_count": len(LOADS), "service": "Acme Logistics Loads API"}
