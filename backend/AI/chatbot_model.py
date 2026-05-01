import sys
import json
import urllib.request
from datetime import datetime
from collections import Counter, defaultdict
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

def safe_get(item, *keys, default=""):
    for key in keys:
        if key in item and item[key] not in [None, ""]:
            return str(item[key]).strip()
    return default


def parse_date(value):
    if not value:
        return None

    value = str(value).strip()

    # Cas date courte : 30/04
    try:
        if len(value) == 5 and value[2] == "/":
            day, month = value.split("/")
            return datetime(
                year=datetime.now().year,
                month=int(month),
                day=int(day)
            )
    except Exception:
        return None

    formats = [
        "%d/%m/%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d"
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except Exception:
            pass

    return None

    if not value:
        return None

    value = str(value).strip()

    formats = [
        "%d/%m/%Y",
        "%d/%m",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d"
    ]

    for fmt in formats:
        try:
            date = datetime.strptime(value, fmt)
            if fmt == "%d/%m":
                date = date.replace(year=datetime.now().year)
            return date
        except Exception:
            pass

    return None


def load_items(payload):
    if isinstance(payload.get("items"), list):
        return payload["items"]

    api_url = payload.get("apiUrl")
    if api_url:
        request = urllib.request.Request(
            api_url,
            headers={
                "User-Agent": "TriwebChatbot/1.0",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(api_url, timeout=20) as response:
            data = response.read().decode("utf-8")
            parsed = json.loads(data)

            if isinstance(parsed, list):
                return parsed

            if isinstance(parsed, dict):
                for key in ["items", "data", "result", "results"]:
                    if isinstance(parsed.get(key), list):
                        return parsed[key]

    
    data_path = payload.get("dataPath")
    if data_path:
        with open(data_path, "r", encoding="utf-8") as file:
            parsed = json.load(file)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for key in ["items", "data", "result", "results"]:
                    if isinstance(parsed.get(key), list):
                        return parsed[key]

    return []


def normalize_items(items):
    normalized = []

    for item in items:
        statut = safe_get(item, "statut", "status", "etat", default="Non défini")
        position = safe_get(item, "postion", "position", "phase", "etape", default="Non défini")
        nature = safe_get(item, "nature", "typeProjet", "produit", default="Non défini")
        client = safe_get(item, "rs", "client", "raisonSociale", "nomClient", "name", default="Client non défini")
        code_client = safe_get(item, "codeClient", "code", "customerCode", default="")
        team_r = safe_get(item, "teamR", "equipeR", "teamRedaction", "equipeRedaction", default="")
        team_g = safe_get(item, "teamG", "equipeG", "teamGraphisme", "equipeGraphisme", default="")
        redacteur = safe_get(item, "redacteur", "writer", default="")
        graphiste = safe_get(item, "graphiste", "designer", default="")
        livraison_prevue = safe_get(item, "dateLivraisonPrevue", "datePrevue", "deadline", "dateEcheance", default="")
        date_reception = safe_get(item, "dateReception", "receptionDate", default="")
        page = safe_get(item, "page", "pages", default="0")
        estimation = safe_get(item, "estimation", "charge", "estimatedTime", default="0")

        try:
            page = int(float(str(page).replace(",", ".")))
        except Exception:
            page = 0

        try:
            estimation = float(str(estimation).replace(",", "."))
        except Exception:
            estimation = 0

        normalized.append({
            "statut": statut,
            "position": position,
            "nature": nature,
            "client": client,
            "codeClient": code_client,
            "teamR": team_r,
            "teamG": team_g,
            "redacteur": redacteur,
            "graphiste": graphiste,
            "dateLivraisonPrevue": livraison_prevue,
            "dateReception": date_reception,
            "dateLivraisonPrevueParsed": parse_date(livraison_prevue),
            "dateReceptionParsed": parse_date(date_reception),
            "page": page,
            "estimation": estimation
        })

    return normalized


def build_summary(items):
    total = len(items)

    statuts = Counter([item["statut"] for item in items])
    positions = Counter([item["position"] for item in items])
    natures = Counter([item["nature"] for item in items])

    delivered_keywords = ["livré", "livre", "validé", "valide", "validé client", "validé client"]
    retour_keywords = ["retour", "non conforme", "ko"]

    delivered = [
        item for item in items
        if any(keyword in item["statut"].lower() for keyword in delivered_keywords)
    ]

    retours = [
        item for item in items
        if any(keyword in item["statut"].lower() for keyword in retour_keywords)
        or any(keyword in item["position"].lower() for keyword in retour_keywords)
    ]

    today = datetime.now()
    overdue = []
    upcoming = []

    for item in items:
        due_date = item.get("dateLivraisonPrevueParsed")
        if due_date:
            if due_date.date() < today.date() and item not in delivered:
                overdue.append(item)
            elif due_date.date() >= today.date():
                upcoming.append(item)

    teams = Counter()
    for item in items:
        if item["teamR"]:
            teams[item["teamR"]] += 1
        if item["teamG"]:
            teams[item["teamG"]] += 1

    charge_total = sum(item["estimation"] for item in items)

    return {
        "total": total,
        "delivered": len(delivered),
        "retours": len(retours),
        "overdue": len(overdue),
        "upcoming": len(upcoming),
        "chargeTotal": charge_total,
        "statuts": statuts,
        "positions": positions,
        "natures": natures,
        "teams": teams,
        "overdueItems": overdue,
        "upcomingItems": upcoming
    }


def format_counter(counter, limit=5):
    if not counter:
        return "Aucune donnée disponible."

    lines = []
    for label, count in counter.most_common(limit):
        lines.append(f"- {label} : {count}")
    return "\n".join(lines)


def answer_question(question, items):
    q = question.lower().strip()
    summary = build_summary(items)

    if not items:
        return (
            "Je n’ai pas réussi à charger les données du dashboard. "
            "Vérifie le lien API configuré côté backend."
        )

    if any(word in q for word in ["bonjour", "salut", "hello", "hi"]):
        return (
            "Bonjour, je suis l’assistant Triweb. "
            "Je peux t’aider sur le dashboard, la planification, les retards, les équipes, les statuts et les charges."
        )

    if any(word in q for word in ["combien", "total", "nombre", "dossiers"]):
        return (
            f"Le périmètre actuel contient {summary['total']} dossiers.\n"
            f"- Livrés ou validés : {summary['delivered']}\n"
            f"- En retour / non conformes : {summary['retours']}\n"
            f"- En retard estimé : {summary['overdue']}\n"
            f"- Charge totale estimée : {summary['chargeTotal']:.0f} h"
        )

    if any(word in q for word in ["retard", "dépassé", "depasse", "urgence", "urgent"]):
        if summary["overdue"] == 0:
            return "Aucun retard détecté sur le périmètre chargé."

        lines = [
            f"{summary['overdue']} dossier(s) semblent en retard selon la date de livraison prévue :"
        ]

        for item in summary["overdueItems"][:8]:
            lines.append(
                f"- {item['client']} ({item['codeClient']}) : prévu le {item['dateLivraisonPrevue']} - statut {item['statut']}"
            )

        return "\n".join(lines)

    if any(word in q for word in ["statut", "status", "répartition", "repartition"]):
        return "Répartition des statuts :\n" + format_counter(summary["statuts"], 8)

    if any(word in q for word in ["position", "phase", "étape", "etape"]):
        return "Répartition par position / étape :\n" + format_counter(summary["positions"], 8)

    if any(word in q for word in ["nature", "produit", "type"]):
        return "Répartition par nature de projet :\n" + format_counter(summary["natures"], 8)

    if any(word in q for word in ["équipe", "equipe", "team", "charge équipe", "charge equipe"]):
        return "Charge par équipe :\n" + format_counter(summary["teams"], 10)

    if any(word in q for word in ["planification", "planning", "livraison", "prévu", "prevu"]):
        if summary["upcoming"] == 0:
            return "Aucune livraison à venir détectée."

        lines = ["Prochaines livraisons prévues :"]

        sorted_items = sorted(
            summary["upcomingItems"],
            key=lambda x: x["dateLivraisonPrevueParsed"] or datetime.max
        )

        for item in sorted_items[:8]:
            lines.append(
                f"- {item['dateLivraisonPrevue']} : {item['client']} ({item['codeClient']}) - {item['nature']} - {item['statut']}"
            )

        return "\n".join(lines)

    if any(word in q for word in ["retour", "non conforme", "cq"]):
        if summary["retours"] == 0:
            return "Aucun dossier en retour ou non conforme détecté."

        retour_items = [
            item for item in items
            if "retour" in item["statut"].lower()
            or "retour" in item["position"].lower()
            or "non conforme" in item["statut"].lower()
        ]

        lines = [f"{len(retour_items)} dossier(s) en retour / non conforme :"]

        for item in retour_items[:8]:
            lines.append(
                f"- {item['client']} ({item['codeClient']}) : {item['position']} - {item['statut']}"
            )

        return "\n".join(lines)

    # Recherche par code client ou nom client
    matches = []
    for item in items:
        if q in item["client"].lower() or q in str(item["codeClient"]).lower():
            matches.append(item)

    if matches:
        lines = [f"{len(matches)} dossier(s) trouvé(s) :"]
        for item in matches[:8]:
            lines.append(
                f"- {item['client']} ({item['codeClient']}) : {item['nature']} - {item['position']} - {item['statut']}"
            )
        return "\n".join(lines)

    return (
        "Je peux répondre sur les dossiers, les retards, les statuts, les équipes, "
        "la planification, les retours CQ et les livraisons.\n"
        "Exemples :\n"
        "- Combien de dossiers actifs ?\n"
        "- Quels dossiers sont en retard ?\n"
        "- Donne-moi la répartition par statut.\n"
        "- Quelle est la charge par équipe ?\n"
        "- Quelles sont les prochaines livraisons ?"
    )


def main():
    try:
        raw_input = sys.stdin.read()
        payload = json.loads(raw_input) if raw_input.strip() else {}

        question = payload.get("question", "")
        items = load_items(payload)
        normalized_items = normalize_items(items)
        answer = answer_question(question, normalized_items)

        result = {
            "success": True,
            "answer": answer,
            "count": len(normalized_items)
        }

        print(json.dumps(result, ensure_ascii=False))

    except Exception as exc:
        result = {
            "success": False,
            "answer": "Erreur Python chatbot : " + str(exc),
            "count": 0
        }
        print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()