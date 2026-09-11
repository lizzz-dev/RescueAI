"""
seed_pakistan.py — One-shot nationwide data seeder for RescueAI.

Run from the backend/ directory:
    python seed_pakistan.py

Clears existing data and inserts ~70 incidents, ~80 hospitals, ~250 resources
spread across 25+ Pakistani cities with real GPS coordinates.
"""

import random
import uuid
from datetime import datetime, timedelta

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
from models import (
    Incident, IncidentReport, Hospital, Resource,
    ResourceAssignment, ResponsePlan, Notification, AuditLog,
)

# ---------------------------------------------------------------------------
# Pakistani cities with real coordinates
# ---------------------------------------------------------------------------
CITIES = {
    "Karachi":              (24.8607, 67.0011),
    "Lahore":               (31.5497, 74.3436),
    "Islamabad":            (33.6844, 73.0479),
    "Rawalpindi":           (33.5651, 73.0169),
    "Faisalabad":           (31.4187, 73.0791),
    "Multan":               (30.1575, 71.5249),
    "Peshawar":             (34.0151, 71.5249),
    "Quetta":               (30.1798, 66.9750),
    "Hyderabad":            (25.3960, 68.3578),
    "Sialkot":              (32.4945, 74.5229),
    "Gujranwala":           (32.1877, 74.1945),
    "Bahawalpur":           (29.3956, 71.6836),
    "Sargodha":             (32.0836, 72.6711),
    "Sukkur":               (27.7052, 68.8574),
    "Mardan":               (34.1988, 72.0404),
    "Abbottabad":           (34.1688, 73.2215),
    "Gilgit":               (35.9208, 74.3144),
    "Skardu":               (35.2971, 75.6335),
    "Gwadar":               (25.1264, 62.3225),
    "Turbat":               (26.0031, 63.0544),
    "Muzaffarabad":         (34.3590, 73.4714),
    "Swat":                 (35.2227, 72.4258),
    "Dera Ismail Khan":     (31.8626, 70.9019),
    "Dera Ghazi Khan":      (30.0489, 70.6455),
    "Larkana":              (27.5570, 68.2028),
    "Nawabshah":            (26.2442, 68.4100),
    "Kohat":                (33.5869, 71.4414),
    "Mirpur Khas":          (25.5276, 69.0159),
    "Khuzdar":              (27.8000, 66.6167),
}

CITY_NAMES = list(CITIES.keys())

# ---------------------------------------------------------------------------
# Incident templates
# ---------------------------------------------------------------------------
INCIDENT_TYPES = [
    "Building Collapse",
    "Fire",
    "Electrical Fire",
    "Flood Emergency",
    "Landslide",
    "Road Traffic Accident",
    "Gas Leak",
    "Heatwave Emergency",
    "Industrial Accident",
    "Medical Emergency",
    "Water Rescue",
    "Urban Search and Rescue",
]

LOCATIONS_IN_CITY = [
    "Main Market", "Hospital Road", "University Road", "Commercial Area",
    "Industrial Area", "Residential Block", "Bus Terminal", "Railway Area",
    "Old City Area", "Bypass Road", "City Center", "Central Mall",
    "Main Road", "GT Road", "Canal Road",
]

SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
STATUSES = ["NEW", "DISPATCHED", "RESOLVED"]
STATUS_WEIGHTS = [0.50, 0.20, 0.30]  # 50% NEW, 20% DISPATCHED, 30% RESOLVED

SOURCE_TYPES = ["FIELD_OFFICER", "VERIFIED_ORG", "EMERGENCY_OPERATOR", "CITIZEN", "SOCIAL_MEDIA"]
RELIABILITIES = {"FIELD_OFFICER": "HIGH", "VERIFIED_ORG": "HIGH", "EMERGENCY_OPERATOR": "HIGH", "CITIZEN": "MEDIUM", "SOCIAL_MEDIA": "LOW"}

HAZARD_POOL = [
    "Structural instability", "Gas leak", "Live electrical wires",
    "Chemical spill", "Fire spread risk", "Flooding",
    "Road blockage", "Crowd surge", "Aftershock risk",
    "Toxic fumes", "Debris field", "Extreme heat",
]

DESCRIPTIONS = {
    "Building Collapse": [
        "A multi-story residential building has partially collapsed. Multiple people are believed to be trapped under rubble.",
        "Commercial structure collapse reported. Emergency teams needed for search and rescue operations.",
        "Roof of a warehouse has caved in during work hours. Workers may be trapped inside.",
    ],
    "Fire": [
        "Large fire engulfing a commercial building. Smoke visible from several kilometers away. Multiple floors affected.",
        "Residential fire reported with people trapped on upper floors. Fire spreading to adjacent buildings.",
        "Market area fire affecting multiple shops. Inflammable materials stored nearby pose explosion risk.",
    ],
    "Electrical Fire": [
        "Electrical transformer explosion caused a fire in a residential neighborhood. Power lines down.",
        "Short circuit in industrial machinery started a fire. Workers evacuating the premises.",
        "Electricity substation fire. Nearby residential areas at risk. Power outages reported.",
    ],
    "Flood Emergency": [
        "Flash flooding after heavy rains. Roads submerged, vehicles stranded. Multiple families need evacuation.",
        "River banks breached. Water entering residential areas. Immediate evacuation required.",
        "Severe urban flooding. Underground markets and basements flooded. People trapped in vehicles.",
    ],
    "Landslide": [
        "Major landslide blocking the main highway. Several vehicles buried. Rescue teams needed urgently.",
        "Hillside collapse after heavy rains. Houses at the base damaged. Families need immediate rescue.",
        "Road collapsed due to land erosion. Traffic stranded on both sides. Engineers needed.",
    ],
    "Road Traffic Accident": [
        "Multi-vehicle collision on the highway. Bus and truck involved. Multiple casualties reported.",
        "Passenger van overturned on a mountain road. Passengers injured, some critically.",
        "Motorcycle-rickshaw collision at a busy intersection. Injured persons need medical attention.",
    ],
    "Gas Leak": [
        "Major gas pipeline leak in a residential area. Residents being evacuated. Fire risk is high.",
        "Industrial gas leak. Workers experiencing breathing difficulties. Area cordoned off.",
        "LPG cylinder explosion in a restaurant. Adjacent buildings at risk. Multiple injuries.",
    ],
    "Heatwave Emergency": [
        "Severe heatwave affecting outdoor workers and elderly. Multiple heatstroke cases reported.",
        "Temperature exceeding 48°C. Emergency cooling centers needed. Hospital ICUs filling up.",
        "Mass heatstroke event at a public gathering. Medical teams overwhelmed.",
    ],
    "Industrial Accident": [
        "Explosion at a chemical plant. Toxic fumes spreading. Workers injured, evacuation underway.",
        "Factory machinery malfunction causing multiple injuries. Workers trapped in equipment.",
        "Boiler explosion at a textile mill. Significant casualties feared. Fire crews responding.",
    ],
    "Medical Emergency": [
        "Mass food poisoning incident at a wedding. Over 30 people need medical attention.",
        "Disease outbreak in a densely populated neighborhood. Emergency medical camp needed.",
        "Multiple cardiac emergencies at a public event. Medical teams overwhelmed.",
    ],
    "Water Rescue": [
        "Boat capsized in the river with 12 passengers onboard. Coast guard alerted.",
        "Children swept away in flash flood waters. Urgent water rescue team needed.",
        "Fishermen stranded due to sudden storm. Rescue boats deployed.",
    ],
    "Urban Search and Rescue": [
        "Building partially collapsed after an earthquake tremor. People trapped under rubble.",
        "Underground construction site cave-in. Workers missing. Heavy equipment needed.",
        "Old heritage building collapse. Bystanders and residents may be trapped.",
    ],
}

HOSPITAL_PREFIXES = [
    "General Hospital", "Central Hospital", "Medical Center", "Trauma Center",
    "District Hospital", "Civil Hospital", "Teaching Hospital", "Military Hospital",
    "Children's Hospital", "Women's Hospital",
]

RESOURCE_ORGS = ["PDMA", "Rescue 1122", "Edhi Foundation", "Chippa Foundation", "Pakistan Army", "NDMA", "City Fire Brigade"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def gen_id():
    return str(uuid.uuid4())

def jitter(base, spread=0.03):
    """Add small random offset to coordinates so pins don't stack."""
    return base + random.uniform(-spread, spread)

def random_past_date(days_back=30):
    """Random datetime within the last N days."""
    delta = timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )
    return datetime.utcnow() - delta

# ---------------------------------------------------------------------------
# Seeder
# ---------------------------------------------------------------------------
def seed():
    db = SessionLocal()

    print("[*] Clearing existing data...")
    db.query(ResourceAssignment).delete()
    db.query(IncidentReport).delete()
    db.query(ResponsePlan).delete()
    db.query(AuditLog).delete()
    db.query(Notification).delete()
    db.query(Incident).delete()
    db.query(Hospital).delete()
    db.query(Resource).delete()
    db.commit()

    # -----------------------------------------------------------------------
    # 1) INCIDENTS (~70)
    # -----------------------------------------------------------------------
    print("[+] Seeding incidents...")
    incidents_created = []

    for _ in range(70):
        city = random.choice(CITY_NAMES)
        lat_base, lon_base = CITIES[city]
        inc_type = random.choice(INCIDENT_TYPES)
        area = random.choice(LOCATIONS_IN_CITY)
        location = f"{area}, {city}"
        severity = random.choices(SEVERITIES, weights=[15, 25, 40, 20], k=1)[0]
        status = random.choices(STATUSES, weights=STATUS_WEIGHTS, k=1)[0]
        descriptions_for_type = DESCRIPTIONS.get(inc_type, DESCRIPTIONS["Fire"])
        description = random.choice(descriptions_for_type)
        victims_min = random.randint(1, 10)
        victims_max = victims_min + random.randint(0, 15)
        num_hazards = random.randint(0, 3)
        hazards = random.sample(HAZARD_POOL, min(num_hazards, len(HAZARD_POOL)))
        created_at = random_past_date(21)

        inc = Incident(
            id=gen_id(),
            incident_type=inc_type,
            description=description,
            location=location,
            latitude=jitter(lat_base),
            longitude=jitter(lon_base),
            severity=severity,
            estimated_victims_min=victims_min,
            estimated_victims_max=victims_max,
            hazards=hazards,
            status=status,
            confidence={"incident_classification": round(random.uniform(0.7, 0.98), 2)},
            conflicting_info=random.random() < 0.15,
            conflict_notes="Multiple sources report differing victim counts." if random.random() < 0.15 else None,
            created_at=created_at,
            updated_at=created_at + timedelta(minutes=random.randint(5, 120)),
        )
        db.add(inc)
        incidents_created.append(inc)

        # Add one report per incident
        source = random.choice(SOURCE_TYPES)
        report = IncidentReport(
            id=gen_id(),
            incident_id=inc.id,
            raw_text=description,
            source_type=source,
            reliability=RELIABILITIES[source],
            extracted_victims=victims_max,
            created_at=created_at,
        )
        db.add(report)

    db.commit()
    print(f"   OK {len(incidents_created)} incidents created")

    # -----------------------------------------------------------------------
    # 2) HOSPITALS (~80)
    # -----------------------------------------------------------------------
    print("[+] Seeding hospitals...")
    hospitals_created = 0

    # Distribute hospitals: big cities get more
    big_cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Faisalabad", "Quetta", "Multan", "Hyderabad"]
    small_cities = [c for c in CITY_NAMES if c not in big_cities]

    hospital_id_counter = 1
    for city in big_cities:
        lat_base, lon_base = CITIES[city]
        count = random.randint(4, 6)
        for i in range(count):
            prefix = HOSPITAL_PREFIXES[i % len(HOSPITAL_PREFIXES)]
            h = Hospital(
                id=gen_id(),
                name=f"{city} {prefix}",
                latitude=jitter(lat_base, 0.02),
                longitude=jitter(lon_base, 0.02),
                emergency_beds=random.randint(15, 80),
                icu_beds=random.randint(5, 30),
                trauma_capacity=random.choice(["LOW", "MEDIUM", "HIGH"]),
                current_load=random.randint(5, 60),
                status="OPERATIONAL",
            )
            db.add(h)
            hospitals_created += 1
            hospital_id_counter += 1

    for city in small_cities:
        lat_base, lon_base = CITIES[city]
        count = random.randint(1, 3)
        for i in range(count):
            prefix = HOSPITAL_PREFIXES[i % len(HOSPITAL_PREFIXES)]
            h = Hospital(
                id=gen_id(),
                name=f"{city} {prefix}",
                latitude=jitter(lat_base, 0.02),
                longitude=jitter(lon_base, 0.02),
                emergency_beds=random.randint(10, 40),
                icu_beds=random.randint(3, 15),
                trauma_capacity=random.choice(["LOW", "MEDIUM"]),
                current_load=random.randint(2, 25),
                status="OPERATIONAL",
            )
            db.add(h)
            hospitals_created += 1

    db.commit()
    print(f"   OK {hospitals_created} hospitals created")

    # -----------------------------------------------------------------------
    # 3) RESOURCES (~250)
    # -----------------------------------------------------------------------
    print("[+] Seeding resources...")
    resources_created = 0

    resource_configs = [
        ("Ambulance", 120, ["Basic Life Support", "Advanced Life Support", "Patient transport"],
         ["Defibrillator", "Stretcher", "Oxygen tank", "First aid kit"]),
        ("Rescue Team", 70, ["Search and Rescue", "Rope rescue", "Confined space rescue", "Water rescue"],
         ["Hydraulic cutters", "Thermal camera", "Search dogs", "Rope gear", "Breathing apparatus"]),
        ("Fire Unit", 60, ["Structural firefighting", "Hazmat response", "Vehicle extrication"],
         ["Fire engine", "Ladder truck", "Foam unit", "Hazmat suit", "Thermal imaging"]),
    ]

    for rtype, total, capabilities_pool, equipment_pool in resource_configs:
        counter = 1
        for _ in range(total):
            city = random.choice(CITY_NAMES)
            lat_base, lon_base = CITIES[city]
            org = random.choice(RESOURCE_ORGS)

            # Status distribution: 80% available, 15% dispatched, 5% OOS
            status_roll = random.random()
            if status_roll < 0.80:
                status = "AVAILABLE"
            elif status_roll < 0.95:
                status = "DISPATCHED"
            else:
                status = "OUT_OF_SERVICE"

            r = Resource(
                id=gen_id(),
                name=f"{city} {rtype} {counter:03d}",
                resource_type=rtype,
                status=status,
                latitude=jitter(lat_base, 0.015),
                longitude=jitter(lon_base, 0.015),
                capabilities=random.sample(capabilities_pool, min(random.randint(1, 3), len(capabilities_pool))),
                equipment=random.sample(equipment_pool, min(random.randint(2, 4), len(equipment_pool))),
                capacity=random.randint(1, 4) if rtype == "Ambulance" else random.randint(4, 12),
                current_workload=1 if status == "DISPATCHED" else 0,
                organization=org,
            )
            db.add(r)
            resources_created += 1
            counter += 1

    db.commit()
    print(f"   OK {resources_created} resources created")

    # -----------------------------------------------------------------------
    # 4) AUDIT LOGS (seed a few)
    # -----------------------------------------------------------------------
    print("[+] Seeding audit logs...")
    for inc in random.sample(incidents_created, min(20, len(incidents_created))):
        db.add(AuditLog(
            id=gen_id(),
            incident_id=inc.id,
            actor="AI_SYSTEM",
            action="INCIDENT_CREATED",
            details={"incident_type": inc.incident_type},
            created_at=inc.created_at,
        ))
    db.commit()
    print("   OK Audit logs created")

    # -----------------------------------------------------------------------
    # Done
    # -----------------------------------------------------------------------
    db.close()
    print()
    print("=" * 50)
    print("SEEDING COMPLETE!")
    print(f"   Incidents:  {len(incidents_created)}")
    print(f"   Hospitals:  {hospitals_created}")
    print(f"   Resources:  {resources_created}")
    print("=" * 50)


if __name__ == "__main__":
    seed()
