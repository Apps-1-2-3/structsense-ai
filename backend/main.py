"""
StructSense — Local FastAPI backend for Structural Health Monitoring.

Run:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload
"""
from __future__ import annotations

import io
import random
from typing import List

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="StructSense API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO: load your ONNX or PyTorch model here
# Example:
#   import onnxruntime as ort
#   MODEL = ort.InferenceSession("models/structsense.onnx")
MODEL = None


def run_inference(image: Image.Image) -> dict:
    """Placeholder inference. Replace with real model call.

    The mock returns a realistic-looking response so the UI works end-to-end.
    """
    # TODO: replace this block with real preprocessing + model.run(...)
    width, height = image.size
    seed = (width * height) % 7
    random.seed(seed)

    scenarios = [
        {
            "structureType": "Reinforced Concrete Beam",
            "overallHealthScore": 42,
            "healthStatus": "Poor",
            "distressTypes": [
                {"name": "Flexural Cracking", "severity": "High", "confidence": 92, "location": "Mid-span tension zone"},
                {"name": "Concrete Spalling", "severity": "Medium", "confidence": 78, "location": "Bottom cover, near support"},
                {"name": "Rebar Corrosion", "severity": "Medium", "confidence": 71, "location": "Exposed stirrups"},
            ],
            "maintenancePriority": "Immediate",
            "recommendations": [
                "Restrict live loading on the affected span immediately.",
                "Perform crack width mapping and chloride-ion penetration test.",
                "Schedule epoxy injection for cracks < 0.3mm within 7 days.",
                "Apply corrosion-inhibiting coating to exposed reinforcement.",
            ],
            "ndeMethodSuggested": "Ultrasonic Pulse Velocity (UPV) + Half-cell Potentiometer",
            "safetyAlert": True,
            "healthSummary": {
                "conditionSentence": "This beam shows significant flexural distress with active corrosion. Structural intervention is required within 7 days.",
                "loadBearingRisk": "Restricted",
                "inspectionFrequency": "Re-inspect every 30 days until repaired",
            },
        },
        {
            "structureType": "Concrete Column",
            "overallHealthScore": 68,
            "healthStatus": "Moderate",
            "distressTypes": [
                {"name": "Hairline Cracks", "severity": "Low", "confidence": 84, "location": "Vertical, lower third"},
                {"name": "Surface Efflorescence", "severity": "Low", "confidence": 66, "location": "West face"},
            ],
            "maintenancePriority": "Short-term",
            "recommendations": [
                "Seal hairline cracks with low-viscosity epoxy.",
                "Identify and eliminate source of moisture ingress.",
                "Apply hydrophobic sealer to the affected face.",
            ],
            "ndeMethodSuggested": "Rebound Hammer + Ground Penetrating Radar (GPR)",
            "safetyAlert": False,
            "healthSummary": {
                "conditionSentence": "Column shows early-stage deterioration with minor cracking. Preventive maintenance is recommended within 90 days.",
                "loadBearingRisk": "Monitor",
                "inspectionFrequency": "Re-inspect every 6 months",
            },
        },
        {
            "structureType": "Bridge Deck Slab",
            "overallHealthScore": 88,
            "healthStatus": "Good",
            "distressTypes": [
                {"name": "Map Cracking", "severity": "Low", "confidence": 58, "location": "Wearing surface"},
            ],
            "maintenancePriority": "Routine",
            "recommendations": [
                "Apply protective methacrylate sealer in next maintenance cycle.",
                "Continue routine quarterly visual inspections.",
            ],
            "ndeMethodSuggested": "Infrared Thermography",
            "safetyAlert": False,
            "healthSummary": {
                "conditionSentence": "Deck is in good overall condition with only superficial map cracking. Routine maintenance is sufficient.",
                "loadBearingRisk": "Safe",
                "inspectionFrequency": "Re-inspect annually",
            },
        },
    ]

    result = scenarios[seed % len(scenarios)]
    result["maintenancePlan"] = build_maintenance_plan(result["distressTypes"])
    result["ndtChecklist"] = build_ndt_checklist(result["distressTypes"])
    return result


def build_maintenance_plan(distresses: List[dict]) -> List[dict]:
    library = {
        "Flexural Cracking": {
            "immediateAction": "Cordon off area and restrict live loading.",
            "repairMethod": "Pressure epoxy injection for cracks < 0.3mm; carbon-fiber wrap for wider cracks.",
            "urgencyTimeline": "Within 48 hours",
            "materialsNeeded": ["Low-viscosity epoxy resin", "Injection ports", "CFRP fabric", "Saturating epoxy"],
            "requiresEngineer": True,
        },
        "Concrete Spalling": {
            "immediateAction": "Remove loose concrete and document exposed reinforcement.",
            "repairMethod": "Shotcrete overlay or polymer-modified mortar patch after rust removal.",
            "urgencyTimeline": "Within 14 days",
            "materialsNeeded": ["Polymer-modified repair mortar", "Bonding agent", "Wire brush", "Anti-corrosion primer"],
            "requiresEngineer": True,
        },
        "Rebar Corrosion": {
            "immediateAction": "Expose corroded bars and assess section loss.",
            "repairMethod": "Mechanical rust removal, corrosion-inhibiting coating, then patch repair.",
            "urgencyTimeline": "Within 30 days",
            "materialsNeeded": ["Needle scaler", "Zinc-rich primer", "Migrating corrosion inhibitor", "Repair mortar"],
            "requiresEngineer": True,
        },
        "Hairline Cracks": {
            "immediateAction": "Mark and monitor crack widths.",
            "repairMethod": "Low-viscosity epoxy or methacrylate gravity fill.",
            "urgencyTimeline": "Within 90 days",
            "materialsNeeded": ["Low-viscosity epoxy", "Crack comparator card", "Surface cleaner"],
            "requiresEngineer": False,
        },
        "Surface Efflorescence": {
            "immediateAction": "Identify and seal the moisture source.",
            "repairMethod": "Clean with dilute acid wash, then apply hydrophobic silane sealer.",
            "urgencyTimeline": "Within 60 days",
            "materialsNeeded": ["Masonry cleaner", "Silane/siloxane sealer", "Soft-bristle brush"],
            "requiresEngineer": False,
        },
        "Map Cracking": {
            "immediateAction": "Document extent photographically.",
            "repairMethod": "Apply protective methacrylate or epoxy sealer over entire surface.",
            "urgencyTimeline": "Next quarterly cycle",
            "materialsNeeded": ["Methacrylate sealer", "Roller applicator", "Surface degreaser"],
            "requiresEngineer": False,
        },
    }

    plan = []
    for d in distresses:
        entry = library.get(d["name"])
        if not entry:
            continue
        plan.append({"distressName": d["name"], **entry})
    return plan


def build_ndt_checklist(distresses: List[dict]) -> List[dict]:
    methods = {
        "Rebound Hammer": "Estimates surface compressive strength of concrete.",
        "Ultrasonic Pulse Velocity (UPV)": "Detects internal voids and assesses concrete uniformity.",
        "Ground Penetrating Radar (GPR)": "Locates rebar, voids, and embedded utilities non-destructively.",
        "Half-cell Potentiometer": "Measures corrosion potential of embedded reinforcement.",
        "Infrared Thermography": "Identifies delamination and moisture intrusion via thermal contrast.",
    }
    names = {d["name"] for d in distresses}
    selected = set()
    if "Flexural Cracking" in names or "Concrete Spalling" in names:
        selected.update(["Ultrasonic Pulse Velocity (UPV)", "Rebound Hammer"])
    if "Rebar Corrosion" in names:
        selected.update(["Half-cell Potentiometer", "Ground Penetrating Radar (GPR)"])
    if "Hairline Cracks" in names or "Map Cracking" in names:
        selected.add("Infrared Thermography")
    if not selected:
        selected.add("Rebound Hammer")
    return [{"method": m, "description": methods[m]} for m in selected]


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(image: UploadFile = File(...)) -> dict:
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    return run_inference(img)
