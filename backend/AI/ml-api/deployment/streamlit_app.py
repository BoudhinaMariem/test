import requests
import streamlit as st

st.set_page_config(page_title="TriWeb ML — Prédiction opérationnelle", layout="wide")

st.title("TriWeb ML — Prédiction retard, charge et affectation")
st.caption("Interface de test professionnelle pour saisir un dossier et obtenir les résultats ML.")

API_BASE = st.sidebar.text_input("URL API FastAPI", "http://localhost:8000")

with st.form("prediction_form"):
    col1, col2, col3 = st.columns(3)

    with col1:
        position = st.selectbox("Position", ["Production", "Client", "CQ Client", "CQ Interne", "FTP", "Archive"])
        statut = st.selectbox("Statut", ["En cours", "Livré", "Validé", "Non Conforme", "En instance"])
        loi_type = st.selectbox("Type projet", ["production_standard", "refonte_avec_redaction", "refonte_sans_redaction", "ticket_modification", "autre"])
        nature = st.text_input("Nature", "Site - LocalVisibilité")

    with col2:
        etatR = st.selectbox("État R", ["", "Affecté", "En cours", "En pause", "Validé", "Retour CQ", "Retour CQ traité"])
        etatG = st.selectbox("État G", ["", "Affecté", "En cours", "En pause", "Validé", "Retour CQ", "Retour CQ traité"])
        teamR = st.text_input("Team R", "")
        teamG = st.text_input("Team G", "")

    with col3:
        page = st.number_input("Pages", min_value=0.0, value=5.0)
        charge = st.number_input("Charge", min_value=0.0, value=8.0)
        totalHours = st.number_input("Total heures", min_value=0.0, value=8.0)
        jours_restants = st.number_input("Jours restants", value=1.0)

    submitted = st.form_submit_button("Prédire")

if submitted:
    payload = {
        "position": position,
        "statut": statut,
        "loi_type": loi_type,
        "nature": nature,
        "etatR": etatR,
        "etatG": etatG,
        "etatCqi": "",
        "etatCqc": "",
        "teamR": teamR,
        "teamG": teamG,
        "page": page,
        "charge": charge,
        "totalHours": totalHours,
        "dureeR_min": 0,
        "dureeG_min": 0,
        "dureeCqi_min": 0,
        "dureeCqc_min": 0,
        "jours_restants": jours_restants
    }

    try:
        r = requests.post(f"{API_BASE}/predict/all", json=payload, timeout=30)
        r.raise_for_status()
        result = r.json()

        c1, c2, c3 = st.columns(3)
        c1.metric("Risque retard", result["retard"]["niveau_risque_retard"], result["retard"]["prob_retard"])
        c2.metric("Charge estimée", f'{result["charge"]["charge_estimee_heures"]} h')
        c3.metric("Score affectation", result["affectation"]["score_affectation"], result["affectation"]["avis"])

        st.json(result)
    except Exception as ex:
        st.error(f"Erreur appel API : {ex}")
