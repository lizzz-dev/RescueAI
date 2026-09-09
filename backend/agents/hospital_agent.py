"""
AGENT 4: Hospital Coordination Agent

Scores operational hospitals on bed availability, ICU capacity, trauma
capability, current load, and distance - to recommend where victims should
be routed, not simply the closest hospital.
"""
from agents.resource_agent import _haversine_km

TRAUMA_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


def recommend_hospitals(incident_lat, incident_lon, severity: str, estimated_victims: int, hospitals: list, top_n=3):
    operational = [h for h in hospitals if h.status == "OPERATIONAL"]
    scored = []
    for h in operational:
        distance = _haversine_km(incident_lat, incident_lon, h.latitude, h.longitude)
        load_ratio = h.current_load / max(1, (h.emergency_beds + h.icu_beds))
        trauma_score = TRAUMA_RANK.get(h.trauma_capacity, 1)

        # Weighted score: lower is better. Trauma capability matters most for
        # CRITICAL/HIGH severity; distance matters more for LOW/MEDIUM.
        if severity in ("CRITICAL", "HIGH"):
            score = (distance * 0.4) + (load_ratio * 30) - (trauma_score * 15) - (h.icu_beds * 0.5)
        else:
            score = (distance * 0.7) + (load_ratio * 15) - (trauma_score * 5)

        scored.append((score, h, distance, load_ratio))

    scored.sort(key=lambda x: x[0])
    top = scored[:top_n]

    if not top:
        return {"recommended": None, "alternatives": [], "confidence": {"hospital_recommendation": 0.0},
                "gap": "No operational hospital found."}

    def describe(h, distance, load_ratio):
        return {
            "id": h.id,
            "name": h.name,
            "distance_km": round(distance, 2),
            "emergency_beds": h.emergency_beds,
            "icu_beds": h.icu_beds,
            "trauma_capacity": h.trauma_capacity,
            "current_load": h.current_load,
            "reason": (
                f"{round(distance, 1)} km away, trauma capacity {h.trauma_capacity}, "
                f"{h.icu_beds} ICU beds, current load {int(load_ratio * 100)}%."
            ),
        }

    best_score, best_h, best_d, best_l = top[0]
    recommended = describe(best_h, best_d, best_l)
    alternatives = [describe(h, d, l) for score, h, d, l in top[1:]]

    confidence = 0.9 if best_h.icu_beds > 0 or severity not in ("CRITICAL", "HIGH") else 0.7

    return {
        "recommended": recommended,
        "alternatives": alternatives,
        "confidence": {"hospital_recommendation": round(confidence, 2)},
    }
