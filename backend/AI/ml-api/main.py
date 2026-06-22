from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.chatbot_model import ask_chatbot


APP_DIR = Path(__file__).resolve().parent
MODELS_DIR = APP_DIR / "models"

RETARD_MODEL_PATH = MODELS_DIR / "best_retard_model.joblib"
CHARGE_MODEL_PATH = MODELS_DIR / "best_charge_model.joblib"
AFFECTATION_MODEL_PATH = MODELS_DIR / "best_affectation_model.joblib"

app = FastAPI(
    title="TriWeb ML API",
    description="API ML pour prédiction retard, charge restante, score d’affectation et chatbot.",
    version="1.0.0"
)



class ChatbotAskRequest(BaseModel):
    question: str
    businessContext: Dict[str, Any] = {}

@app.post("/chatbot/ask")
def chatbot_ask(payload: ChatbotAskRequest):
    return ask_chatbot(
        question=payload.question,
        business_context=payload.businessContext
    )

FEATURES = [
    "position",
    "statut",
    "loi_type",
    "nature",
    "etatR",
    "etatG",
    "etatCqi",
    "etatCqc",
    "teamR",
    "teamG",
    "page",
    "charge",
    "totalHours",
    "dureeR_min",
    "dureeG_min",
    "dureeCqi_min",
    "dureeCqc_min",
    "jours_restants"
]

models = {
    "retard": None,
    "charge": None,
    "affectation": None
}



class DossierPredictionInput(BaseModel):
    position: str = "Production"
    statut: str = "En cours"
    loi_type: str = "production_standard"
    nature: str = ""

    etatR: str = ""
    etatG: str = ""
    etatCqi: str = ""
    etatCqc: str = ""

    teamR: str = ""
    teamG: str = ""

    page: float = 0
    charge: float = 0
    totalHours: float = 0

    dureeR_min: float = 0
    dureeG_min: float = 0
    dureeCqi_min: float = 0
    dureeCqc_min: float = 0

    jours_restants: float = 999


@app.on_event("startup")
def load_models():
    if not RETARD_MODEL_PATH.exists():
        raise RuntimeError(f"Modèle retard introuvable : {RETARD_MODEL_PATH}")

    if not CHARGE_MODEL_PATH.exists():
        raise RuntimeError(f"Modèle charge introuvable : {CHARGE_MODEL_PATH}")

    if not AFFECTATION_MODEL_PATH.exists():
        raise RuntimeError(f"Modèle affectation introuvable : {AFFECTATION_MODEL_PATH}")

    print("Chargement modèle retard...")
    models["retard"] = joblib.load(RETARD_MODEL_PATH)
    print("Modèle retard chargé.")

    print("Chargement modèle charge...")
    models["charge"] = joblib.load(CHARGE_MODEL_PATH)
    print("Modèle charge chargé.")

    print("Chargement modèle affectation...")
    models["affectation"] = joblib.load(AFFECTATION_MODEL_PATH)
    print("Modèle affectation chargé.")


def to_dataframe(payload: DossierPredictionInput) -> pd.DataFrame:
    data = payload.dict()
    df = pd.DataFrame([data])

    for col in FEATURES:
        if col not in df.columns:
            df[col] = ""

    return df[FEATURES]


def risk_label(prob: float) -> str:
    if prob >= 0.75:
        return "Élevé"

    if prob >= 0.45:
        return "Moyen"

    return "Faible"


def affectation_avis(score: float) -> str:
    if score >= 70:
        return "Correcte"

    if score >= 45:
        return "À surveiller"

    return "Faible"


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_dir": str(MODELS_DIR),
        "files": {
            "retard": RETARD_MODEL_PATH.exists(),
            "charge": CHARGE_MODEL_PATH.exists(),
            "affectation": AFFECTATION_MODEL_PATH.exists()
        }
    }


@app.post("/predict/retard")
def predict_retard(payload: DossierPredictionInput):
    try:
        df = to_dataframe(payload)
        model = models["retard"]

        if hasattr(model.named_steps["model"], "predict_proba"):
            prob = float(model.predict_proba(df)[0, 1])
        else:
            prob = float(model.predict(df)[0])

        return {
            "prob_retard": round(prob, 4),
            "niveau_risque_retard": risk_label(prob)
        }

    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.post("/predict/charge")
def predict_charge(payload: DossierPredictionInput):
    try:
        df = to_dataframe(payload)
        minutes = float(max(models["charge"].predict(df)[0], 0))

        return {
            "charge_estimee_minutes": round(minutes, 2),
            "charge_estimee_heures": round(minutes / 60, 2)
        }

    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.post("/predict/affectation")
def predict_affectation(payload: DossierPredictionInput):
    try:
        df = to_dataframe(payload)
        score = float(np.clip(models["affectation"].predict(df)[0], 0, 100))

        return {
            "score_affectation": round(score, 2),
            "avis": affectation_avis(score)
        }

    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.post("/predict/all")
def predict_all(payload: DossierPredictionInput):
    try:
        df = to_dataframe(payload)

        retard_model = models["retard"]

        if hasattr(retard_model.named_steps["model"], "predict_proba"):
            prob = float(retard_model.predict_proba(df)[0, 1])
        else:
            prob = float(retard_model.predict(df)[0])

        minutes = float(max(models["charge"].predict(df)[0], 0))
        score = float(np.clip(models["affectation"].predict(df)[0], 0, 100))

        return {
            "retard": {
                "prob_retard": round(prob, 4),
                "niveau_risque_retard": risk_label(prob)
            },
            "charge": {
                "charge_estimee_minutes": round(minutes, 2),
                "charge_estimee_heures": round(minutes / 60, 2)
            },
            "affectation": {
                "score_affectation": round(score, 2),
                "avis": affectation_avis(score)
            }
        }

    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.post("/predict/batch")
def predict_batch(payloads: List[DossierPredictionInput]):
    return [predict_all(payload) for payload in payloads]


@app.post("/predict/planning-risk")
def predict_planning_risk(payload: DossierPredictionInput):
    daily_capacity = 8
    jours = max(payload.jours_restants, 1)
    capacity = jours * daily_capacity

    charge_ratio = float(payload.charge) / capacity if capacity > 0 else 0

    risk_score = 0

    if charge_ratio >= 1.2:
        risk_score += 45
    elif charge_ratio >= 0.9:
        risk_score += 30
    elif charge_ratio >= 0.6:
        risk_score += 15

    if payload.page >= 30:
        risk_score += 25
    elif payload.page >= 15:
        risk_score += 15
    elif payload.page >= 8:
        risk_score += 8

    if payload.jours_restants <= 1:
        risk_score += 20
    elif payload.jours_restants <= 3:
        risk_score += 10

    statut = payload.statut.lower()

    if "urgent" in statut or "bloqué" in statut or "bloque" in statut:
        risk_score += 20
    elif "cours" in statut:
        risk_score += 8

    nature = payload.nature.lower()

    if "site" in nature:
        risk_score += 8

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        niveau = "Eleve"
    elif risk_score >= 40:
        niveau = "Moyen"
    else:
        niveau = "Faible"

    prob_retard = risk_score / 100

    charge_estimee_heures = round(float(payload.charge) * (1 + risk_score / 200), 2)
    charge_estimee_minutes = round(charge_estimee_heures * 60)

    score_affectation = round(
        max(
            0,
            min(
                100,
                100 - risk_score + min(payload.jours_restants * 5, 20)
            )
        )
    )

    if score_affectation >= 75:
        avis = "Affectation recommandee"
    elif score_affectation >= 50:
        avis = "Affectation possible avec surveillance"
    else:
        avis = "Affectation risquee"

    return {
        "retard": {
            "niveau_risque_retard": niveau,
            "prob_retard": prob_retard,
            "risk_score": risk_score
        },
        "charge": {
            "charge_estimee_heures": charge_estimee_heures,
            "charge_estimee_minutes": charge_estimee_minutes
        },
        "affectation": {
            "score_affectation": score_affectation,
            "avis": avis
        },
        "explication": [
            f"Charge demandee : {payload.charge}",
            f"Capacite estimee : {capacity}",
            f"Ratio charge/capacite : {round(charge_ratio, 2)}",
            f"Pages : {payload.page}",
            f"Jours restants : {payload.jours_restants}"
        ]
    }