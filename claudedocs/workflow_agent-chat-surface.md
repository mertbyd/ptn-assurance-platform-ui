# Ajan sohbet yüzeyi — soru kartı, aktivite göstergesi ve durum izomorfizmi

- **Üretildi:** 2026-08-17
- **Kapsam:** `src/components/ui/floating-agent.tsx`, `src/features/test-agent/test-agent-context.tsx`, `src/api/agent.ts`
- **Sınıf:** uygulama planı — **kod yazılmadı, dosya değiştirilmedi**
- **Kardeş belge:** [`workflow_test-workbench-redesign.md`](./workflow_test-workbench-redesign.md) (yerleşim); bu belge **sohbetin içi**
- **Kod kanıtı (bu belgenin otoritesi):** `ptn-test-agent/src/contracts.ts`, `src/http/create-server.ts`,
  `src/agent/authoring-agent.ts`, `src/session/session-store.ts`, `src/config.ts` — 2026-08-17 okuması
- **Dış kanıt:** §6'daki yedi kaynak

---

## 0. Önce düzeltme — wiki bu noktada eskimiş

> [!IMPORTANT] E-3 kapanmış görünüyor; kanıt kaynak kodundadır
> ARCH-0005 §8 boşluk 1–2 ve CURRENT-0007 E-3 *"ajan yüzeyinde kimlik doğrulama yok, tek
> paylaşılan MCP bearer'ı var, tenant izolasyonu ajan sınırında kayboluyor"* diyor. Kod artık
> bunu söylemiyor:

| İddia (wiki) | Kod (2026-08-17) | Kanıt |
|---|---|---|
| Hiçbir uçta authorization okunmuyor | **Beş ucun beşi** `authenticate()` çağırıyor; `Bearer` yoksa `401` | `create-server.ts:32,39,46,54,61,94-113` |
| Kimlik doğrulanmıyor | Token `<AUTH_ORIGIN>/api/authenticator/auth/me`'ye sorularak doğrulanıyor | `create-server.ts:101-105` |
| Oturum sahipliği yok | Oturum `ownerId` taşıyor; başkasının oturumu `403 session_forbidden` | `session-store.ts:44-51` |
| Tek paylaşılan `PTN_MCP_BEARER_TOKEN` | Env şemasında **böyle bir anahtar yok**; gateway her istekte **çağıranın kendi bearer'ını** alıyor | `config.ts:3-13`, `authoring-agent.ts:185-187`, `sdk-mcp-gateway.ts:27-38` |

**Sonuç:** önceki defterin K-1 maddesi ("ajan ekranı üretime çıkamaz") bu kanıtla düşer. Kalan
gerçek sınır ARCH-0005 §8 boşluk 3–4'tür: **oturum kalıcı değil** (`SessionStore` bir `Map`,
`GET session` ucu yok) ve **oturum listesi yok**. Bu bir ürün kararıdır, güvenlik engeli değil.
Wiki'nin ilgili satırları ADR-0001 usulünce "kapandı" olarak işaretlenmelidir — bu belge onu
yapmaz, yalnız ölçümü kaydeder.

---

## 1. İzomorfizm kuralı

Talep şuydu: sohbet yüzeyi backend ile **uyumlu** çalışsın. Bunun mühendislik karşılığı
izomorfizmdir:

> Ajan oturumunun her durumu ekranda **tam bir** görünüme karşılık gelir; ekrandaki her eylem
> backend'in o durumda **kabul ettiği** tam bir çağrıya karşılık gelir. Karşılığı olmayan
> görünüm ve karşılığı olmayan buton **yoktur**.

Bu kuralın iki yönü de bağlayıcıdır:
- **İleri yön (durum → ekran):** backend `input_required` diyorsa ekranda soru kartı **açılır**,
  giriş kutusu **kilitlenir**. Başka bir görünüm seçilemez.
- **Geri yön (ekran → çağrı):** ekranda etkin olan her buton, o durumda `409` **almayacağı**
  kanıtlanmış bir çağrıya bağlıdır. `409` alınması kullanıcı hatası değil, **UI hatasıdır**
  (CURRENT-0007 §3).

---

## 2. Durum ↔ ekran izomorfizm tablosu

Kaynak: `authoring-agent.ts` durum geçişleri + `create-server.ts` hata eşlemesi.

| Oturum durumu | Girdi kutusu | Görünen birincil yüzey | Etkin eylemler | Yasak (çağrılırsa 409) |
|---|---|---|---|---|
| `not_started` | açık | Boş sohbet + "ilk mesaj oturumu açar" ipucu | gönder | — |
| `ready` | açık | Mesaj listesi | gönder · yükle · iptal | onay |
| `running` | **kilitli** | Aktivite satırı (§4) | iptal (abort) | gönder · onay |
| `input_required` | **kilitli** | **Kapalı soru kartı** | seçim → "seçimlerle devam" · iptal | serbest gönder · onay |
| `approval_required` | **kilitli** | **Onay kartı** | onayla · reddet · iptal | gönder |
| `cancelled` | kapalı | "Oturum kapandı" + yeniden başlat | — | hepsi |

### Olay → görünüm eşlemesi

| SSE olayı | Ekranda | Akış sonrası |
|---|---|---|
| `text_delta` | Balona token eklenir (streaming) | devam |
| `tool_call` | **Aktivite satırı** — yalnız araç **adı** (ADR-0018: sonuç UI'ya akmaz) | devam |
| `input_required` | Soru kartı; giriş kilitlenir | **stream biter** (`return`) |
| `approval_required` | Onay kartı; giriş kilitlenir | **stream biter** (`return`) |
| `completed` | Bütçe göstergesi güncellenir, giriş açılır | stream biter |
| `cancelled` | Oturum kapanır | stream biter |
| `error` | `budget_exceeded` → **oturum `ready`'ye döner**, ölmez; `agent_failure` → jenerik metin | stream biter |

> [!CAUTION] `input_required` ve `approval_required` sonrası bağlantı kapanır
> UI "akış sürüyor" sanıp beklememeli. Devam **yeni** `POST /messages` (cevaplarla) veya
> `POST /approval` ile olur. Bugünkü istemci bunu doğru yapıyor; yeni yüzeyde korunacak.

---

## 3. Kapalı soru kartı — sözleşme ve tasarım

### 3.1 Backend'in dayattığı dört kural (kod doğrulaması)

`authoring-agent.ts:257-279` `validateAnswers`:

| Kural | Kod | İhlalde |
|---|---|---|
| Bekleyen soru yokken cevap **gönderilemez** | `answers.length > 0` → throw | `409 agent_state_conflict` |
| Bekleyen **her soru tam bir kez** cevaplanır | `answerMap.size !== pendingQuestions.length` → throw | `409` |
| Seçilen değer **options içinde olmalı** | `!question.options.includes(selected)` → throw | `409` |
| Cevaplar mesajla birlikte gider | `SendMessageSchema`: `message` **min 1**, `answers` max **20** | boş mesaj → `400 invalid_request` |

> Hata eşlemesi tek satırlık bir yakalayıcıdır (`create-server.ts:81`): tanınmayan **her** hata
> `409 agent_state_conflict` olur. Yani bozuk cevap kümesi ile "yanlış durumda mesaj" ekranda
> **aynı** koda düşer. UI bu yüzden 409'u kullanıcıya *"ajan meşgul veya cevap kümesi eksik;
> seçimleri kontrol edin"* diye çevirir ve **kendi tarafında** hiç üretmemeyi hedefler.

### 3.2 Kart tasarımı

Sektörde iki uç var: serbest metin (belirsiz) ve tamamen yapılandırılmış kart (kısıtlayıcı).
Salesforce'un 4M oturumluk ölçümü ortayı işaret ediyor: yapılandırılmış bileşen **seçici**
kullanılmalı, seçenek sayısı sınırlanmalı, çünkü *"bir yanıtı sabit seçenek kümesine çevirmek
kişinin bundan sonra ne söyleyebileceğini daraltır"*. **Bizde bu bir tercih değil:** RULE-0007
serbest metni zaten yasaklıyor. Yani biz kasıtlı olarak "kısıtlayıcı" uçtayız ve kartın işi
kısıtı **anlaşılır** kılmaktır.

```
┌─ KAPALI SORU ─────────────────────────────────────────────── 1/2 ─┐
│  Bu adım hangi API operasyonuna düşüyor?                          │
│  OPERATION_REFERENCE_REQUIRED · gap: OperationBinding             │  ← soluk, monospace
│                                                                    │
│  ( ) POST /bookings           — createBooking                     │
│  (•) GET  /bookings/{id}      — getBooking                        │
│  ( ) POST /bookings/{id}/pay  — payBooking                        │
│                                                                    │
│  ⓘ Seçim kapalıdır: ajan bu listeyi kanıttan üretti, dışına       │
│    çıkılamaz. Kanıt rayında ilgili operasyon vurgulanıyor. →      │
└───────────────────────────────────────────────────────────────────┘
      [ Seçimlerle devam et ]   ← 2/2 cevaplanana kadar pasif
```

**Zorunlu davranışlar:**

| # | Davranış | Gerekçe |
|---|---|---|
| S-1 | Serbest metin kutusu **açılmaz**, "Diğer" seçeneği **yoktur** | RULE-0007 + `options.includes` sunucu kontrolü |
| S-2 | Çok soru varsa **tek kartta sayfalanır** (`1/2`), hepsi cevaplanmadan devam pasif | `answerMap.size` eşleşmesi zorunlu; parça parça göndermek `409` |
| S-3 | `questionCode` **görünür ama soluk**; çeviri birincil, kod ikincil | CURRENT-0007 §4: UI kodu çevirir, değiştirmez; denetim için kod görünmeli |
| S-4 | Seçenek metni **olduğu gibi** gösterilir; UI kısaltmaz, yeniden yazmaz | Gönderilen değer birebir seçenek olmak zorunda |
| S-5 | Kart, kanıt rayındaki ilgili bloğu **vurgular** (operasyon → envanter, tablo → şema ağacı) | Buda/LukeW: karar bağlamı görünür kalmalı |
| S-6 | `EVIDENCE_UNAVAILABLE` ve `NOT_BOUND:` **soru değil bilgi** olarak çerçevelenir | ADR-0019 §C: "kanıt okunamadı" denir, "yetki yok" denmez |
| S-7 | Cevap gönderilirken taşınan mesaj sabittir ve kullanıcıya **gösterilmez** | `message` min 1 zorunlu; kullanıcının yazdığı bir şey değil |

---

## 4. Aktivite göstergesi — "ne yaptığını soluk yazıyla görmek"

### 4.1 Backend ne veriyor, ne vermiyor

| Var | Yok |
|---|---|
| `tool_call { name }` — araç **çalışmadan önce** yayılıyor (`authoring-agent.ts:160-161`) | **Bitiş olayı yok** (AG-UI'deki `ToolCallEnd` karşılığı) |
| Araç adı kapalı `PtnToolCodes` kümesinden | **Sonuç yok** — bilinçli (ADR-0018): ham kanıt tarayıcıya sızmaz |
| `completed { turns, tokens }` | Argüman yok, süre yok, adım no yok |

> [!IMPORTANT] Bitişi olay değil **sıra** verir
> `tool_call` yayıldıktan sonra gelen **herhangi bir** olay (`text_delta`, ikinci `tool_call`,
> `input_required`, `approval_required`, `completed`, `error`), önceki aracın **bittiğini**
> kanıtlar; çünkü sunucu aracı `await` ettikten sonra devam ediyor. İzomorfizm bu türetmeyle
> kurulur — UI "çalışıyor" durumunu uydurmaz, olay sırasından **çıkarır**.
>
> Bugünkü istemci bunu yapmıyor: `activeTools` biriktiriyor ve yalnız yeni mesajda temizleniyor
> (`test-agent-context.tsx:93`), yani biten araç hâlâ "çalışıyor" gibi duruyor.

### 4.2 Görsel ağırlık — sektör ölçümü

LukeW'in üç ürün üzerinden çıkardığı ders net: ilk sürümler her aracın altında sonuç, ayar ve
"yeniden çalıştır" düğmeleri gösterdi — *"çok fazlaydı"*. Sonraki sürümler **görsel ağırlığı
azalttı**, araç çağrılarını varsayılan olarak **katladı**, ve iş bitince süreç alanı **özete
çöktü**, odak çıktıya kaydı. Kullanıcılar ikiye ayrılıyor: sonuca bakanlar ve süreci izlemek
isteyenler — bu yüzden çözüm gizlemek değil, **kademeli açma**.

### 4.3 Bizim aktivite satırımız

```
· kanıt aracı: ptn_ground                          ⟳        ← çalışıyor: soluk + dönen im
· kanıt aracı: ptn_ground · ptn_describe_table     ✓        ← bitti: daha da soluk, tek satır
  ▸ 3 araç çağrıldı · 2/8 tur · 1.240 token                 ← katlanmış özet (tıkla → aç)
```

| # | Kural | Gerekçe |
|---|---|---|
| A-1 | Aktivite satırı **mesaj balonu değildir**: tam genişlik, kenarlıksız, `%40` opaklık, 10.5 px | LukeW: görsel ağırlık azaltılmalı; balon yapmak süreci çıktı seviyesine çıkarır |
| A-2 | Yalnız araç **adı** — argüman ve sonuç **asla** | ADR-0018 |
| A-3 | Çalışan araç `⟳`, biten `✓`; bitiş **sonraki olaydan** türetilir (§4.1) | Uydurma durum yok |
| A-4 | Tur bitince (`completed`) satırlar **tek özet satırına çöker**, katlanır | LukeW: sonuç gelince odak çıktıya kayar |
| A-5 | Ekranda hiçbir zaman **jenerik "yükleniyor"** yok; her göstergede araç adı veya "yanıt yazılıyor" bağlamı var | ASP deseni: bağlamsız yükleme durumu kaçınılacak |
| A-6 | Durum değişimi **≤100 ms** yansır; titreme yok (aynı ad ardışık gelirse tek satır) | ASP deseni |
| A-7 | Bütçe (`turns`/`tokens`) ve TTL **üst şeritte kalıcı**, aktivite satırında tekrarlanmaz | G-06/G-07; tekrar gürültüdür |

---

## 5. Onay kartı — kanıt birincil sıralama

Kart bugün ajanın son mesajını "Neden?" alanına koyuyor (`floating-agent.tsx:161`) ve opak
`operationReferenceId` gösteriyor (satır 375). İkisi de wiki'ye aykırı ve sektör ölçümüne göre
**tam ters sıralama**: RESEARCH-0017 §4 *"onay kartında ajanın metni birincil olmamalı; birincil
olan checker'dan gelen kanıt ve kapı sonucudur"* diyor; StackAI ölçümü tam kanıt paketiyle
kararın 10–30 saniyeye indiğini, eksikse dakikalara çıktığını söylüyor.

| Sıra | Alan | İçerik | Kaynak |
|---|---|---|---|
| 1 | **Ne yapılacak** | `stepId` + çözülmüş `method` + `path` | `AuthoringStepDto` (`GET authoring/sessions/{id}`) |
| 2 | **Ne değişecek** | `assertionPaths` listesi (1–50) + `SourceDocument` diff'i | Oturum belgesi önce/sonra |
| 3 | **Neden** | Ajan metni + koşan araç adları — **soluk, ikincil blok** | SSE |
| 4 | **Nasıl geri alınır** | "Reddetme oturumu kapatır ve **geri döndürmez**" | `resolveApproval` → `cancelled` |

**Reddetme dili:** "öneriyi düzelt" **değil**, "reddet ve oturumu kapat". Sektörde ret genelde
"tool'u atla" iken bizde oturumu öldürür; UI bunu yumuşatamaz — yumuşatma isteniyorsa ajan kodu
kararıdır (RESEARCH-0017 Ö-6).

---

## 6. İstemcide kapatılacak sözleşme boşlukları

| # | Boşluk | Bugün | Olması gereken |
|---|---|---|---|
| İ-1 | `403 session_forbidden` işlenmiyor | `agent.ts` yalnız 401 ve `session_not_found` ayırıyor | Ayrı metin: "Bu oturum başka bir kullanıcıya ait" |
| İ-2 | Biten araç "çalışıyor" görünüyor | `activeTools` birikiyor | §4.1 türetmesi |
| İ-3 | 409 tek metne düşüyor | Jenerik hata | "Ajan meşgul veya cevap kümesi eksik" + butonları durumdan türet |
| İ-4 | `budget_exceeded` sonrası oturum ölü sanılabilir | Hata gösteriliyor | Kod `ready`'ye dönüyor → "yeni mesajla devam edebilirsiniz" |
| İ-5 | CORS tek origin | `UI_ORIGIN` (vars. `http://localhost:3000`) tam eşleşme | Farklı portta çalışılırsa ajan çağrıları sessizce düşer — geliştirici notu |
| İ-6 | `momentCode` sabit `Grounding` | `startSession("Grounding")` | Altı an kapalı küme; yazarlık hattı için `Grounding` doğru, diğerleri ileride |

---

## 7. Faz planı

Kardeş defterin fazlarına **eklenir**; F0/F1 önkoşuldur.

| Faz | İş | Kabul ölçütü |
|---|---|---|
| **C1 — Durum makinesi tek kaynağa** | Buton etkinliği ve giriş kilidi §2 tablosundan türetilir; `canSend` yerine durum eşlemesi | Her durumda yasak eylem **render edilmez**; el ile 409 üretilemez |
| **C2 — Aktivite satırı** | §4.3: soluk satır, sonraki olaydan bitiş türetme, tur sonunda katlanan özet | Biten araç `✓`; jenerik "yükleniyor" ekranda hiç yok |
| **C3 — Kapalı soru kartı** | §3.2: sayfalama, kod soluk gösterimi, kanıt rayı vurgusu, S-1…S-7 | Eksik cevapla devam pasif; serbest metin yüzeyi yok |
| **C4 — Onay kartı yeniden sıralama** | §5: kanıt birincil, `method`+`path` çözümlü, diff gömülü, ajan metni soluk | Dört alan dolu; opak uuid görünmez |
| **C5 — Hata sözleşmesi** | İ-1…İ-4 | Dört hata sınıfı ayrı metin; hiçbiri teknik ayrıntı vaat etmez (G-12) |

---

## 8. Doğrulama

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

```bash
npm run build
```

---

## 9. Kaynaklar

**Kod otoritesi:** `ptn-test-agent/src/{contracts.ts,config.ts}`, `src/http/create-server.ts`,
`src/agent/authoring-agent.ts`, `src/session/session-store.ts`, `src/mcp/sdk-mcp-gateway.ts`

**Wiki:** ARCH-0005 §2–§5 · CURRENT-0007 §3–§5 · RULE-0005/0006/0007 · RESEARCH-0017 §1–§4

**Dış (erişim 2026-08-17):**
- https://lukew.com/ff/entry.asp?2142=
- https://engineering.salesforce.com/how-agentforce-converts-llm-responses-into-structured-ui-for-ai-agents-across-4m-sessions/
- https://agentic-design.ai/patterns/ui-ux-patterns/agent-status-activity-patterns
- https://agentic-design.ai/patterns/ui-ux-patterns/conversational-interface-patterns
- https://docs.anythingllm.com/features/agent-surveys
- https://docs.ag-ui.com/concepts/messages
- https://www.stackai.com/insights/human-in-the-loop-ai-agents-how-to-design-approval-workflows-for-safe-and-scalable-automation
