import sys
import json
import io
import urllib.request
import unicodedata
from datetime import datetime
from collections import Counter


# Important pour .NET + Windows : sortie UTF-8 stable
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


def norm(value):
    if value is None:
        return ""

    text = str(value).strip().lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = " ".join(text.split())

    return text


def safe_get(item, *keys, default=""):
    if not isinstance(item, dict):
        return default

    for key in keys:
        value = item.get(key)
        if value not in [None, ""]:
            return str(value).strip()

    return default


def parse_date(value):
    if not value:
        return None

    raw = str(value).strip()

    if not raw:
        return None

    # Date courte : 18/05
    try:
        if len(raw) == 5 and raw[2] in ["/", "-", "."]:
            day = int(raw[0:2])
            month = int(raw[3:5])

            return datetime(
                year=datetime.now().year,
                month=month,
                day=day
            )
    except Exception:
        return None

    formats = [
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d.%m.%Y",
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f"
    ]

    for fmt in formats:
        try:
            return datetime.strptime(raw, fmt)
        except Exception:
            pass

    return None


def extract_items(parsed):
    if isinstance(parsed, list):
        return parsed

    if isinstance(parsed, dict):
        for key in ["items", "data", "result", "results", "rows", "value"]:
            value = parsed.get(key)
            if isinstance(value, list):
                return value

    return []


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

        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read().decode("utf-8")
            parsed = json.loads(data)
            return extract_items(parsed)

    data_path = payload.get("dataPath")

    if data_path:
        with open(data_path, "r", encoding="utf-8") as file:
            parsed = json.load(file)
            return extract_items(parsed)

    return []


def normalize_items(items):
    normalized = []

    for item in items:
        statut = safe_get(item, "statut", "status", default="Non défini")
        position = safe_get(item, "postion", "position", "phase", "etape", default="Non défini")
        nature = safe_get(item, "nature", "typeProjet", "produit", default="Non défini")

        client = safe_get(
            item,
            "rs",
            "client",
            "raisonSociale",
            "nomClient",
            "name",
            default="Client non défini"
        )

        code_client = safe_get(item, "codeClient", "code", "customerCode", default="")

        team_r = safe_get(item, "teamR", "equipeR", "teamRedaction", "equipeRedaction", default="")
        team_g = safe_get(item, "teamG", "equipeG", "teamGraphisme", "equipeGraphisme", default="")

        redacteur = safe_get(item, "redacteur", "writer", default="")
        graphiste = safe_get(item, "graphiste", "designer", default="")

        etat_r = safe_get(item, "etatR", default="")
        etat_g = safe_get(item, "etatG", default="")
        etat_cqi = safe_get(item, "etatCqi", "etatCQI", default="")
        etat_cqc = safe_get(item, "etatCqc", "etatCQC", default="")

        livraison_prevue = safe_get(
            item,
            "dateLivraisonPrevue",
            "datePrevue",
            "deadline",
            "dateEcheance",
            default=""
        )

        livraison = safe_get(
            item,
            "dateLivraison",
            "dateLivraisonReelle",
            "deliveryDate",
            default=""
        )

        date_reception = safe_get(item, "dateReception", "receptionDate", default="")

        page = safe_get(item, "page", "pages", default="0")
        charge = safe_get(item, "estimation", "charge", "estimatedTime", default="0")

        try:
            page = int(float(str(page).replace(",", ".")))
        except Exception:
            page = 0

        try:
            charge = float(str(charge).replace(",", "."))
        except Exception:
            charge = 0

        normalized.append({
            "statut": statut,
            "statutNorm": norm(statut),

            "position": position,
            "positionNorm": norm(position),

            "nature": nature,
            "natureNorm": norm(nature),

            "client": client,
            "clientNorm": norm(client),

            "codeClient": code_client,
            "codeClientNorm": norm(code_client),

            "teamR": team_r,
            "teamG": team_g,

            "redacteur": redacteur,
            "graphiste": graphiste,

            "etatR": etat_r,
            "etatG": etat_g,
            "etatCqi": etat_cqi,
            "etatCqc": etat_cqc,

            "etatRNorm": norm(etat_r),
            "etatGNorm": norm(etat_g),
            "etatCqiNorm": norm(etat_cqi),
            "etatCqcNorm": norm(etat_cqc),

            "dateLivraisonPrevue": livraison_prevue,
            "dateLivraison": livraison,
            "dateReception": date_reception,

            "dateLivraisonPrevueParsed": parse_date(livraison_prevue),
            "dateLivraisonParsed": parse_date(livraison),
            "dateReceptionParsed": parse_date(date_reception),

            "page": page,
            "charge": charge
        })

    return normalized


def is_delivered(item):
    statut = item.get("statutNorm", "")
    return "livre" in statut


def is_validated(item):
    statut = item.get("statutNorm", "")
    return "valide" in statut


def is_finished(item):
    return is_delivered(item) or is_validated(item)


def is_retour(item):
    values = [
        item.get("statutNorm", ""),
        item.get("positionNorm", ""),
        item.get("etatRNorm", ""),
        item.get("etatGNorm", ""),
        item.get("etatCqiNorm", ""),
        item.get("etatCqcNorm", "")
    ]

    return any(
        "retour cq" in value
        or "retour" in value
        or "non conforme" in value
        or value == "ko"
        for value in values
    )


def is_delivered_on_time(item):
    if not is_delivered(item):
        return False

    due = item.get("dateLivraisonPrevueParsed")
    delivered = item.get("dateLivraisonParsed")

    if not due or not delivered:
        return False

    due = due.replace(hour=23, minute=59, second=59, microsecond=999999)
    delivered = delivered.replace(hour=0, minute=0, second=0, microsecond=0)

    return delivered <= due


def is_delivered_late(item):
    if not is_delivered(item):
        return False

    due = item.get("dateLivraisonPrevueParsed")
    delivered = item.get("dateLivraisonParsed")

    if not due or not delivered:
        return False

    due = due.replace(hour=23, minute=59, second=59, microsecond=999999)
    delivered = delivered.replace(hour=0, minute=0, second=0, microsecond=0)

    return delivered > due


def is_operational_late(item):
    due = item.get("dateLivraisonPrevueParsed")

    if not due:
        return False

    if is_finished(item):
        return False

    today = datetime.now().date()
    return due.date() < today


def is_urgent(item):
    due = item.get("dateLivraisonPrevueParsed")

    if not due:
        return False

    if is_finished(item):
        return False

    today = datetime.now().date()
    diff_days = (due.date() - today).days

    return 0 <= diff_days <= 1


def build_summary(items):
    total = len(items)

    statuts = Counter(item["statut"] for item in items)
    positions = Counter(item["position"] for item in items)
    natures = Counter(item["nature"] for item in items)

    delivered = [item for item in items if is_delivered(item)]
    delivered_on_time = [item for item in items if is_delivered_on_time(item)]
    delivered_late = [item for item in items if is_delivered_late(item)]

    retours = [item for item in items if is_retour(item)]
    overdue = [item for item in items if is_operational_late(item)]
    urgent = [item for item in items if is_urgent(item)]

    upcoming = [
        item for item in items
        if item.get("dateLivraisonPrevueParsed")
        and not is_finished(item)
        and item["dateLivraisonPrevueParsed"].date() >= datetime.now().date()
    ]

    teams = Counter()
    redacteurs = Counter()
    graphistes = Counter()

    for item in items:
        if item["teamR"]:
            teams[item["teamR"]] += 1

        if item["teamG"]:
            teams[item["teamG"]] += 1

        if item["redacteur"]:
            redacteurs[item["redacteur"]] += 1

        if item["graphiste"]:
            graphistes[item["graphiste"]] += 1

    charge_total = sum(item["charge"] for item in items)
    pages_total = sum(item["page"] for item in items)

    return {
        "total": total,

        "delivered": len(delivered),
        "deliveredOnTime": len(delivered_on_time),
        "deliveredLate": len(delivered_late),

        "retours": len(retours),
        "overdue": len(overdue),
        "urgent": len(urgent),
        "upcoming": len(upcoming),

        "chargeTotal": charge_total,
        "pagesTotal": pages_total,

        "statuts": statuts,
        "positions": positions,
        "natures": natures,
        "teams": teams,
        "redacteurs": redacteurs,
        "graphistes": graphistes,

        "overdueItems": overdue,
        "urgentItems": urgent,
        "upcomingItems": upcoming,
        "retourItems": retours,
        "deliveredLateItems": delivered_late
    }


def format_counter(counter, limit=8):
    if not counter:
        return "Aucune donnée disponible."

    lines = []

    for label, count in counter.most_common(limit):
        lines.append(f"- {label} : {count}")

    return "\n".join(lines)


def format_items(items, limit=8, include_reason=False):
    if not items:
        return "Aucun dossier trouvé."

    lines = []

    for item in items[:limit]:
        line = (
            f"- {item['client']} ({item['codeClient']}) : "
            f"{item['nature']} - {item['position']} - {item['statut']}"
        )

        if item.get("dateLivraisonPrevue"):
            line += f" - prévue le {item['dateLivraisonPrevue']}"

        if include_reason:
            if is_operational_late(item):
                line += " - raison : date prévue dépassée et dossier non finalisé"
            elif is_urgent(item):
                line += " - raison : livraison prévue aujourd’hui ou demain"
            elif is_retour(item):
                line += " - raison : retour CQ / non conforme"

        lines.append(line)

    return "\n".join(lines)


def answer_question(question, items):
    q = norm(question)
    summary = build_summary(items)

    if not items:
        return (
            "Je n’ai pas réussi à charger les données du dashboard. "
            "Vérifie le lien API configuré côté backend ou le payload envoyé au chatbot."
        )

    if any(word in q for word in ["bonjour", "salut", "hello", "hi"]):
        return (
            "Bonjour, je suis l’assistant Triweb. "
            "Je peux répondre sur les dossiers, retards, statuts, équipes, retours CQ, "
            "livraisons et charge de production."
        )

    if any(word in q for word in ["combien", "total", "nombre", "dossiers"]):
        return (
            f"Le périmètre actuel contient {summary['total']} dossiers.\n"
            f"- Livrés : {summary['delivered']}\n"
            f"- Livrés à temps : {summary['deliveredOnTime']}\n"
            f"- Livrés en retard : {summary['deliveredLate']}\n"
            f"- En retour CQ / non conformes : {summary['retours']}\n"
            f"- Retards opérationnels : {summary['overdue']}\n"
            f"- Urgences J/J+1 : {summary['urgent']}\n"
            f"- Pages totales : {summary['pagesTotal']}\n"
            f"- Charge totale estimée : {summary['chargeTotal']:.0f} h"
        )

    if any(word in q for word in ["retard", "depasse", "depassé", "dépassé", "urgence", "urgent"]):
        if summary["overdue"] == 0 and summary["urgent"] == 0:
            return "Aucun retard opérationnel ou urgence J/J+1 détecté sur le périmètre chargé."

        lines = []

        if summary["overdue"] > 0:
            lines.append(f"{summary['overdue']} dossier(s) en retard opérationnel :")
            lines.append(format_items(summary["overdueItems"], 8, include_reason=True))

        if summary["urgent"] > 0:
            lines.append("")
            lines.append(f"{summary['urgent']} dossier(s) en urgence J/J+1 :")
            lines.append(format_items(summary["urgentItems"], 8, include_reason=True))

        return "\n".join(lines).strip()

    if any(word in q for word in ["livre", "livré", "livraison", "date livraison"]):
        return (
            f"Livraisons :\n"
            f"- Dossiers livrés : {summary['delivered']}\n"
            f"- Livrés à temps : {summary['deliveredOnTime']}\n"
            f"- Livrés en retard : {summary['deliveredLate']}\n\n"
            f"Dossiers livrés en retard :\n"
            f"{format_items(summary['deliveredLateItems'], 8)}"
        )

    if any(word in q for word in ["statut", "status", "repartition", "répartition"]):
        return "Répartition des statuts :\n" + format_counter(summary["statuts"], 10)

    if any(word in q for word in ["position", "phase", "etape", "étape"]):
        return "Répartition par position / étape :\n" + format_counter(summary["positions"], 10)

    if any(word in q for word in ["nature", "produit", "type"]):
        return "Répartition par nature de projet :\n" + format_counter(summary["natures"], 10)

    if any(word in q for word in ["equipe", "équipe", "team"]):
        return "Répartition par équipe :\n" + format_counter(summary["teams"], 12)

    if any(word in q for word in ["redacteur", "rédacteur", "redaction", "rédaction"]):
        return "Répartition par rédacteur :\n" + format_counter(summary["redacteurs"], 12)

    if any(word in q for word in ["graphiste", "graphisme"]):
        return "Répartition par graphiste :\n" + format_counter(summary["graphistes"], 12)

    if any(word in q for word in ["retour", "non conforme", "cq"]):
        if summary["retours"] == 0:
            return "Aucun dossier en retour CQ ou non conforme détecté."

        return (
            f"{summary['retours']} dossier(s) en retour CQ / non conforme :\n"
            f"{format_items(summary['retourItems'], 10, include_reason=True)}"
        )

    if any(word in q for word in ["planning", "planification", "prochaine", "prochaines", "prevu", "prévu"]):
        if summary["upcoming"] == 0:
            return "Aucune livraison à venir détectée."

        sorted_items = sorted(
            summary["upcomingItems"],
            key=lambda x: x["dateLivraisonPrevueParsed"] or datetime.max
        )

        return (
            "Prochaines livraisons prévues :\n"
            + format_items(sorted_items, 10)
        )

    matches = []

    for item in items:
        if q in item["clientNorm"] or q in item["codeClientNorm"]:
            matches.append(item)

    if matches:
        return (
            f"{len(matches)} dossier(s) trouvé(s) :\n"
            + format_items(matches, 10)
        )

    return (
        "Je peux répondre sur les dossiers, les retards, les statuts, les équipes, "
        "la planification, les retours CQ, les livraisons, les rédacteurs et les graphistes.\n"
        "Exemples :\n"
        "- Combien de dossiers actifs ?\n"
        "- Quels dossiers sont en retard ?\n"
        "- Donne-moi la répartition par statut.\n"
        "- Quelle est la charge par équipe ?\n"
        "- Quels dossiers sont en retour CQ ?\n"
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