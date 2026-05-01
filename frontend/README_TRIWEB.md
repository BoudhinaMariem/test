# Triweb Front - Fuse + DevExpress

Front Angular basé sur le template Fuse avec adaptation métier Triweb.

## Modules principaux

- Login / Sign-in / Sign-out conservés
- Dashboard général
- Planification
- Power BI
- Modèles IA
- Header avec icônes
- Sidebar Triweb
- Gestion thème sombre/clair

## Lancement

```powershell
npm install
npm start
```

Application :

```text
http://localhost:4200
```

Identifiants de test :

```text
admin@triweb.com / admin
```

## Configuration API backend

Modifier le lien du backend dans :

```text
src/assets/app-config.json
```

Exemple :

```json
{
  "apiBaseUrl": "http://localhost:5000"
}
```

Le frontend ne lit pas directement un dossier JSON : il appelle les endpoints du backend .NET, notamment :

```text
/api/dashboard/items
/api/dashboard/overview
/api/dashboard/planification
/api/menu
/api/user
```

## Routes métier

- `/triweb/dashboard`
- `/triweb/planification`
- `/triweb/powerbi`
- `/triweb/models`
