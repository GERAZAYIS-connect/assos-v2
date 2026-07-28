# Assos 2.0

Plateforme SaaS de gestion associative, tontines et mutuelles adaptée au contexte africain.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | NestJS + DDD + Prisma |
| Frontend | Next.js 15 + App Router |
| Base de données | Supabase (PostgreSQL) |
| Cache / Queues | Upstash Redis + BullMQ |
| Auth | NextAuth v5 + JWT RS256 |
| Paiements | FreeMoPay (MTN MoMo + Orange Money) |
| Monorepo | pnpm workspaces + Turborepo |

## Démarrage rapide

### Prérequis
- Node.js ≥ 20
- pnpm ≥ 10
- Un projet Supabase créé

### 1. Cloner et installer

```bash
git clone <repo>
pnpm install
```

### 2. Variables d'environnement

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Frontend
cp .env.example .env.local
```

Remplissez les valeurs dans `apps/api/.env` (Supabase URLs, JWT keys).

**Générer les clés JWT RS256 :**
```bash
# Générer la paire de clés
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Copier en une ligne (requis pour .env)
cat private.pem | tr '\n' '\\n'
```

### 3. Base de données

```bash
# Créer la migration initiale (nécessite DIRECT_URL dans .env)
pnpm db:migrate:dev --name init

# Ouvrir Prisma Studio
pnpm db:studio
```

### 4. Lancer en dev

```bash
# Les deux apps en parallèle
pnpm dev

# Ou individuellement
pnpm --filter @assos/api start:dev    # API sur http://localhost:4000
pnpm --filter @assos/web dev          # Web sur http://lvh.me:3000
```

### Accès local (sous-domaines)

`*.lvh.me` résout automatiquement vers `127.0.0.1`.

| URL | Description |
|-----|-------------|
| `http://lvh.me:3000` | Site vitrine |
| `http://mon-asso.lvh.me:3000` | Espace association "mon-asso" |
| `http://localhost:4000/api/docs` | Swagger API |

## Structure du monorepo

```
assos-v2/
├── apps/
│   ├── api/           ← NestJS (DDD)
│   │   ├── src/
│   │   │   ├── core/          ← Prisma, Audit, Exceptions
│   │   │   ├── config/        ← Zod config validator
│   │   │   └── modules/
│   │   │       ├── auth/      ← DDD complet (domain/app/infra/interfaces)
│   │   │       └── associations/
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/           ← Next.js 15
│       └── app/
│           ├── (auth)/        ← login, register
│           ├── [tenant]/      ← espace association
│           └── globals.css    ← Design System MD3
└── packages/
    ├── shared/        ← Enums et types communs
    └── config/        ← tsconfig partagé
```

## Architecture DDD

Chaque module backend suit le pattern :

```
modules/<name>/
├── domain/          ← Entités, VOs, interfaces (0 dépendance framework)
├── application/     ← Use cases (orchestration pure)
├── infrastructure/  ← Implémentations Prisma, adapters
└── interfaces/http/ ← Controllers, DTOs NestJS
```

## Feuille de route

Voir le cahier des charges : [cahier-des-charges-final-monassociation.md](./cahier-des-charges-final-monassociation.md)

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1 | Monorepo + auth + associations | ✅ En cours |
| 2 | Caisses, prêts, tontine fixe (MVP) | ⏳ Planifié |
| 3 | Sous-domaines, invitations, membres | ⏳ Planifié |
| 4 | Paiements FreeMoPay | ⏳ Planifié |
| 5 | Modules avancés + IA + backoffice | ⏳ Planifié |
| 6 | Recette & hardening | ⏳ Planifié |
