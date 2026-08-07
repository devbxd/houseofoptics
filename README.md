# House of Optics — site + dashboard

Site vitrine (Next.js) avec dashboard admin pour gérer catégories, produits,
prix et infos de contact. Les produits de départ sont importés automatiquement
depuis le compte Instagram `@house.of.optics`.

## 1. Créer le projet Supabase

1. Aller sur https://supabase.com, créer un compte gratuit puis un nouveau projet.
2. Dans **Project Settings → API**, récupérer :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret, jamais côté client)
3. Copier `.env.example` vers `.env.local` et remplir ces 3 valeurs.
4. Dans **SQL Editor**, exécuter le contenu de `supabase/migrations/0001_init.sql`
   pour créer les tables.
5. Dans **Authentication → Users**, créer manuellement l'utilisateur admin
   (email + mot de passe) qui se connectera sur `/admin`.

## 2. Importer le catalogue Instagram

```bash
npm install
npm run scrape:instagram   # télécharge photos + légendes dans scripts/scraped/
npm run seed:instagram     # crée les produits + upload les images dans Supabase
```

Tous les produits importés arrivent dans une catégorie "Collection Instagram",
sans prix, `is_active = true`. Depuis `/admin`, on peut ensuite créer de
vraies catégories, déplacer les produits dedans, et ajouter les prix.

## 3. Lancer en local

```bash
npm run dev
```

- Site public : http://localhost:3000
- Dashboard : http://localhost:3000/admin

## 4. Déployer sur Vercel

1. Créer un compte sur https://vercel.com, connecter le repo GitHub du projet.
2. Ajouter les 3 variables d'environnement (mêmes valeurs que `.env.local`).
3. Déployer.

## Notes

- Les images scrapées d'Instagram sont plafonnées par la résolution qu'Instagram
  a elle-même stockée (~1080px max) — c'est la meilleure qualité disponible
  sans que le client fournisse les fichiers originaux.
- Le dashboard permet de tout gérer ensuite sans redéploiement : catégories,
  produits, prix, photos, WhatsApp, email de contact.
