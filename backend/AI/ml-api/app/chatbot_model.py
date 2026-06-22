import json
import os
import urllib.error
import urllib.request
from datetime import datetime
from typing import Any, Dict


DEFAULT_OPENAI_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_OPENAI_MODEL = "llama-3.1-8b-instant"


class ChatbotException(Exception):
    pass


def _get_openai_settings() -> Dict[str, str]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL).strip()
    base_url = os.getenv("OPENAI_BASE_URL", DEFAULT_OPENAI_BASE_URL).strip().rstrip("/")

    if not api_key:
        raise ChatbotException(
            "Cle OpenAI manquante. Configure OPENAI_API_KEY puis relance FastAPI."
        )

    return {
        "api_key": api_key,
        "model": model,
        "base_url": base_url
    }


def _build_chat_completions_url(base_url: str) -> str:
    base_url = base_url.rstrip("/")

    if base_url.endswith("/chat/completions"):
        return base_url

    return f"{base_url}/chat/completions"


def build_rag_context(
    question: str,
    business_context: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    business_context = business_context or {}

    return {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "question": question,
        "source": "triweb_business_context",
        "businessContext": business_context,
        "ragStatus": "RAG structure pret. Embeddings non actives pour le moment."
    }

def should_use_local_answer(question: str) -> bool:
    q = (question or "").lower()

    llm_keywords = [
        "comment",
        "pourquoi",
        "recommande",
        "recommandation",
        "propose",
        "améliorer",
        "ameliorer",
        "réduire",
        "reduire",
        "optimiser",
        "analyse",
        "analyser",
        "risque",
        "priorité",
        "priorite",
        "décision",
        "decision",
        "stratégie",
        "strategie",
        "plan d'action",
        "solution"
    ]

    if any(keyword in q for keyword in llm_keywords):
        return False

    local_keywords = [
        "résumé",
        "resume",
        "combien",
        "nombre",
        "total",
        "non affect",
        "retour cq",
        "retours cq",
        "cq",
        "urgent",
        "urgence",
        "équipe la plus chargée",
        "equipe la plus chargee",
        "plus grande charge",
        "finalisé",
        "finalise",
        "livré",
        "livre"
    ]

    if any(keyword in q for keyword in local_keywords):
        return True

    return False

def call_openai(question: str, rag_context: Dict[str, Any]) -> str:
    settings = _get_openai_settings()

    system_prompt = (
        "Tu es l'assistant opérationnel TRIWEB. "
        "Tu réponds uniquement à partir du JSON businessContext fourni. "
        "Ne donne jamais une définition générale. "
        "Si la question concerne la planification, le dashboard, les retours CQ, les équipes, les dossiers urgents ou non affectés, "
        "utilise d'abord businessContext.indicateursPrincipaux et businessContext.analyses. "
        "Réponse courte, maximum 4 phrases. "
        "Cite les chiffres disponibles. "
        "Si une valeur est absente, dis seulement que cette valeur n'est pas disponible."
    )

    user_prompt = {
        "instruction": (
            "Analyse uniquement les données TRIWEB ci-dessous. "
            "Réponds avec une synthèse métier courte. "
            "N'explique pas ce qu'est la planification en général."
        ),
        "question": question,
        "businessContext": rag_context.get("businessContext", {})
    }

    body = {
        "model": settings["model"],
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": json.dumps(user_prompt, ensure_ascii=False)
            }
        ]
    }

    headers = {
        "Authorization": f"Bearer {settings['api_key']}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "TriwebChatbot/1.0"
    }

    request = urllib.request.Request(
        _build_chat_completions_url(settings["base_url"]),
        data=json.dumps(body).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw_response = response.read().decode("utf-8")
            parsed = json.loads(raw_response)

    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ChatbotException(f"Erreur OpenAI HTTP {exc.code} : {detail}")

    except Exception as exc:
        raise ChatbotException(f"Erreur appel OpenAI : {str(exc)}")

    try:
        return parsed["choices"][0]["message"]["content"].strip()
    except Exception:
        raise ChatbotException("Reponse OpenAI invalide ou vide.")

def build_local_answer(question: str, business_context: Dict[str, Any] | None = None) -> str:
    ctx = business_context or {}
    q = (question or "").lower()

    indicateurs = (
        ctx.get("indicateursPrincipaux")
        or ctx.get("indicateurs_principaux")
        or {}
    )

    analyses = ctx.get("analyses") or {}

    total = indicateurs.get("totalDossiers", "non disponible")
    affectes = indicateurs.get("dossiersAffectesProduction", "non disponible")
    non_affectes = indicateurs.get("dossiersNonAffectes", "non disponible")
    finalises = indicateurs.get("dossiersFinalises", "non disponible")
    pages = indicateurs.get("pagesLivreesAujourdhui", "non disponible")
    retours = indicateurs.get("retoursCq", "non disponible")
    urgents = indicateurs.get("dossiersUrgents", "non disponible")
    equipe_plus_chargee = indicateurs.get("equipePlusChargee")

    # 1. Question sur les dossiers non affectés
    if "non affect" in q:
        return (
            f"Il y a {non_affectes} dossiers non affectés sur un total de {total} dossiers. "
            "Ces dossiers doivent être priorisés pour l’affectation afin de réduire le risque de retard."
        )

    # 2. Question sur les retours CQ
    if "retour" in q or "cq" in q or "cqi" in q or "cqc" in q:
        return (
            f"Il y a {retours} dossiers en retour CQ. "
            "Cela indique des dossiers nécessitant une correction ou une reprise avant validation finale."
        )

    # 3. Question sur les dossiers urgents
    if "urgent" in q or "urgence" in q:
        raisons = analyses.get("raisonsUrgence") or []

        if "pourquoi" in q or "raison" in q or "consid" in q:
            if isinstance(raisons, list) and len(raisons) > 0:
                details = []

                for raison in raisons[:3]:
                    libelle = raison.get("raison", "raison non précisée")
                    count = raison.get("count", "non disponible")
                    details.append(f"{count} dossiers : {libelle}")

                return (
                    f"Les {urgents} dossiers urgents sont identifiés selon les règles de priorité de la planification. "
                    + "Répartition : "
                    + "; ".join(details)
                    + "."
                )

            return (
                f"Il y a {urgents} dossiers urgents. "
                "La raison détaillée n’est pas disponible dans les données chargées."
            )

        return (
            f"Il y a {urgents} dossiers urgents dans la planification. "
            "Ils doivent être traités en priorité pour limiter les retards de livraison."
        )

    # 4. Question sur l’équipe la plus chargée
    if "équipe" in q or "equipe" in q or "charge" in q or "chargée" in q or "chargee" in q:
        if isinstance(equipe_plus_chargee, dict):
            equipe = equipe_plus_chargee.get("equipe", "non disponible")
            nb_dossiers = equipe_plus_chargee.get("nbDossiers", "non disponible")
            charge_totale = equipe_plus_chargee.get("chargeTotale", "non disponible")

            return (
                f"L’équipe la plus chargée est {equipe} avec {nb_dossiers} dossiers. "
                f"La charge totale calculée est {charge_totale}."
            )

        return "L’équipe la plus chargée n’est pas disponible dans les données chargées."

    # 5. Question sur les dossiers finalisés
    if "finalis" in q or "livr" in q:
        return (
            f"{finalises} dossiers sont finalisés et {pages} pages ont été livrées aujourd’hui. "
            "Ces indicateurs montrent l’avancement réel de la production."
        )

    # 6. Résumé général par défaut
    equipe_text = ""

    if isinstance(equipe_plus_chargee, dict):
        equipe = equipe_plus_chargee.get("equipe")
        nb_dossiers = equipe_plus_chargee.get("nbDossiers")
        charge_totale = equipe_plus_chargee.get("chargeTotale")

        if equipe:
            equipe_text = f" L’équipe la plus chargée est {equipe}"
            if nb_dossiers is not None:
                equipe_text += f" avec {nb_dossiers} dossiers"
            if charge_totale is not None:
                equipe_text += f" et une charge totale de {charge_totale}"
            equipe_text += "."

    return (
        f"Résumé de la planification : {total} dossiers au total, "
        f"{affectes} affectés en production et {non_affectes} non affectés. "
        f"{finalises} dossiers sont finalisés, {pages} pages ont été livrées aujourd’hui, "
        f"{retours} dossiers sont en retour CQ et {urgents} dossiers sont urgents."
        f"{equipe_text}"
    )

def build_suggested_questions(business_context: Dict[str, Any] | None = None) -> list[str]:
    ctx = business_context or {}
    indicateurs = ctx.get("indicateursPrincipaux") or {}

    suggestions = [
        "Quels sont les dossiers non affectés ?",
        "Quelle équipe a la plus grande charge ?",
        "Combien de dossiers sont en retour CQ ?",
        "Quels sont les dossiers urgents ?"
    ]

    if indicateurs.get("dossiersUrgents", 0):
        suggestions.append("Pourquoi ces dossiers sont considérés comme urgents ?")

    if indicateurs.get("dossiersNonAffectes", 0):
        suggestions.append("Comment réduire le nombre de dossiers non affectés ?")

    return suggestions[:5]

def ask_chatbot(
    question: str,
    business_context: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    question = (question or "").strip()

    if not question:
        return {
            "success": False,
            "answer": "Question vide.",
            "suggestions": build_suggested_questions(business_context),
            "provider": "none",
            "model": "none",
            "generatedAt": datetime.now().isoformat(timespec="seconds")
        }

    # Mode 1 : questions KPI simples -> réponse locale fiable
    if should_use_local_answer(question):
        return {
            "success": True,
            "answer": build_local_answer(question, business_context),
            "suggestions": build_suggested_questions(business_context),
            "provider": "local-analytics",
            "model": "business-context",
            "generatedAt": datetime.now().isoformat(timespec="seconds")
        }

    # Mode 2 : questions d'analyse / recommandation -> LLM Groq
    try:
        rag_context = build_rag_context(question, business_context)
        answer = call_openai(question, rag_context)

        return {
            "success": True,
            "answer": answer,
            "suggestions": build_suggested_questions(business_context),
            "provider": "llm",
            "model": os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL),
            "generatedAt": rag_context["generatedAt"]
        }

    # Mode 3 : si Groq échoue -> fallback local
    except Exception as exc:
        return {
            "success": True,
            "answer": (
                build_local_answer(question, business_context)
                + "\n\nNote : le LLM n’a pas répondu, donc cette réponse utilise le fallback local."
            ),
            "suggestions": build_suggested_questions(business_context),
            "provider": "local-fallback",
            "model": "business-context",
            "technicalError": str(exc),
            "generatedAt": datetime.now().isoformat(timespec="seconds")
        }