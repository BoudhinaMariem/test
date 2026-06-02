# TriWeb ML API — Déploiement .NET + Angular

## 1. Exécuter le notebook
Exécuter toutes les cellules jusqu’à la génération des modèles.

Fichiers attendus :
- `models/best_retard_model.joblib`
- `models/best_charge_model.joblib`
- `models/best_affectation_model.joblib`

## 2. Installer les dépendances

Depuis `backend/AI/ml-api` :

```bash
pip install -r deployment/requirements.txt
```

ou si `requirements.txt` est à la racine `ml-api` :

```bash
pip install -r requirements.txt
```

## 3. Lancer FastAPI

Depuis `backend/AI/ml-api` :

```bash
uvicorn deployment.main:app --host 127.0.0.1 --port 8000
```

ou si `main.py` est à la racine `ml-api` :

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

## 4. Tester

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

## 5. Intégration
Angular appelle .NET :
- `http://localhost:5000/api/ml-models/predict/all`

.NET appelle FastAPI :
- `http://127.0.0.1:8000/predict/all`
