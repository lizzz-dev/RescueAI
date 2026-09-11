"""
Seeds the database with synthetic demo data: resources, hospitals, and one
demo user per role. Safe to re-run - it wipes and recreates seed tables only
(incidents/plans/logs created during a demo session are left alone unless
--full-reset is passed).
"""
import sys

from database import Base, engine, SessionLocal
import models

# Karachi-area synthetic coordinates for the map demo. These do NOT represent
# real emergency resources or hospitals.
RESOURCES = [
    {"name": "Rescue Team Alpha", "resource_type": "Search & Rescue Team", "latitude": 24.8615, "longitude": 67.0099,
     "capabilities": ["heavy rescue", "confined space"], "equipment": ["cutting tools", "thermal camera"], "capacity": 6, "organization": "Sindh SAR"},
    {"name": "Rescue Team Bravo", "resource_type": "Rescue Team", "latitude": 24.8925, "longitude": 67.0300,
     "capabilities": ["water rescue"], "equipment": ["inflatable boat"], "capacity": 5, "organization": "Sindh SAR"},
    {"name": "Ambulance 01", "resource_type": "Ambulance", "latitude": 24.8550, "longitude": 67.0250,
     "capabilities": ["basic life support"], "equipment": ["stretcher", "oxygen"], "capacity": 2, "organization": "Edhi Foundation (demo)"},
    {"name": "Ambulance 02", "resource_type": "Ambulance", "latitude": 24.8700, "longitude": 67.0400,
     "capabilities": ["advanced life support"], "equipment": ["defibrillator"], "capacity": 2, "organization": "Chhipa (demo)"},
    {"name": "Ambulance 03", "resource_type": "Ambulance", "latitude": 24.8590, "longitude": 67.0050,
     "capabilities": ["advanced life support"], "equipment": ["defibrillator", "ventilator"], "capacity": 2, "organization": "Edhi Foundation (demo)"},
    {"name": "Fire Unit 01", "resource_type": "Fire Unit", "latitude": 24.8480, "longitude": 67.0180,
     "capabilities": ["structural fire"], "equipment": ["ladder truck"], "capacity": 8, "organization": "Karachi Fire Brigade (demo)"},
    {"name": "Fire Unit 02", "resource_type": "Fire Unit", "latitude": 24.8650, "longitude": 67.0130,
     "capabilities": ["structural fire", "hazmat"], "equipment": ["foam unit"], "capacity": 8, "organization": "Karachi Fire Brigade (demo)"},
    {"name": "Medical Team 01", "resource_type": "Medical Team", "latitude": 24.8620, "longitude": 67.0200,
     "capabilities": ["triage", "trauma care"], "equipment": ["field kits"], "capacity": 4, "organization": "Provincial Health Dept (demo)"},
    {"name": "Heavy Rescue Unit 01", "resource_type": "Heavy Rescue Equipment", "latitude": 24.8555, "longitude": 67.0090,
     "capabilities": ["debris removal", "structural shoring"], "equipment": ["hydraulic jacks", "crane"], "capacity": 3, "organization": "NDMA (demo)"},
    {"name": "Water Tanker 01", "resource_type": "Water Tanker", "latitude": 24.8800, "longitude": 67.0350,
     "capabilities": ["potable water delivery"], "equipment": [], "capacity": 1, "organization": "KWSB (demo)"},
    {"name": "Shelter Unit Clifton", "resource_type": "Shelter", "latitude": 24.8138, "longitude": 67.0299,
     "capabilities": ["temporary housing"], "equipment": ["tents", "bedding"], "capacity": 200, "organization": "Provincial Disaster Mgmt (demo)"},
    {"name": "Utility Team 01", "resource_type": "Utility Team", "latitude": 24.8670, "longitude": 67.0210,
     "capabilities": ["gas/electric isolation"], "equipment": [], "capacity": 4, "organization": "K-Electric / SSGC (demo)"},
    {"name": "Food Supply Unit 01", "resource_type": "Food Supply", "latitude": 24.8900, "longitude": 67.0500,
     "capabilities": ["emergency food distribution"], "equipment": [], "capacity": 500, "organization": "Provincial Disaster Mgmt (demo)"},
]

HOSPITALS = [
    {"name": "Hospital Bravo (demo)", "latitude": 24.8570, "longitude": 67.0120, "emergency_beds": 30, "icu_beds": 8, "trauma_capacity": "HIGH", "current_load": 12},
    {"name": "Civic General Hospital (demo)", "latitude": 24.8790, "longitude": 67.0440, "emergency_beds": 20, "icu_beds": 4, "trauma_capacity": "MEDIUM", "current_load": 15},
    {"name": "Clifton Medical Center (demo)", "latitude": 24.8130, "longitude": 67.0310, "emergency_beds": 15, "icu_beds": 3, "trauma_capacity": "MEDIUM", "current_load": 6},
    {"name": "North District Hospital (demo)", "latitude": 24.9300, "longitude": 67.0800, "emergency_beds": 25, "icu_beds": 5, "trauma_capacity": "LOW", "current_load": 20},
]

USERS = [
    {"name": "Tariq Malik", "email": "tariq.commander@demo.rescueai", "role": "COMMANDER"},
    {"name": "Sana Malik", "email": "sana.dispatcher@demo.rescueai", "role": "DISPATCHER"},
    {"name": "Bilal Ahmed", "email": "bilal.admin@demo.rescueai", "role": "ADMIN"},
    {"name": "Ayesha Raza", "email": "ayesha.field@demo.rescueai", "role": "FIELD_RESPONDER"},
    {"name": "Dr. Farooq", "email": "farooq.hospital@demo.rescueai", "role": "HOSPITAL_COORDINATOR"},
    {"name": "Guest Viewer", "email": "guest.viewer@demo.rescueai", "role": "VIEWER"},
]


def seed(full_reset: bool = False):
    if full_reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(models.Resource).count() == 0:
            for r in RESOURCES:
                db.add(models.Resource(**r))
        if db.query(models.Hospital).count() == 0:
            for h in HOSPITALS:
                db.add(models.Hospital(**h))
        if db.query(models.User).count() == 0:
            for u in USERS:
                db.add(models.User(**u))
        db.commit()
        print(f"Seeded {len(RESOURCES)} resources, {len(HOSPITALS)} hospitals, {len(USERS)} users.")
    finally:
        db.close()


if __name__ == "__main__":
    seed(full_reset="--full-reset" in sys.argv)
