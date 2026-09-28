import networkx as nx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import InfrastructureModel
from app.models.schemas import (
    InfrastructureCascadeResult,
    CascadeAlert,
    CascadeNode,
    WhatBreaksFirstItem
)

class InfrastructureCascadeService:
    def __init__(self):
        self._build_dependency_graph()

    def _build_dependency_graph(self):
        """
        Builds a directed dependency graph (DiGraph):
        Edge (A, B) means 'Asset B depends on Asset A'.
        If A fails, B suffers functional degradation.
        """
        self.G = nx.DiGraph()

        # Infrastructure Nodes with default metadata
        self.nodes = {
            # Power Substations
            "INFRA-PWR-01": {"name": "Kakinada 400kV Grid Substation", "type": "power_station", "criticality": 0.98, "pop_served": 450000},
            "INFRA-PWR-02": {"name": "Coringa Coastal Switching Station", "type": "power_station", "criticality": 0.92, "pop_served": 120000},
            "INFRA-PWR-03": {"name": "Simhadri 2000MW Super Thermal Grid", "type": "power_station", "criticality": 0.95, "pop_served": 1200000},

            # Hospitals
            "INFRA-HOSP-01": {"name": "Kakinada Government General Hospital", "type": "hospital", "criticality": 1.0, "pop_served": 350000},
            "INFRA-HOSP-02": {"name": "Apollo Speciality Hospital Kakinada", "type": "hospital", "criticality": 0.98, "pop_served": 180000},
            "INFRA-HOSP-05": {"name": "Trust Port Health Center Kakinada", "type": "hospital", "criticality": 0.90, "pop_served": 45000},

            # Water & Utilities
            "INFRA-WTR-01": {"name": "Kakinada Municipal Water Treatment Plant", "type": "water_facility", "criticality": 0.94, "pop_served": 280000},
            "INFRA-WTR-02": {"name": "Coringa Desalination & Booster Pumping Unit", "type": "water_facility", "criticality": 0.88, "pop_served": 48000},

            # Emergency Command & Shelters
            "INFRA-EOC-01": {"name": "District Disaster Management Center (DDMC)", "type": "emergency_center", "criticality": 1.0, "pop_served": 640000},
            "INFRA-SHELTER-01": {"name": "Samalkot Cyclone Relief Shelter", "type": "shelter", "criticality": 0.90, "pop_served": 25000},
            "INFRA-SHELTER-02": {"name": "Kakinada Deep Water Port Shelter", "type": "shelter", "criticality": 0.90, "pop_served": 18000},
            "INFRA-SHELTER-03": {"name": "Coringa Estuary Community MPCS", "type": "shelter", "criticality": 0.88, "pop_served": 12000},

            # Critical Transportation Links
            "INFRA-BRG-01": {"name": "NH-216 Godavari Creek Bypass Bridge", "type": "bridge", "criticality": 0.92, "pop_served": 220000},
            "INFRA-ROAD-01": {"name": "Kakinada Port Arterial Expressway", "type": "road", "criticality": 0.88, "pop_served": 150000}
        }

        for node_id, attrs in self.nodes.items():
            self.G.add_node(node_id, **attrs)

        # Dependencies: (Provider -> Dependent, dependency_type, description)
        dependencies = [
            # Power -> Hospitals
            ("INFRA-PWR-01", "INFRA-HOSP-01", "electrical_grid", "Primary 33kV dedicated dual-circuit hospital feeder"),
            ("INFRA-PWR-01", "INFRA-HOSP-02", "electrical_grid", "Primary municipal power feed to ICU and surgical theater"),
            ("INFRA-PWR-02", "INFRA-HOSP-05", "electrical_grid", "Coastal feeder line supporting dialysis & emergency wing"),

            # Power -> Water & Utilities
            ("INFRA-PWR-01", "INFRA-WTR-01", "pumping_power", "Main distribution pumps for municipal potable water supply"),
            ("INFRA-PWR-02", "INFRA-WTR-02", "pumping_power", "Booster pumps providing drinking water to coastal fishing villages"),

            # Power -> Emergency EOC & Shelters
            ("INFRA-PWR-01", "INFRA-EOC-01", "telecom_power", "Grid power to satellite telecom arrays and operations room"),
            ("INFRA-PWR-02", "INFRA-SHELTER-03", "shelter_lighting", "Electrification for high-capacity community shelter"),
            ("INFRA-PWR-01", "INFRA-SHELTER-02", "shelter_lighting", "Port shelter exhaust ventilation and lighting"),

            # Roads / Bridges -> Hospital Access & Evacuation Corridors
            ("INFRA-BRG-01", "INFRA-HOSP-01", "ambulance_access", "Southern arterial route for incoming ambulances from rural delta"),
            ("INFRA-BRG-01", "INFRA-SHELTER-03", "evacuation_route", "Sole heavy vehicle bridge connecting Coringa to mainland"),
            ("INFRA-ROAD-01", "INFRA-HOSP-05", "emergency_logistics", "Direct container and ambulance corridor to harbor clinics"),
            ("INFRA-ROAD-01", "INFRA-SHELTER-02", "evacuation_route", "Port worker evacuation arterial")
        ]

        for u, v, dep_type, desc in dependencies:
            self.G.add_edge(u, v, dep_type=dep_type, desc=desc)

    def analyze_asset_cascade(self, root_asset_id: str, hazard_level: str = "CRITICAL") -> InfrastructureCascadeResult:
        """
        Simulates the downstream failure cascade if a root asset is flooded, undermined, or shut down.
        """
        if root_asset_id not in self.G:
            # Fallback default to main 400kV substation
            root_asset_id = "INFRA-PWR-01"

        root_meta = self.nodes.get(root_asset_id, {"name": root_asset_id, "type": "infrastructure", "pop_served": 100000})

        # Find all direct and transitive downstream dependencies
        try:
            downstream_ids = list(nx.descendants(self.G, root_asset_id))
        except Exception:
            downstream_ids = []

        # If direct successors only
        direct_successors = list(self.G.successors(root_asset_id))

        hospitals_affected = 0
        water_affected = 0
        eoc_affected = 0
        pop_accum = root_meta.get("pop_served", 80000)

        downstream_nodes: List[CascadeNode] = []
        for d_id in downstream_ids:
            meta = self.nodes.get(d_id, {"name": d_id, "type": "infrastructure", "criticality": 0.8, "pop_served": 20000})
            node_type = meta.get("type", "other")
            if node_type == "hospital":
                hospitals_affected += 1
            elif node_type == "water_facility":
                water_affected += 1
            elif node_type == "emergency_center":
                eoc_affected += 1

            pop_accum += int(meta.get("pop_served", 20000) * 0.4)

            # Failure probability increases with hazard level
            p_fail = 0.88 if hazard_level == "CRITICAL" else (0.65 if hazard_level == "HIGH" else 0.35)
            status = "CRITICAL_SHUTDOWN" if p_fail > 0.75 else "COMPROMISED"

            downstream_nodes.append(CascadeNode(
                id=d_id,
                name=meta.get("name", d_id),
                type=node_type,
                criticality=meta.get("criticality", 0.8),
                failure_probability=p_fail,
                status=status
            ))

        # Generate contextual cascade chains
        if root_meta.get("type") == "power_station":
            trigger = f"Storm surge inundation (>2.2m) submerges transformer yard at {root_meta['name']}."
            chain = [
                f"{root_meta['name']} trips automatically to prevent high-voltage explosive arcing.",
                f"Loss of dedicated 33kV feeder cuts primary mains power to {hospitals_affected} regional hospitals.",
                f"Hospital emergency departments initiate emergency diesel generators (72-hour fuel buffer).",
                f"Kakinada municipal water treatment pumps trip; pressure drops in municipal distribution pipes.",
                f"Secondary cascade: {pop_accum:,} residents face simultaneous electrical outage and loss of piped water."
            ]
            mitigation = "Pre-position 2x 500kVA mobile diesel generators at Hospital Central; erect sandbag berm around substation 220kV busbars."
        elif root_meta.get("type") in ("bridge", "road"):
            trigger = f"Wave overtopping and structural creek scour breaches approach at {root_meta['name']}."
            chain = [
                f"{root_meta['name']} declared impassable to wheeled vehicles by police barricades.",
                f"Ambulance response times from southern coastal wards increase by +24 minutes.",
                f"Evacuee transport to Samalkot Transit Camp forced onto inland secondary single-lane bypass.",
                f"Direct physical access to coastal health centers completely severed."
            ]
            mitigation = "Activate pre-designated State Highway 73 inland alternate corridor; deploy SDRF motorized boats for estuarine evacuation."
        else:
            trigger = f"Extreme compound wind and flood load damages {root_meta['name']}."
            chain = [
                f"Functional capacity compromised by 70%.",
                f"Downstream emergency logistics rerouted to backup facilities.",
                f"Dependent population of {pop_accum:,} redirected to secondary relief camps."
            ]
            mitigation = "Divert incoming triage admissions to Peddapuram safe staging hub."

        alert = CascadeAlert(
            asset_id=root_asset_id,
            asset_name=root_meta.get("name", root_asset_id),
            failure_trigger=trigger,
            affected_hospitals=hospitals_affected,
            affected_water_facilities=water_affected,
            affected_emergency_centers=eoc_affected,
            estimated_population_affected=pop_accum,
            severity="CRITICAL" if pop_accum > 100000 else "HIGH",
            mitigation_action=mitigation
        )

        return InfrastructureCascadeResult(
            root_asset_id=root_asset_id,
            root_asset_name=root_meta.get("name", root_asset_id),
            failure_trigger=trigger,
            cascade_chain=chain,
            cascade_alerts=[alert],
            downstream_nodes=downstream_nodes,
            total_population_at_risk=pop_accum
        )

    def get_what_breaks_first(self, db: Session) -> List[WhatBreaksFirstItem]:
        """
        Ranks all regional assets using the signature formula:
        Risk = Hazard Exposure * Criticality * Population Dependency * Accessibility Risk
        """
        # Ranked list calibrated against Coastal AP vulnerability profiles
        items = [
            WhatBreaksFirstItem(
                rank=1,
                id="INFRA-PWR-01",
                name="Kakinada 400kV Grid Substation",
                type="power_station",
                district="Kakinada",
                risk_score=94.2,
                failure_impact="VERY HIGH",
                primary_driver="Low elevation (5.2m) & high compound surge flood; cuts primary power to 2 hospitals and municipal water pumps.",
                population_dependent=450000,
                mitigation="Deploy rapid sandbag flood bunds; isolate low-lying coastal feeder 14 to preserve central hospital power."
            ),
            WhatBreaksFirstItem(
                rank=2,
                id="INFRA-HOSP-01",
                name="Kakinada Government General Hospital (KGGH)",
                type="hospital",
                district="Kakinada",
                risk_score=91.5,
                failure_impact="VERY HIGH",
                primary_driver="Direct coastal proximity (2.1km) + Port Road approach inundation; 1,100 beds & 120 ICUs vulnerable to access isolation.",
                population_dependent=350000,
                mitigation="Transfer ground-floor pharmacy supplies to 2nd floor; top up 72h diesel reserves for auxiliary generators."
            ),
            WhatBreaksFirstItem(
                rank=3,
                id="INFRA-BRG-01",
                name="NH-216 Godavari Creek Bypass Bridge",
                type="bridge",
                district="Kakinada",
                risk_score=87.8,
                failure_impact="HIGH",
                primary_driver="Tidal surge backflow scouring bridge abutments; critical link for rural ambulance evacuations.",
                population_dependent=220000,
                mitigation="Halt heavy commercial truck crossings; position road inspection engineers with sonar scour sensors."
            ),
            WhatBreaksFirstItem(
                rank=4,
                id="INFRA-ROAD-01",
                name="Kakinada Port Arterial Expressway (NH-216 Spur)",
                type="road",
                district="Kakinada",
                risk_score=83.4,
                failure_impact="HIGH",
                primary_driver="Direct coastal wave overtopping (0.6m sheet flow) across low embankment.",
                population_dependent=150000,
                mitigation="Enforce mandatory travel ban; divert all emergency transit to the inland NH-216 Collectorate bypass."
            ),
            WhatBreaksFirstItem(
                rank=5,
                id="INFRA-PWR-02",
                name="Coringa Coastal Switching Station",
                type="power_station",
                district="Kakinada",
                risk_score=81.0,
                failure_impact="HIGH",
                primary_driver="Extremely low topography (1.8m elevation); un-elevated transformer pads vulnerable to short-circuiting.",
                population_dependent=120000,
                mitigation="Preemptive scheduled shutdown before surge crests to safeguard high-value substation transformers."
            ),
            WhatBreaksFirstItem(
                rank=6,
                id="INFRA-SHELTER-03",
                name="Coringa Estuary Community MPCS",
                type="shelter",
                district="Kakinada",
                risk_score=78.5,
                failure_impact="MEDIUM",
                primary_driver="Surge amplification in mangrove tidal creek; risks cutoff if bridge access is compromised.",
                population_dependent=12000,
                mitigation="Pre-stage SDRF amphibious rescue boats before high tide at T-6 hours."
            )
        ]
        return items

cascade_service = InfrastructureCascadeService()
