# Triweb - template conservée + dashboard modernisé

Cette version conserve la template Fuse/Triweb existante : login, sign-in, sign-out, sidebar Triweb, header avec icônes, drawer thème sombre/clair et structure globale.

Corrections incluses :

- Correction TypeScript `TS2322: Type 'unknown' is not assignable to type 'string'` dans Dashboard et Planification.
- Compatibilité Node.js 20 avec `--openssl-legacy-provider` directement dans `npm start` et `npm run build`.
- Source de données configurable par lien API, sans obligation de lire directement un dossier JSON.
- Dashboard général séparé de l'interface Planification.
- Recherche globale, filtres par date/statut/nature/position/équipe.
- Graphiques dynamiques : histogrammes, camemberts, barres et courbes.
- Chatbot fixe en bas de l'interface.
- Power BI et Modèles IA conservés dans le menu.
- Fichier Python d'analyse inclus.

## 1. Prérequis

- Node.js 16 conseillé pour Angular 12. Node.js 20 fonctionne aussi avec les scripts fournis.
- .NET SDK 8.
- Python 3.10+ pour le script d'analyse.

## 2. Configurer le lien API source

Le frontend appelle le backend .NET via :

```text
frontend/src/assets/app-config.json
```

Exemple :

```json
{
  "apiBaseUrl": "http://localhost:5000"
}
```

Le backend .NET récupère ensuite les données dashboard depuis un lien API configurable dans :

```text
backend/appsettings.json
```

Exemple avec votre future API :

```json
{
  "DashboardSource": {
    "ApiUrl": "https://votre-domaine.com/api/dashboard/items",
    "UseLocalFallback": false
  }
}
```

Important :

- `ApiUrl` doit contenir le lien réel de votre API de données.
- `UseLocalFallback: false` force l'utilisation du lien API uniquement.
- Le fichier `backend/Data/api.json` reste uniquement un jeu de démonstration si `ApiUrl` est vide ou si `UseLocalFallback` est à `true`.

## 3. Lancer le backend .NET

```powershell
cd backend
$env:ASPNETCORE_URLS="http://localhost:5000"
dotnet restore
dotnet run
```

API disponible par défaut :

```text
http://localhost:5000/api/health
http://localhost:5000/api/dashboard/items
http://localhost:5000/api/dashboard/overview
http://localhost:5000/api/dashboard/planification
http://localhost:5000/api/menu
http://localhost:5000/api/user
```

## 4. Lancer le frontend Angular

Dans un deuxième terminal :

```powershell
cd frontend
npm install
npm start
```

Interface :

```text
http://localhost:4200
```

Identifiants :

```text
Email : admin@triweb.com
Mot de passe : admin
```

## 5. Lancer le script Python

Depuis la racine du projet :

```powershell
python tools/dashboard_analyzer.py http://localhost:5000/api/dashboard/items
```

Ou sur le jeu de démonstration local :

```powershell
python tools/dashboard_analyzer.py backend/Data/api.json
```

## 6. Remarques importantes

- La template originale est conservée. Les changements concernent surtout le contenu des pages Dashboard et Planification.
- Le menu affiche les interfaces utiles : Dashboard général, Planification, Power BI et Modèles IA.
- Le bouton réglages à droite conserve la gestion des thèmes sombre/clair de l'ancienne version.
