# Triweb Fuse-style Angular Dashboard

Adaptation d'un dashboard Angular/.NET 8 inspiré d'un template Fuse + DevExpress, recoloré selon le logo Triweb :
- fond gris clair
- accents rouge Triweb
- anthracite à la place du bleu
- page de login en premier
- navigation métier : Dashboard, Production, Planification, Performance, Disponibilité, Modèles IA

## Structure
- `frontend/` : Angular 18
- `backend/` : ASP.NET Core .NET 8
- `database/` : scripts utilitaires SQL Server

## Pré-requis
- SQL Server
- .NET 8 SDK
- Node.js 20+
- npm

## 1) Restaurer la base
Vous avez fourni `TriwebDW.bak` séparément. Restaurez-la dans SQL Server avec le nom `TriwebDW`.

## 2) Connexion SQL Server
Le backend est déjà configuré pour utiliser :
- utilisateur : `sa`
- mot de passe : `sa`

Chaîne de connexion dans `backend/appsettings.json` :
```json
"TriwebDW": "Server=localhost;Database=TriwebDW;User Id=sa;Password=sa;TrustServerCertificate=True;Encrypt=False;"
```

## 3) Lancer le backend
```powershell
cd backend
dotnet restore
dotnet run --urls=http://localhost:5000
```

Test santé :
```text
http://localhost:5000/api/health
```

## 4) Lancer le frontend
```powershell
cd frontend
npm install
npm run start
```

## 5) Ouvrir l'application
```text
http://localhost:4200
```

## Identifiants de démo
```text
admin@triweb.tn / triweb2026
```

## APIs exposées
- `/api/health`
- `/api/dashboard/meta`
- `/api/dashboard/overview`
- `/api/dashboard/production`
- `/api/dashboard/performance`
- `/api/dashboard/planification`
- `/api/dashboard/disponibilite`
- `/api/dashboard/models-ia`

## Note importante
Dans cet environnement, je n'ai pas pu décompresser directement le `.rar` source du template Fuse/DevExpress fourni. J'ai donc livré une adaptation Angular professionnelle inspirée de cette structure visuelle, avec :
- login d'entrée
- shell applicatif latéral
- composants KPI, charts, tables, listes, états vides
- couleurs et branding Triweb
- données de vos APIs injectées dans les vues
- backend prêt à être reconnecté à la base TriwebDW

Le backend embarque aussi des données de secours cohérentes avec les JSON que vous avez fournis, pour éviter les écrans vides pendant l'intégration finale.
