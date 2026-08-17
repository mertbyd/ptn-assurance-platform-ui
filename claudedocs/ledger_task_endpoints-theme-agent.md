# Görev defteri — eksik uçlar, API Contract teması, ajan sohbeti

- **Tarih:** 2026-08-17 · **Depo:** `ptn-assurance-platform-ui` (Git yok → commit yerine defter)
- **Kapılar:** `tsc --noEmit` 0 · `eslint src` 0 hata / 0 uyarı · `next build` 0 uyarı, 26/26 sayfa

---

## 1. Eksik API uçları — istemci katmanı 190/190

Kaynak doğrulamalı envanterdeki 40 eksik uç eklendi.

| Dosya | Eklenen |
|---|---|
| `src/api/test.ts` | **24** — 9 köprü + `invariants/check`, 5 ortam bağlama, `coverage`, 5 lookup get-by-id + `failure-categories` listesi, `runs/{id}/start`, `runs/{id}/terminal` |
| `src/api/checker.ts` | **7** — `contract-checks/conformance/*` ailesinin tamamı |
| `src/api/lookups.api.ts` | **1** — lookup `get(kind, id)` |
| `src/api/db.ts` | **4** — `assertions/batch`, write-set `probe`/`capture`/`release` |

Bilinçli olarak **eklenmedi:** `POST /api/test-module/runs/webhook` — anonim, paylaşılan sırla
korunur ve istemcide tanımlanmaz (CURRENT-0007 G-14).

**Tipleme:** Ortam bağlama, kapsam raporu, koşum claim ve terminal DTO'ları backend
`Application.Contracts` kaynağından okunup birebir yazıldı. Köprü ve conformance yanıtları
üretilmiş şemada olmadığı için `unknown`; G-03'te gerçek DTO ile değişecekler.

**Ortam formu notu:** `TestEnvironmentBindingDto` sır **değeri** taşımaz, yalnız Vault referans
anahtarı. Form parola alanı göstermeyecek — CURRENT-0007 G-08.

---

## 2. API Contract teması — mavi lekeler kırmızıya

**Kök neden:** `data-module="api"` kırmızı aksanı zaten set ediyordu, ama `features/*`
bileşenleri Chakra'nın **sabit `blue.*` / `brand.*` paletlerini** kullanıyordu. Bu paletler
`--acc` değişkenini hiç okumaz, dolayısıyla modül teması onları etkilemiyordu.

| Değişiklik | Adet |
|---|---|
| `theme/system.ts` — Chakra v3 `colorPalette` slotları eklendi (`contrast`/`fg`/`muted`/`subtle`/`emphasized`) | 5 token |
| `colorPalette="blue"` → `colorPalette="accent"` | 25 |
| `blue.100/200/300` → `ink.strong/muted/faint` | 21 |
| `brand.50…950` → `accent.soft/border/solid/hover` · `app.rail` · `ink.strong` | 28 |
| `var(--acc-colors-brand-300)` → `var(--acc)` | 1 |
| Sabit hex: `#60a5fa` (source-card), `#5f88f4`/`#bdd1ff`/`#0b1739`/`#dce8ff` (api-topology) → `var(--acc*)` | 5 |
| `agent-bot.tsx` `brand.950/800` → `app.rail` / `accent.soft` | 3 |

Toplam **88 değişiklik, 28 dosya**. `src/features/` altında sabit mavi/brand kalmadı.

Yan etkisi bilinçli: aynı bileşenler Database Checker'da mavi, Test Platform'da amber,
Ekip'te mor görünür — hepsi `--acc`'yi izler.

---

## 3. Ajan sohbeti — panel büyütüldü

Petin istenen davranışları **zaten kuruluydu** ve korundu:
sürükleme (`pointer capture` + 5px eşik), tıklayınca köşeye koşarak dönme
(`is-docking` + `ptn-agent-run` animasyonu, 560 ms), laptop açılması (`Laptop`,
meşgul/açıkken), viewport sınırlarında tutma (`clampAgentOffset`).

Eksik olan panel boyutuydu:

| Ölçü | Önce | Sonra |
|---|---|---|
| Genişlik | `min(390px, 100vw-150px)` | `min(620px, 100vw-140px)` |
| Yükseklik | `min(480px, 100dvh-142px)` | `min(720px, 100dvh-140px)` |
| Min yükseklik | 330px | 420px |
| Mesaj punto / dolgu | 12px / 8-11px | 13.5px / 10-13px |
| Girdi yüksekliği | 38px | 44px |
| Mobil yükseklik | `min(440px, …)` | `min(560px, …)` |

Gerekçe: onay kartı dört alanı (ne / neden / ne değişecek / nasıl geri alınır) kırpılmadan
göstermek zorunda — CURRENT-0007 G-03.

---

## Yapılmayanlar

| İstek | Durum |
|---|---|
| Test tarafı AI-hazır UI (örnek tasarım) | **Yapılmadı** — ekran tasarımı işi, yön onayı bekliyor |
| DB / API tanesel seçim işlevselliği | **Yapılmadı** — uçlar artık hazır, ekran işi kaldı |
| "Chat botu" | Mevcut `FloatingAgent` beş ajan ucuna `test-agent-context` üzerinden **zaten bağlı**; ayrı bir bot isteniyorsa kapsam netleşmeli |

## Değiştirilen dosyalar (32)

`eslint.config.mjs` yok — bu turda değişmedi.

`src/theme/system.ts` · `src/api/test.ts` · `src/api/checker.ts` · `src/api/db.ts` ·
`src/api/lookups.api.ts` · `src/components/ui/floating-agent.tsx` ·
`src/components/ui/agent-bot.tsx` · `src/features/checks/components/` (12) ·
`src/features/snapshots/components/` (8) · `src/features/sources/components/` (3) ·
`src/features/team/components/` (3) · `src/features/lookups/components/lookup-list.tsx`
