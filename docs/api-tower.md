# API publique de Tower : référence pour le site

Doc fournie par Jules le 25/11/2026 (relevée dans le code de `seat12a/tower`), rangée ici pour le site. Les exemples de
code de la doc d'origine sont devenus `src/lib/tower.js` et `src/lib/labels.js`. Ce que le site en fait :
`fact-checks.md`.

> **État de la production au 25/11/2026** (testé sur `https://api.seat12a.org`) : `/health`, `/ready`, l'ancienne
> liste `/v1/cases`, `/v1/cases/{id}`, le verdict d'un post, les badges et le catalogue d'erreurs répondent. **Mais
> `/v1/cases/search`, `/v1/cases/stats` et `/v1/cases/{id}/details` n'existent pas encore** : `search` et `stats`
> tombent sur la route `/v1/cases/{public_id}` (422, « Input should be a valid UUID »), `details` répond 404
> `TWR-GEN-002`. Le code `TWR-DOS-008` n'est pas non plus dans le catalogue. Le site se replie sur l'ancienne liste
> en attendant (voir `fact-checks.md`). Un seul case est publié : « 1+1=4 », un case de test.

## 1. Généralités

- **URL** : `https://api.seat12a.org`. Routes en `/v1/...`, sauf `/health` et `/ready`. Réglable côté site par
  `TOWER_API_URL` (pas secret).
- **Authentification : aucune.** Ne jamais mettre de token d'équipe dans le site (il donne accès aux cases non publiés,
  brouillons, contacts des demandeurs). Sans token, l'API ne montre que les cases publiés, les verdicts validés, les
  badges actifs. Elle ne renvoie jamais l'auteur ni le texte d'un post : on l'affiche par l'embed de la plateforme.
- **CORS** : variable `TOWER_CORS_ORIGINS` du service gate. `https://seat12a.org` y est ; les domaines de
  prévisualisation Vercel n'y sont pas. Le site appelle Tower **depuis le serveur**, donc ça ne le concerne pas.
- **Cache** : cases, verdict d'un post, détail d'un badge : `public, max-age=300`. Lookup de badges : idem + `ETag`.
  Catégories : 24 h. Logos : 1 an, immuables. Erreurs : pas de cache.
- **Formats** : JSON UTF-8 ; dates ISO 8601 avec fuseau, dates seules en `AAAA-MM-JJ` ; identifiants en UUID ; **IDs
  de posts et de comptes toujours en chaînes** (jamais `Number`). `X-Request-ID` facultatif, renvoyé tel quel.
- **Limites** : pas de limite sur les lectures. Soumissions (badges) : par IP, 10 d'affilée puis 1 par minute, sinon
  `429 TWR-BDG-019`.

### Erreurs

```json
{ "error": { "code": "TWR-DOS-001", "message": "Case not found", "details": { }, "request_id": "9f2c4e…" } }
```

Tester `code` (stable), jamais `message` (anglais, pas pour l'affichage). Pour une 422, `details.errors` liste les
champs. Communs : `404 TWR-GEN-002` route inconnue, `422 TWR-GEN-001` paramètre invalide, `429 TWR-GEN-004`,
`500 TWR-INT-001`, `503 TWR-DB-001`. Liste complète : `GET /v1/errors/catalog`.

## 2. Valeurs possibles

Libellés français dans `src/lib/labels.js`.

- `veracity` : `true` Vrai, `mostly_true` Plutôt vrai, `misleading` Trompeur, `false` Faux, `unverifiable` Non
  vérifiable.
- `context_need` : `none`, `useful` (contexte utile), `necessary` (contexte nécessaire).
- `context_types` (plusieurs) : `outdated`, `recycled_media`, `manipulated_media`, `cherry_picking`,
  `missing_baseline`, `quote_integrity`, `misrepresented_source`, `causation`, `definition`, `scope`, `procedure`,
  `scientific_uncertainty`, `satire`, `missing_event_context`, `developing`.
- `claim_type` : `statistic`, `historical_fact`, `quote`, `legal_text`, `ongoing_situation`, `procedure`, `record`,
  `conduct`, `accusation`, `prediction`, `opinion`, `causal`, `other`.
- `kind` : `fact_check`, `moderation` (jamais de verdict).
- `verdict_state` : `current` ; `expired` (bandeau « Vérification du JJ/MM/AAAA, susceptible d'être dépassée ») ;
  `superseded` (bandeau « Ce verdict a été mis à jour ») ; `null` (pas de pastille).
- `platform` : `x`, `bluesky`, `threads`, `mastodon`, `youtube`, `tiktok`, `telegram`, `web`.
- Pays : ISO 3166 en majuscules, plus `EU` et `INT`.
- Badges : `institutional` (#F46600 / #FF6A00), `media` (#EA00FF / #EE33FF), `expert` (#16A34A), `organization`
  (#E30B5C), `verified` (#335CFF / #6D8AFF), dans cet ordre de priorité.
- Motifs de signalement : `wrong_category`, `not_eligible`, `impersonation`, `wrong_affiliation`, `other`.

## 3. Cases

### 3.1 `GET /v1/cases/search`

Paramètres (facultatifs) : `q` (200 car.), `veracity` (répétable), `claim_type` (répétable), `context_need`, `kind`,
`lang`, `jurisdiction`, `platform`, `since` (inclus), `until` (exclu), `sort` (`newest`, `oldest`, `relevance`),
`page` (≥ 1), `per_page` (1 à 100, défaut 20). Filtres différents en ET, valeurs répétées en OU. `status` : réservé à
l'équipe, ne pas l'utiliser.

Recherche `q` : plein texte français avec racines (`"phrase exacte"`, `-mot`, `or`), plein texte de l'original, ou
sous-chaîne sans casse. Les accents comptent.

Pagination : `total`, `pages` ; page au-delà de la dernière → `items: []` ; `(page - 1) × per_page` < 10 000, sinon
`422 TWR-DOS-008`.

Chaque élément : `public_id`, `kind`, `title` (l'affirmation, en français), `platform`, `x_post_id`, `external_id`,
`url` (lien du post, pour l'embed), `published_url` (le post de Seat 12A sur X), `published_at`, `created_at`,
`updated_at`, `claim_type`, `claim_lang`, `jurisdictions`, `veracity`, `context_need`, `verdict_state`, et `status`,
`priority`, `assigned_to` (toujours `null` en public).

### 3.2 `GET /v1/cases/{public_id}/details?lang=fr`

Tous les champs de 3.1, plus :

- `content` : `{platform, external_id, url, lang}` ou `null`.
- `claim` : `{text, lang, text_fr, claim_type, subject, place, period_start, period_end, jurisdictions}` ou `null`
  (modération).
- `verdict` : `{id, veracity, context_need, context_types, validated_at, expires_at, state}` ou `null`.
- `note` : `{lang, text, fact_sheet, machine_translated, links}` ou `null` (même avec un verdict : note expirée ou pas
  de langue qui convient ; afficher alors la pastille seule). `machine_translated` → « Traduit automatiquement ».
- `posts_count` : posts qui portent la même affirmation (0 sans verdict).
- `timeline` : `received`, `in_review`, `validated`, `published`, du plus ancien au plus récent.
- `internal` : `null`.

Erreurs : `404 TWR-DOS-001` (inconnu ou pas publié : page 404), `422 TWR-GEN-001` (pas un UUID).

### 3.3 `GET /v1/cases/stats`

Les filtres de 3.1 (sans `sort`, `page`, `per_page`) et `interval` (`day`, `week`, `month`). Réponse : `total`,
`by_kind`, `by_veracity` (verdicts validés seulement), `by_claim_type`, `by_lang`, `by_jurisdiction` (20 premiers),
`by_status` (`null`), `interval`, `timeline` (`[{period, count}]`, **périodes vides absentes**), `generated_at`. Clés
triées par compte décroissant, catégories à 0 absentes.

### 3.4 Anciennes routes

`GET /v1/cases?kind=&limit=&before_id=` (200 max) et `GET /v1/cases/{public_id}` : seulement `public_id`, `kind`,
`x_post_id`, `title`, `published_url`, `updated_at`. Le site s'en sert en repli tant que 3.1 et 3.2 manquent.

## 4. Verdict d'un post : `GET /v1/content/{platform}/{external_id}/verdict?lang=fr`

Pour partir d'un post (lien collé). Pour X, l'ID est le nombre après `/status/`. Réponse : `platform`, `external_id`,
`url`, `lang`, `claims` (une entrée par affirmation vérifiée : `text`, `lang`, `veracity`, `context_need`,
`context_types`, `validated_at`, `note`, `inherited`). `inherited` vaut `null` ou `{rule, origin_verdict_id,
origin_url}` avec `rule` = `identical_signature` (même affirmation) ou `band` (même chiffre, dans une fourchette
validée).

Seulement les verdicts **en vigueur** ; pas de lien vers le case. `404 TWR-FCK-013` : « Ce post n'a pas (encore) été
vérifié par Seat 12A ».

## 5. Badges (pas encore utilisés par le site)

- `GET /v1/badges/categories` : catégories, couleurs claire et sombre, rang.
- `GET /v1/badges/accounts/{platform}/{external_id}` : `badge` (ou `null`) et `affiliations` (principale en tête).
  `404 TWR-BDG-001` : pas de badge. Pas de route publique pour passer d'un pseudo à un ID (voulu : API X payante).
- `GET /v1/badges/lookup?platform=x&ids=…` (1 à 100, triés) : un ID absent n'a pas de badge. `ETag`.
- `GET /v1/badges/logos/{sha256}.{ext}` : à utiliser tel quel (en production, un `logo_url` pointe aussi vers
  Wikimedia).
- `POST /v1/badges/requests` : `kind` (`badge` ou `affiliation`), `account {platform, external_id, handle?}`,
  `category` (si badge), `org` (si affiliation), `title`, `justification`, `contact` (lu par l'équipe seulement),
  `evidence_urls` (10 URLs `https` max). `201 {public_id, status: "pending"}`. Erreurs : `TWR-BDG-002`, `-006`,
  `-010`, `-020`, `-013` (demande déjà en cours), `-004`, `TWR-ING-006`, `TWR-GEN-001`, `TWR-BDG-019`.
- `POST /v1/badges/reports` : `account`, `reason`, `comment` (2000). `201 {public_id, status: "open"}`. Rien n'est
  enregistré sur l'auteur. `404 TWR-BDG-001` si le compte n'affiche rien.

## 6. Utilitaires

`GET /health` (`{"status":"ok","version":"…"}`), `GET /ready` (200 ou `503 TWR-DB-001`), `GET /v1/errors/catalog`.

## 7. À ne pas utiliser depuis le site

`/v1/verdict-index/…` (extension), `/v1/ingest/…`, `POST /v1/badges/x-government-hints`, `POST /v1/factcheck/requests`
(demande un token d'équipe : **pas de route publique pour demander un fact-check** ; un formulaire « Signaler un post à
vérifier » demande un nouveau développement dans Tower), et toutes les routes d'équipe.

## 9. Quelle route pour quelle page

| Page | Route(s) | Sur le site |
|---|---|---|
| Liste et recherche | `search` + `stats` (mêmes filtres) | `/fact-checks` |
| Page d'un fact-check | `details?lang=fr` + embed depuis `url` | `/fact-checks/{public_id}` |
| « Ce post a-t-il été vérifié ? » | `content/x/{id}/verdict?lang=fr` | `/post/x/{id}` (lien collé dans la recherche) |
| Accueil : derniers fact-checks, chiffres | `search?per_page=6`, `stats` | pas encore |
| Page par pays ou par thème | `search?jurisdiction=FR`… | filtres de `/fact-checks` |
| Statistiques | `stats?interval=month` | pas encore |
| Badges (légende, compte, demande, signalement) | section 5 | pas encore |
| Statut | `/health`, `/ready` | pas encore |
