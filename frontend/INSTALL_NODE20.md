# Installation frontend Triweb

Ce projet Angular/Fuse utilise Angular 12 avec des dependances anciennes. Avec Node 18/20 et npm recent, il faut garder l'installation en mode legacy peer deps.

## Commandes recommandees

```powershell
cd frontend
npm install
npm start
```

Le fichier `.npmrc` force deja :

```text
legacy-peer-deps=true
fund=false
audit=false
```

Si npm continue a refuser l'installation, lancer explicitement :

```powershell
npm install --legacy-peer-deps
npm start
```

Avec Node 20, le script `npm start` utilise deja `--openssl-legacy-provider` pour eviter l'erreur OpenSSL/Webpack.
