from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.db_models import CycloneModel, RiskZoneModel

class ActionClockService:
    def get_action_clock(self, db: Optional[Session] = None, current_eta: float = 18.0) -> List[Dict[str, Any]]:
        """
        Generates the 6-Hour Anticipatory Action Clock timeline from T-24h to Landfall and post-landfall.
        Statuses (COMPLETED, ACTIVE, UPCOMING) are dynamically calibrated based on current cyclone ETA.
        """
        stages = [
            {
                "time_id": "T-24h",
                "label": "T - 24 Hours",
                "phase": "PREPARE & STOCK",
                "window_hours": 24.0,
                "title": "Shelter Readiness & Logistical Mobilization",
                "urgency": "HIGH",
                "directives": [
                    "Activate 18 Multipurpose Cyclone Shelters (MPCS) across Kakinada and Coringa coastal belt.",
                    "Pre-stock 72-hour buffer rations, dry food packages, and 50,000L potable water tankers.",
                    "Inspect backup diesel generators, transfer switches, and flood seals at all designated shelters.",
                    "Issue Level-2 coastal advisory to marine fishermen and suspend all port lighterage operations."
                ],
                "responsible_agencies": ["District Disaster Management Authority (DDMA)", "Civil Supplies", "Panchayat Raj"],
                "target_assets": ["Samalkot Cyclone Shelter", "Coringa MPCS", "Port Worker Relief Center"]
            },
            {
                "time_id": "T-18h",
                "label": "T - 18 Hours",
                "phase": "PRE-POSITION & HARDEN",
                "window_hours": 18.0,
                "title": "Pre-Positioning Medical Supplies & Infrastructure Hardening",
                "urgency": "HIGH",
                "directives": [
                    "Pre-position 20 trauma ambulances and mobile oxygen banks between Kakinada GGH and inland clinics.",
                    "Deploy sandbag flood containment berms around Kakinada 400kV Grid Substation control building.",
                    "Transfer non-ambulatory and dialysis patients from low-lying coastal clinics to Peddapuram safe hub.",
                    "Pre-stage 12 SDRF motorized inflatable rescue boats at Samalkot canal staging point."
                ],
                "responsible_agencies": ["Department of Health & Family Welfare", "APEPDCL Power Utility", "SDRF"],
                "target_assets": ["Kakinada Government General Hospital", "Kakinada 400kV Substation", "Apollo Emergency Center"]
            },
            {
                "time_id": "T-12h",
                "label": "T - 12 Hours",
                "phase": "EVACUATE & SECURE",
                "window_hours": 12.0,
                "title": "Targeted Coastal Evacuation & Vulnerable Ward Clearance",
                "urgency": "CRITICAL",
                "directives": [
                    "Order mandatory phased evacuation of all settlements within 3km of high-tide line and <3m elevation.",
                    "Dispatch 45 state transport buses on pre-designated green corridors to evacuate 42,000 priority residents.",
                    "Secure hazardous chemical storage tanks and container cranes at Kakinada Deep Water Port.",
                    "Establish satellite communication links (HAM Radio & INMARSAT) at District Emergency Operations Center."
                ],
                "responsible_agencies": ["Revenue Department", "APSRTC Transport", "Police Department", "Port Authority"],
                "target_assets": ["Coringa Fishing Villages", "Kakinada Port Arterial Expressway", "District EOC"]
            },
            {
                "time_id": "T-6h",
                "label": "T - 6 Hours",
                "phase": "RESTRICT & REROUTE",
                "window_hours": 6.0,
                "title": "Lifeline Road Closures & Traffic Diversion to Risk-Aware Routes",
                "urgency": "CRITICAL",
                "directives": [
                    "Barricade NH-216 coastal spur subject to predicted 3.2m wave overtopping and tidal creek flooding.",
                    "Divert all emergency logistics and security convoys onto State Highway 73 inland elevated bypass.",
                    "Pre-emptively de-energize low-lying 33kV rural power lines to eliminate lethal electrocution risks.",
                    "Order complete curfew in red-zone coastal sectors; responders transition to blast-hardened staging bunkers."
                ],
                "responsible_agencies": ["Traffic Police", "National Highways Authority (NHAI)", "APEPDCL"],
                "target_assets": ["NH-216 Coastal Spur", "East Bridge Bypass", "Rural 33kV Feeders"]
            },
            {
                "time_id": "T-3h",
                "label": "T - 3 Hours",
                "phase": "LOCKDOWN & STANDBY",
                "window_hours": 3.0,
                "title": "Responder Final Lockdown & Emergency Standby",
                "urgency": "MAXIMUM",
                "directives": [
                    "All outdoor vehicular movements suspended as sustained surface gale winds exceed 85 km/h.",
                    "Emergency vehicles parked inside covered bays at high-elevation depot (Peddapuram Staging Hub).",
                    "Medical teams inside KGH transition to self-sufficient generator power and backup water cisterns.",
                    "Command center initiates continuous radar Doppler track monitoring and automated sensor polling."
                ],
                "responsible_agencies": ["District Collectorate", "NDRF 10th Battalion", "Superintendent of Police"],
                "target_assets": ["Peddapuram Staging Hub", "Hospital Central ICU", "Doppler Radar Machilipatnam"]
            },
            {
                "time_id": "LANDFALL",
                "label": "Landfall (T - 0h)",
                "phase": "RESPONSE MODE",
                "window_hours": 0.0,
                "title": "Cyclone Eye Landfall — Active Response & Surge Monitoring",
                "urgency": "MAXIMUM",
                "directives": [
                    "Eye wall crossing coast: peak storm surge (3.2m - 3.8m) and extreme torrential rainfall active.",
                    "Maintain total civilian shelter containment; monitor automated coastal tide gauges and pressure telemetry.",
                    "Do NOT deploy personnel during eye calm (false lull before reverse gale onset).",
                    "Keep emergency satellite channels open for post-eye triage dispatch."
                ],
                "responsible_agencies": ["All Emergency Services", "Armed Forces Liaison", "IMD"],
                "target_assets": ["Entire Coastal Strip", "Estuary Embankments", "Emergency Shelters"]
            },
            {
                "time_id": "T+6h",
                "label": "T + 6 Hours",
                "phase": "RECOVERY & TRIAGE",
                "window_hours": -6.0,
                "title": "Immediate Search, Rescue & Route Clearing",
                "urgency": "HIGH",
                "directives": [
                    "Deploy heavy earthmovers and chainsaw crews to clear fallen trees along primary hospital lifeline routes.",
                    "Inspect NH-216 bridges and creek embankments with structural engineers before allowing civilian traffic.",
                    "Dispatch mobile dewatering pump units to submerged substation yards and municipal water pumping stations.",
                    "Begin air-drop and boat distribution of water purification tablets and hot meals in marooned pockets."
                ],
                "responsible_agencies": ["NDRF", "Roads & Buildings (R&B)", "Public Health Engineering", "Armed Forces"],
                "target_assets": ["Lifeline Hospital Arterials", "Municipal Water Treatment Plant", "NH-216 Bridge"]
            }
        ]

        # Determine dynamic status based on current_eta
        for s in stages:
            w_hours = s["window_hours"]
            if current_eta < w_hours - 3.0:
                s["status"] = "COMPLETED"
                s["status_badge"] = "EXECUTED"
            elif abs(current_eta - w_hours) <= 3.0 or (w_hours == 0.0 and current_eta <= 1.0):
                s["status"] = "ACTIVE_NOW"
                s["status_badge"] = "IN EXECUTION"
            else:
                s["status"] = "SCHEDULED"
                s["status_badge"] = "QUEUED"

        return stages

action_clock_service = ActionClockService()
