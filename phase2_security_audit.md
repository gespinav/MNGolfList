# Phase 2 — Part B: Security Audit · `mn_golf_v15.html`

**Scope:** Single-file client-side PWA (HTML/CSS/inline JS), no backend. ~226 KB of inline JS, syntax-validated OK via Node `new Function()` parse. No truncation/corruption artifacts in file.
**Threat model:** It's a local-first app with no server, no auth, no third-party data ingestion except (a) a user-chosen JSON backup file and (b) Leaflet from cdnjs. So the realistic risks are: XSS via rendered data, untrusted-import handling, external-link/scheme abuse, and CDN supply chain.

**Verdict: Strong. No high/critical findings.** A few low-severity hardening items below.

---

## What's already done right (verified, not assumed)
- **Central HTML escaper** `escHtml()` (line 1026) escapes `& < > " '` and is applied **49×** across the codebase.
- **Round history** (the only free-text user input — `notes`, `tee`, `date`) is escaped at every render site: lines 3800–3802 (card) and 3857–3859 (modal). `r.gross`/`r.ts` are numeric.
- **External links** go through `safeExternalLink()` (line 3192): rejects any URL not matching `^https?://`, escapes href + label, adds `rel="noopener noreferrer"`. Map links (`window.open(..., 'noopener,noreferrer')`) use generated URLs, not user input.
- **Photos** rendered via DOM construction (`createElement` + `textContent`), not `innerHTML` interpolation (refreshCardPhoto, line 1439). MIME allow-list + 15 MB cap + client compression (1399–1408).
- **Data import** (`applyImport`, line 4215): validates object shape, allow-lists fields, coerces types (`parseInt`/`String().slice()`), clamps gross to 40–180, dedups by `ts`, **merges (never deletes)**, behind `window.confirm`. This is the highest-risk surface and it's handled well.
- **Storage** wrapped in try/catch with quota detection (`safeStorageSet`); `safeStorageGet` fails closed to a fallback.
- **CSP present** (meta, line 9): `default-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'none'`, `object-src` covered by default-src.
- **Leaflet SRI**: integrity hashes on both CSS and JS, `crossOrigin=anonymous`.

---

## Findings (low severity — hardening, not vulnerabilities)

### L1 — `played` import not type-coerced or validated (line 4248–4252)
`data.played.forEach(id => played.add(id))` adds raw values from the backup file to the played Set. Non-numeric/duplicate ids are harmless downstream (`courses.find` simply won't match, bucket math uses `played.size`), but they pollute the set and get re-serialized.
**Fix:** `const id = parseInt(idStr/val); if (Number.isInteger(id) && courses.some(c=>c.id===id) && !played.has(id)) { played.add(id); mergedPlayed++; }`

### L2 — Imported `rounds` keys used in a `querySelector` (line 4296–4298)
`document.querySelector(\`.card[data-id="${idStr}"]...\`)` where `idStr` is an untrusted object key. Not XSS (querySelector never executes script), but a key containing `"` could throw a SyntaxError and abort the post-import UI refresh. Cosmetic/robustness only.
**Fix:** coerce/guard: `const nId = parseInt(idStr); if (!Number.isInteger(nId)) return;` and select with `[data-id="${nId}"]`.

### L3 — CSP allows `'unsafe-inline'` for scripts (line 11)
Required because the entire app is one inline `<script>` — removing it would break the app, and as a single static file there's no nonce pipeline. Accept as a documented trade-off. If this ever moves to a build step, switch to a hashed/nonce CSP and drop `'unsafe-inline'`.
**No code change recommended** for the single-file architecture; noted for the record.

### L4 — `version: 'v15'` in export + stale title (line 6, 4153)
Cosmetic, but the file is now post-edit (71 courses, Phase 1+2 data work). Recommend bumping the visible version string and `<title>` when we cut the release so exported backups are traceable. (Defer to launch.)

---

## Not findings (checked, OK)
- No `eval`, `new Function` (except my own audit probe), `document.write`, or `.innerHTML =` with unescaped dynamic data in render paths.
- `desc`/`awards`/`tags`/`notes` come from the in-file `courses` array (trusted authored content), and are still escaped at render anyway.
- CSV export quotes/escapes every field (`"` → `""`, line 4181). Note: classic CSV-injection (leading `=,+,-,@`) is **not** neutralized — but this CSV is the user's own data opened by the user, so risk is negligible. Optional: prefix risky cells with `'`.
- Service worker present (line 4347+) — offline cache strategy; not a security concern for this review.

---

## Recommended actions
1. Apply **L1 + L2** (tiny, safe, improves import robustness) — can do now.
2. **L4** version bump — defer to release cut.
3. **L3** — document as accepted; no change while single-file.
