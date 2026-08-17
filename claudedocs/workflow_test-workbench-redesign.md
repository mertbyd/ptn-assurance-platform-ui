# Test Platform yüzeyi — gereksinim analizi ve yeniden kurgu iş akışı

- **Üretildi:** 2026-08-17
- **Kapsam:** `src/app/test/**`, `src/features/test-agent/**`, `src/api/checker.ts`, `src/components/ui/floating-agent.tsx`
- **Sınıf:** gereksinim + faz planı — **kod yazılmadı, dosya değiştirilmedi**
- **Kanonik girdi:** `ptn-assurance-platform/docs/wiki-brain` → ARCH-0004 (Altı An), ARCH-0005 (Ajan yüzeyi),
  ARCH-0006 (Ekran–uç–izin matrisi), CURRENT-0007 (UI gereksinim analizi), RULE-0005/0006/0007, RESEARCH-0017
- **Kod kanıtı:** `ptn-test-module/src/**` (DTO + Manager + AppService), `ptn-api-contract-checker/src/**` (DTO),
  bu deponun `src/**` ağacı, `npx tsc --noEmit` çıktısı
- **Dış kanıt:** §4'teki altı kaynak (erişim 2026-08-17)

---

## 0. Bu belgenin cevapladığı soru

*"Test ekranı neden entegre durmuyor, wiki'ye göre nasıl durması gerekiyor, sektör bu işi nasıl
çözüyor ve bizim sistemimize en yakışan kurgu hangisi?"*

Belge üç şeyi sabitler: **(a)** yüzeyin uymak zorunda olduğu değişmezler, **(b)** bugünkü ekranın
bu değişmezlere göre ölçülmüş kusurları, **(c)** düzeltmenin faz sırası ve her fazın kabul ölçütü.

> Tasarım tercihleri §5'te **gerekçeli** verilir. Wiki'nin kapalı kurallarıyla çelişen hiçbir
> tercih önerilmemiştir; çeliştiği yer varsa açıkça "ürün kararı" olarak §9'da soruya çevrilmiştir.

---

## 1. Değişmezler — UI bunları seçemez, uygular

| # | Değişmez | Kaynak | Ekrandaki zorunlu karşılığı |
|---|---|---|---|
| D-1 | **Ajan hakem değildir** | RULE-0005 | Hiçbir yüzey model çıktısını "geçti/kaldı" göstermez. Hüküm yalnız `TestOutcomeStatusCodes`'tan |
| D-2 | **Ajan tahmin etmez** | RULE-0007 | Ajan girdisi olan hiçbir alan serbest metin değil; **seçim kapalı kümeden** |
| D-3 | **Türetilemeyen assertion yayınlanamaz** | RULE-0006 | `assertionPaths ≥ 1`, "beklenti ekle" zorunlu |
| D-4 | Yayın sırası sabittir | ARCH-0006 §2.4 | `compile-preview` → `evaluate-publication` → (yeşilse) `publish`. `publish` **asla ilk eylem değil** |
| D-5 | Yazarlık oturumu **30 dk TTL**'li cache'tir | ARCH-0005 §6 | Kalan süre görünür, %80'de uyarı; süre dolarsa Arazzo belgesi kaybolur |
| D-6 | `kurallar.md` **önce** Test Module kanonik kaynağına gider | ARCH-0005 §1 | Yalnız ajana yüklemek sessiz hatadır → `MaterialIntegrity` kapısı `InvalidHash` verir |
| D-7 | Mühür alanlarını **sunucu** üretir | `TestScenarioAppService.cs:196,220` | İstemci farklı değer gönderirse `BusinessException(InvalidHash)` |
| D-8 | `input_required` / `approval_required` **stream'i bitirir** | ARCH-0005 §2 | UI "akış sürüyor" sanıp beklemez; devam yeni istekle olur |
| D-9 | Reddetme **yıkıcıdır** | ARCH-0005 §5 | "öneriyi düzelt" gibi gösterilemez; "oturumu kapat ve yeniden başla" |
| D-10 | `Inconclusive` / `Unavailable` / `NOT_BOUND` **hata değildir** | CURRENT-0007 §4 | `Failed` ile aynı renkte gösterilemez; "kanıt toplanamadı" denir, "yetki yok" denmez |
| D-11 | Ortam formunda **sır alanı yoktur** | CURRENT-0007 G-08 | Yalnız `secretRef` |
| D-12 | Kapalı sözlükler UI'da yeniden tanımlanmaz | CURRENT-0007 §4 | 12 sözlük; UI **çevirir**, uydurmaz |

---

## 2. Bugünkü ekranın ölçülmüş kusurları

Üç sınıf var. Sınıf A ürünü durduruyor, B wiki ihlali, C entegrasyon/görsel.

### A — Ürünü durduranlar

| # | Kusur | Kanıt | Etki |
|---|---|---|---|
| A-1 | **Proje derlenmiyor** | `npx tsc --noEmit` → 7 hata, `floating-agent.tsx:209,235,248,261,416,418,419` | `dev`/`build` düşer. Sürükleme yeniden yazımı yarım kaldı: `isPointerDown` state'i tanımsız, JSX silinmiş `handlePointerMove`/`finishDrag`'e bağlı |
| A-2 | `dbSchemaFingerprint` **istemciden gönderiliyor** | `authoring-tab.tsx:222` profil paketinin değerini yolluyor; sunucu `GetSchemaFingerprintAsync(connectionId)` ile **canlı** değeri uygular ve farklıysa `InvalidHash` atar (`TestScenarioAppService.cs:186-191`) | Profil paketi DB'den eskiyse "Taslağı kalıcılaştır" hash hatasıyla düşer. D-7 ihlali — `specFingerprint` ile aynı sınıf |
| A-3 | `checker.ts` elle yazılmış ve DTO'larla uyuşmuyor (kalan alanlar) | `CreateSpecSourceDto`/`UpdateSpecSourceDto`/`SpecSnapshotDetailDto` backend karşılıklarıyla uyuşmuyor | Bugün tüketicisi yok; ilk tüketicide aynı "Invalid Date" sınıfı hata çıkar |

### B — Wiki ihlalleri / eksik zorunlu yüzeyler

| # | Kusur | İhlal | Kanıt |
|---|---|---|---|
| B-1 | **Adım listesi yok** — yalnız sayaç gösteriliyor | ARCH-0006 ekran 16 (P1); D-3'ün görünür kanıtı yok | `authoring-tab.tsx:312` `{steps.length} API adımı` |
| B-2 | **DB adım editörü hiç yok** | ARCH-0006 ekran 15 (P1); 11 kapalı matcher yüzeyi yok | `addDatabaseAuthoringStep` context'te tanımlı, **hiçbir bileşen çağırmıyor** |
| B-3 | **Arazzo önizlemesi ham `<pre>`**, diff yok | ARCH-0005 §5 "ne değişecek" alanı kanıtsız; RESEARCH-0017 Ö-5 | `authoring-tab.tsx:315` |
| B-4 | Onay kartında **ajan metni birincil** | RESEARCH-0017 §4 / Ö-3: kanıt birincil, ajan metni ikincil olmalı | `floating-agent.tsx:161` `approvalWhy` = son ajan mesajı |
| B-5 | Onay kartı `method`/`path` **çözmüyor**, opak uuid gösteriyor | ARCH-0005 §5 tablo: "ne yapılacak" = `stepId` + çözülmüş `method`+`path` | `floating-agent.tsx:375` |
| B-6 | Kapsam/güven sinyali kullanılmıyor | RESEARCH-0017 §4 "güven sinyali"; `coverage` ucu bağlı değil | `testApi.coverage` hiçbir ekranda çağrılmıyor |
| B-7 | Sohbet ile kanıt seçimi **aynı anda görünmüyor** | ARCH-0005 bütünü: kapalı soru kanıt bağlamı olmadan cevaplanıyor | Ajan yüzen panelde, seçimler sayfada |

### C — Entegrasyon ve görsel bütünlük

| # | Kusur | Ölçüt |
|---|---|---|
| C-1 | Test modülü kendi tasarım dilinde: `primitives.tsx` ayrı `Card/Btn/Field`, portal modülleri `features/*` bileşenleri kullanıyor | İki ayrı buton/kart/alan dili; rozet, boşluk ve tipografi ölçüleri tutmuyor |
| C-2 | Bütün yüzey inline `style={{…}}`; tema tokenı yok | Renkler dosya içinde sabit (`#131620`, `rgba(255,255,255,.07)`), modül vurgusu `MOD.test` ile eşleşmiyor |
| C-3 | Ekran tek sütun 5 dikey form yığını; 150 px alt boşlukla ajan petinin altında kalıyor | `padding: "26px 30px 150px"` — ajan paneli açıldığında içerik örtülüyor |
| C-4 | Test ekranından **API kaynağı / DB bağlantısı eklenemiyor** | Yalnız `list` çağrılıyor; boş envanterde kullanıcı modülü terk etmek zorunda |
| C-5 | Boş durumlarda sebep yazmıyordu (kısmen düzeltildi) | Snapshot/doküman/bağlantı seçicilerine hint eklendi; kaynak ve profil seçicisinde hâlâ yok |
| C-6 | `/test` rotası `(portal)` grubunun **dışında** | Portal iskeleti ARCH-0006 §1'de `/authoring`; test yüzeyi ayrı ağaçta, ortak layout'u paylaşmıyor |

---

## 3. Ajan sürüklenebilirliği — durum

Talep: *"mouse ile tutulup hareket ettirilebilen bir agent"*. Bu **zaten tasarlanmış** durumda
(IMPLEMENTATION-STATUS 5/9): pet viewport içinde sürüklenir, tıklanınca 560 ms koşu animasyonuyla
sol-alt dock'a döner, panel sağ-üstte açılır. Yeni özellik gerekmiyor; **A-1'deki yarım kalmış
yeniden yazım bitirilecek**. Doğru çözüm window seviyesinde pointer dinlemektir: pet butonu
`all: unset` yüzünden `display:inline` kutusuna düşüyor ve `setPointerCapture` güvenilir çalışmıyor.

---

## 4. Dış araştırma — sektör bu işi nasıl çözüyor

Wiki'nin kendi taraması (RESEARCH-0017, 2026-08-17) hâlâ geçerli; aşağıdaki tarama onu **doğruladı
ve iki noktada genişletti**.

| Bulgu | Kaynak | Bizde karşılığı |
|---|---|---|
| **Sohbet-önce (chat-first) UI başarısız oluyor**; yerine 12 desen öneriliyor: taskboard, aktivite zaman çizelgesi, iki-fazlı eylem, **kanıt paneli**, insan kapısı, bütçe/zaman kutusu | Hatchworks | Kanıt paneli + kapı + bütçe zaten sözleşmede var, **ekranda birleşik değil** |
| **Sekme modeli terk ediliyor:** sohbet ana tuvalde sabit kalır, yan panel dikey denetim, alt panel geniş inceleme; "her sekme aynı tuvale rakip olunca gözetim kayboluyor" | Buda Agent Workbench | C-3/B-7'nin doğrudan cevabı |
| Onay kartı **tam kanıt paketi** taşırsa karar 10–30 sn sürüyor; eksikse dakikalara çıkıyor | StackAI | B-4/B-5'in maliyeti ölçülmüş |
| Kanıt paneli **düşünce zinciri değil**, kürasyonlu kaynak listesi olmalı; "kaynağı değiştir / yeniden çalıştır" eylemleri taşımalı | Hatchworks | ADR-0018 ile birebir uyumlu: tool **sonucu** UI'ya akmaz, tool **adı** akar |
| Otonomi seviyesi (`Suggest`/`Co-pilot`/`Autopilot`) kuruluş kontrolünde | Mantlr / Sentry Seer | S-2 açık sorusu — bizde ayar yok |
| API test üretiminde olgun ürünler **spec'i kanıt olarak** kullanıyor; fark, insanın hangi operasyona bağlanacağını seçmesi | totalshiftleft / Postman 2026 | Bizim `ptn_ground` + kapalı soru deseni bunun katı hâli |

**Hüküm:** sektörün gittiği yer bizim wiki'mizin zaten tarif ettiği yer. Eksik olan protokol veya
kütüphane değil, **yerleşim**: kanıt, sohbet ve belge aynı anda görünmüyor.

---

## 5. Önerilen kurgu — üç bölgeli çalışma tezgâhı

Sekmeli sihirbaz **elenmiştir**: D-8 gereği akış zaten duruyor, sihirbaz bunun üstüne ikinci bir
durma katmanı koyar ve kanıt bağlamını gizler. Ajan-merkezli tek yüzey de **elenmiştir**: D-2
gereği girdi kapalı seçimdir; her seçimi sohbete indirmek 30 dk TTL içinde tur bütçesini (8 tur)
tüketir.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ÜST ŞERİT — malzeme mührü · profil kapsamı · TTL · tur/token · kapı durumu │
├───────────────────────────┬────────────────────────────────────────────────┤
│  SOL: KANIT RAYI          │  ORTA: AJAN TUVALİ (sabit çapa)                 │
│  ─────────────────────    │  ────────────────────────────────               │
│  • Kaynak → doküman →     │  • Mesaj akışı (text_delta)                     │
│    snapshot  [+ ekle]     │  • Tool rozetleri (yalnız ad — ADR-0018)        │
│  • Operasyon envanteri    │  • KAPALI SORU KARTI (seçim, serbest metin yok) │
│    (arama + seçim)        │  • ONAY KARTI (kanıt birincil, ajan metni alt)  │
│  • DB bağlantı → şema →   │  • Bütçe/TTL uyarıları satır içi                │
│    tablo     [+ ekle]     │                                                 │
│  • Profil paketi + kapsam ├────────────────────────────────────────────────┤
│    oranı                  │  ALT: BELGE VE KAPI PANELİ (geniş inceleme)     │
│                           │  Adımlar | Arazzo + diff | Derleme | Yayın kapıları│
└───────────────────────────┴────────────────────────────────────────────────┘
```

### Neden bu

| Karar | Gerekçe |
|---|---|
| Sohbet **ana tuvalde sabit**, panel değil | Buda: sekme/panel değişimi ajan gözetimini kırıyor. Bugünkü yüzen pet, panel açıldığında içeriği örtüyor (C-3) |
| Kanıt **solda kalıcı**, sohbetin içinde değil | Kapalı soru ("bu adım hangi operasyona düşüyor?") ancak operasyon envanteri görünürken cevaplanabilir (B-7) |
| Belge ve kapılar **altta**, geniş | Arazzo diff ve 5 kapı satırı dar sütuna sığmaz; alt panel açılıp kapanır, sohbeti yerinden etmez |
| Üst şerit **tek satır telemetri** | CURRENT-0007 G-06/G-07: bütçe ve TTL canlı görünmek **zorunda** |
| Pet **kalır** ama rolü değişir | Tezgâh açıkken pet "ajanı çağır" değil, **durum göstergesi + hızlı geri dön** olur; sürüklenebilirlik korunur (§3) |

> Bu yerleşim `/test` rotasında ayrı bir ekran değil, ModuleShell'in `Agent ile Yazarlık` sekmesinin
> **içeriği**dir. Senaryolar ve Koşumlar sekmeleri yerinde kalır.

---

## 6. Yüzey sözleşmeleri

### 6.1 Kanıt rayı (sol)

| Blok | Uç | Kural |
|---|---|---|
| API kaynağı → doküman → snapshot | `GET /api/sources`, `…/documents/{id}/snapshots` | Snapshot etiketi: `creationTime` + `formatCode` + `shortCanonicalHash`. Tarih geçersizse hash'e düşer |
| **Operasyon envanteri** | `GET /api/snapshots/{id}/operations` | Arama + seçim; seçim `OPERATION_REFERENCE_REQUIRED` sorusunu **önden** cevaplar |
| DB bağlantı → şema → tablo | `GET /api/connections/database-connections`, `…/schema-discovery/{id}/schemas|objects` | Tablo seçimi `TABLE_SELECTION_REQUIRED`'ı önden cevaplar |
| Profil paketi | `GET authoring/profile-packs` | `ApprovedBindingCount/BindingCount` + `EvidencePathCount` **oran olarak** (ARCH-0006 §2.2) |
| Kapsam sinyali | `GET /api/test-module/coverage` | `denominatorState=Unknown` ise **"ölçülemedi"**, `0` değil |

**`[+ ekle]` düğmeleri (C-4):** mevcut `SourceFormDialog` (`features/sources/components/source-form-dialog.tsx`)
doğrudan modal olarak kullanılır. DB tarafında form bugün `connections-page-view.tsx` içine gömülü;
aynı desenle `ConnectionFormDialog` olarak **çıkarılır** (yeni tasarım değil, mevcut formun taşınması).
Düğmeler izinle koşullanır (`ApiContractChecker.*` / `DatabaseChecker.*`); izin yoksa **buton görünmez**,
istek atılmaz (G-13).

### 6.2 Ajan tuvali (orta)

| Durum | Girdi kutusu | Görünen |
|---|---|---|
| `not_started` / `ready` | açık | Mesaj listesi |
| `running` | **kilitli** | Tool rozetleri + yazıyor göstergesi |
| `input_required` | **kilitli** | Kapalı soru kartı; her soru **tam bir kez**; eksikken "devam" pasif (G-01/G-02) |
| `approval_required` | **kilitli** | Onay kartı; onay/ret dışında eylem yok |
| `cancelled` | kapalı | "Yeni oturum başlat" |

**Kapalı soru kartı:** `questionCode` çevrilir, değiştirilmez. Seçenek çipleri; serbest metin kutusu
**açılmaz**. `NOT_BOUND:<kavram>` öneki ayrı ele alınır ve profil paketine bağlanma yolunu gösterir.

**Onay kartı — dört alan (G-03), kanıt birincil sıralamayla:**

| Sıra | Alan | Kaynak |
|---|---|---|
| 1 | **Ne yapılacak** | `stepId` + opak referansın çözülmüş `method` + `path`'i (`AuthoringStepDto`) — uuid gösterilmez (B-5) |
| 2 | **Ne değişecek** | `SourceDocument` önce/sonra **diff**'i + `assertionPaths` listesi |
| 3 | **Neden** | Ajan metni + koşan `tool_call` adları — **ikincil blok** (B-4) |
| 4 | **Nasıl geri alınır** | "Reddetme oturumu kapatır ve geri döndürmez" (D-9) |

### 6.3 Belge ve kapı paneli (alt)

| Sekme | İçerik | Uç |
|---|---|---|
| **Adımlar** | API adımları (`stepId`, `method`, `path`, assertion sayısı) + DB adımları; her satır silinemez, oturum atılır | `GET authoring/sessions/{id}` |
| **DB adımı ekle** | Tablo (opak `tableReferenceId`) + `operationCode` + key binding + beklentiler; matcher **11 kapalı koddan** açılır liste | `POST …/database-step` |
| **Arazzo** | Okuyucu + diff. **Editör değil** (RESEARCH-0017 Ö-5) — serbest düzenleme `SourceHash` mührünü kırar | `compile-preview` |
| **Yayın** | 5 kapı **kod bazında**; `publish` yalnız yeşil karardan sonra etkin (D-4) | `evaluate-publication` → `publish` |

---

## 7. Mesaj kataloğu — kapalı sözlüklerin ekran dili

UI bu tabloları **çevirir**, üretmez. Tek kaynak `Domain.Shared` sabitleri + lookup satırları.

### Kapalı soru kodları (`PtnOpenQuestionCodes`)

| Kod | Ekran metni | Yanına ne konur |
|---|---|---|
| `OPERATION_REFERENCE_REQUIRED` | "Bu adım hangi API operasyonuna düşüyor?" | Kanıt rayında operasyon envanteri vurgulanır |
| `OPERATION_SELECTION_REQUIRED` | "Aday operasyonlardan birini seç" | Adaylar sırayla, eşleşme gerekçesi olmadan |
| `TABLE_SELECTION_REQUIRED` | "Doğrulanacak tabloyu seç" | Şema ağacı vurgulanır |
| `ASSERTION_REFERENCE_REQUIRED` | "Hangi alan doğrulanacak?" | Response şeması alan listesi |
| `EVIDENCE_UNAVAILABLE` | **"Kanıt okunamadı"** | ❌ "yetki yok" **yazılmaz** (ADR-0019 §C) |
| `NOT_BOUND:<kavram>` | "'<kavram>' henüz şemaya bağlanmadı" | Profil paketi yükleme yolu |

### Yayın kapıları (`ScenarioGateCodes`) — mevcut metinler doğru, "nasıl düzelir" eklenecek

| Kod | Ekranda | Nasıl düzelir |
|---|---|---|
| `SchemaValidity` | Arazzo şeması geçersiz | `compile-preview` lint çıktısı |
| `Derivability` | Assertion sözleşme kanıtından türetilemiyor | Adımı düzelt veya kaldır |
| `AssertionCount` | En az bir beklenti eksik | Beklenti ekle (RULE-0006) |
| `MaterialIntegrity` | Malzeme mührü eksik veya bayat | Malzemeleri yeniden mühürle |
| `SourceDescriptionConsistency` | Kaynak adresleri seçilen kanıtla uyuşmuyor | `apiSourceUrl` / `databaseSourceUrl` |

### Hüküm rozetleri — renk sözleşmesi (D-10)

| Kod | Renk | Metin |
|---|---|---|
| `Passed` | yeşil | Geçti |
| `Failed` | kırmızı | Kaldı |
| `Broken` | mor | Koşum kırıldı |
| `Skipped` | nötr gri | Atlandı |
| **`Inconclusive`** | **sarı/nötr — kırmızı değil** | "Ön koşul sağlanmadı; hiçbir şey doğrulanmadı" |

### Ajan hata metinleri (G-12)

`error.message` jeneriktir; teknik ayrıntı vaat edilmez. `budget_exceeded` → "Tur/token bütçesi
doldu; oturum hazır durumuna döndü." `agent_failure` → "Ajan yanıt üretemedi." Sağlayıcı adı,
model adı ve secret **hiçbir metinde geçmez**.

---

## 8. Faz planı

Her faz tek başına derlenir ve doğrulanır. Sıra bağlayıcıdır: önceki faz yeşil olmadan sonraki başlamaz.

| Faz | İş | Kabul ölçütü |
|---|---|---|
| **F0 — Ağacı yeşile al** | A-1: `floating-agent.tsx` sürükleme yeniden yazımını bitir (window pointer dinleyicisi + `isPointerDown` state + JSX bağlarının düzeltilmesi) | `npx tsc --noEmit` 0 hata; `npm run lint` temiz; pet sürükleniyor, tıklayınca dock'a koşuyor |
| **F1 — Mühür doğruluğu** | A-2: `dbSchemaFingerprint` gönderimini kaldır (D-7). A-3: `checker.ts`'in kalan DTO'larını hizala veya kullanılmayanları sil | Kalıcılaştırma `InvalidHash` almadan geçer; `checker.ts`'te backend'de karşılığı olmayan alan kalmaz |
| **F2 — Tasarım dili birliği** | C-1/C-2: `primitives.tsx`'i token tabanlı ortak bileşenlere taşı; `MOD.test` vurgusunu tek kaynaktan al | Test yüzeyindeki her buton/kart/alan portal modülleriyle aynı ölçü ve renk tokenını kullanır |
| **F3 — Tezgâh yerleşimi** | §5'teki üç bölge + üst telemetri şeridi; `authoring-tab.tsx` bölünür (kanıt rayı / tuval / belge paneli) | Kanıt, sohbet ve belge **aynı anda** görünür; ajan paneli içeriği örtmez |
| **F4 — Kanıt rayı derinliği** | Operasyon envanteri, şema/tablo ağacı, kapsam sinyali, `[+ ekle]` modalleri (C-4) | Boş envanterde kullanıcı test ekranından çıkmadan kaynak/bağlantı ekleyip seçebilir; izinsizde buton yok |
| **F5 — Adım ve belge yüzeyi** | B-1/B-2/B-3: adım listesi, DB adım editörü (11 matcher), Arazzo okuyucu + diff | `databaseSteps` UI'dan üretilebilir; diff onay kartını besler |
| **F6 — Onay kartı yeniden sıralama** | B-4/B-5: kanıt birincil, `method`+`path` çözümlü, diff gömülü | Dört alan da dolu; opak uuid görünmez |
| **F7 — Doğrulama** | `lint` + `tsc` + `build`; canlı stack ile duman testi | Wiki E-3 açıkken **üretim iddiası yapılmaz** (§9) |

---

## 9. Karar bekleyen açık konular

| # | Konu | Neden şimdi | Varsayılan (aksi söylenmezse) |
|---|---|---|---|
| K-1 | **E-3 kapanmadı**: ajan yüzeyinde kimlik doğrulama yok, tek paylaşılan MCP bearer'ı → tenant izolasyonu ajan sınırında kayboluyor (ARCH-0005 §8) | UI ne kadar iyi olursa olsun ajan ekranı **üretime çıkamaz** | Tezgâh geliştirilir, üretim kararı backend'e bırakılır |
| K-2 | `/test` rotası `(portal)` dışında (C-6); wiki iskeleti `/authoring` diyor | Ortak layout, izin ve gezinme buna bağlı | Rota **taşınmaz**; mevcut `/test` korunur, taşıma ayrı iş olarak açılır |
| K-3 | Otonomi seviyesi (`Observe`/`Assist`/`Act`) — S-2 | Sektör deseni öneriyor, kodda ayar **yok** | Eklenmez |
| K-4 | `senaryo.md` mühre bağlanacak mı — S-3 | Bugün backend'de karşılığı yok; yalnız prompt malzemesi | Mevcut davranış korunur |
| K-5 | Reddetmenin oturumu öldürmesi — RESEARCH-0017 Ö-6 | UX bedeli var ama **ajan kodu kararı**, UI hilesiyle yumuşatılamaz | Wiki'deki sert davranış açıkça yazılır |

---

## 10. Doğrulama komutları

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

## 11. Kaynaklar

**Kanonik (depo içi):** `docs/wiki-brain/04-Architecture/{Alti-An,UI-Agent-Experience,UI-Endpoint-Screen-Matrix}.md` ·
`01-Current/UI-Requirements-Truth.md` · `02-Rules/RULE-{0005,0006,0007}.md` ·
`90-Inbox/RESEARCH-0017-Ajan-Arayuzu-Desenleri-Ve-Referans-Uygulamalar.md`

**Dış (erişim 2026-08-17):**
- https://hatchworks.com/blog/ai-agents/agent-ux-patterns/
- https://buda.im/blog/new-agent-workbench-ui
- https://www.stackai.com/insights/human-in-the-loop-ai-agents-how-to-design-approval-workflows-for-safe-and-scalable-automation
- https://developers.cloudflare.com/agents/concepts/agentic-patterns/human-in-the-loop/
- https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/human-in-the-loop
- https://totalshiftleft.ai/blog/how-ai-generates-api-tests-from-openapi
