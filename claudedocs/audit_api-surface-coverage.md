# API yüzeyi kapsama denetimi — istemci ölü yüzeyi ve eksik ekranlar

- **Üretildi:** 2026-08-17
- **Sınıf:** ölçüm + gereksinim analizi
- **Durum:** ilk sürüm yanlış kaynaktan ölçüldü; 2026-08-17'de düzeltildi ve §3.1'deki
  regresyon giderildi
- **Soru:** *"UI'da bug ve eksik API ucu kullanımı var; 190+ uç var. AI geliştiriciye teslim edilmeden önce böyle bir durum asla olmamalı."*
- **Yöntem:** Backend controller'larının `[Route]`/`[Http*]` özniteliklerinden ve rota
  sabitlerinden gerçek uç kümesi çıkarıldı; `src/api/**` istemci yaprakları ayrıştırıldı; `src/**`
  (api dizini hariç) taranarak her yaprağın gerçekten çağrılıp çağrılmadığı ölçüldü.

> [!CAUTION] Bu belgenin ilk sürümü YANLIŞ KAYNAKTAN ölçüldü — düzeltildi (2026-08-17)
> Checker ölçümü `ptn-api-contract-checker` **standalone deposundan** yapılmıştı. O depo
> `0.1.0`'dır ve auth henüz sökülmemiş **eski** backend'i taşır. Host onu tüketmiyor.
> Doğru otorite, paketlenen kaynak ve yayımlanan pakettir. İlk sürümdeki *"23 uç bağlanmamış,
> çoğu auth/tenant/e-posta"* tespiti **geçersizdir**: o uçlar yayımlanan pakette **yoktur**.

## 0.1 Kaynak otoritesi — hangi depo neyi kanıtlar

| Ne çalışıyor | Otorite | Sürüm | Ne DEĞİL |
|---|---|---|---|
| API Contract Checker | `ptn-assurance-platform/checkers/api-contract` | `CheckNexus.ApiContracts` **0.2.0-alpha.9** | `ptn-api-contract-checker` (standalone, `0.1.0`, auth sökülmemiş) |
| Database Checker | `ptn-assurance-platform/checkers/database-comparison` | `CheckNexus.DatabaseComparison` **0.2.0-alpha.9** | — |
| Test Module | `ptn-assurance-platform/ptn-test-module` | host, 65 controller action | — |
| Kimlik | `Authenticator.*` **2.1.0** paketleri, `<AUTH_ORIGIN>` | ayrı host | checker paketleri — CURRENT-0002: *"Authenticator ve Notifications implementasyonları bilinçli olarak pakete girmez"* |

Host `common.props` pinleri bunu doğrular: `CheckNexusApiContractsVersion = 0.2.0-alpha.9`,
`CheckNexusDatabaseComparisonVersion = 0.2.0-alpha.9`. Checker'lar birer **capability
modülüdür**; issuer, tenant ve kullanıcı yaşam döngüsünün sahibi değildir (CURRENT-0002).

---

## 0. Baş bulgu — teşhis yanlış konmuş

> **Eksik uç yok. Eksik olan, uçları kullanan ekran.**

| Kaynak | Backend ucu | İstemcide bağlı | Bağlanmamış |
|---|---|---|---|
| Test Module host | **65** (`ExpectedControllerActionCount` ile birebir) | 64 | **1** — `POST /runs/webhook` (kasıtlı) |
| `CheckNexus.ApiContracts` 0.2.0-alpha.9 | **24** | **24** | **0** |
| `CheckNexus.DatabaseComparison` 0.2.0-alpha.9 | **26** | **26** | **0** |

Üç kaynağın da uç kapsaması tamdır. Tek bağlanmamış uç webhook'tur: anonimdir, paylaşılan
sırla korunur ve istemciye açılmaz (CURRENT-0007 G-14).

| İstemci yüzeyi | İlk ölçüm | Düzeltmelerden sonra |
|---|---|---|
| İstemci yaprağı | 232 | 204 |
| Bir ekrandan çağrılan | 121 | 127 |
| **Hiçbir yerden çağrılmayan** | **111 (%48)** | **77 (%38)** |

Yani *"eksik API ucu kullanımı"* diye görünen şey, aslında **istemci sözleşmesi tamam ama
yarısını hiçbir ekran tüketmiyor** durumudur.

Bu ayrım önemlidir: eksik uç bir *entegrasyon* işidir, kullanılmayan uç bir *ürün kapsamı* işidir.
İkincisi teslimde çok daha tehlikelidir, çünkü ekran yokluğu derleme hatası vermez.

---

## 1. Ölü istemci yüzeyi — modül dağılımı

| Dosya | Ölü yaprak | Ne anlama geliyor |
|---|---|---|
| `test.ts` | **36** | Test Platform'un yarısı ekransız |
| `checker.ts` | **25** | **Bütün dosya fiilen ölü** — §3 |
| `db.ts` | **20** | Assertion, projeksiyon, write-set, teşhis yüzeyleri ekransız |
| `auth.ts` | 19 | Org-unit, context, tenant CRUD ekransız |
| `auth.api.ts` | 3 | Şifre sıfırlama / doğrulama tekrarı akışları |
| `notifications.api.ts` | 3 | Canlı bildirim akışı hiç bağlanmamış |
| `agent.ts` · `email.api.ts` · `lookups.api.ts` · `recipients.api.ts` · `query-keys.ts` | 1'er | Tekil artıklar |

---

## 2. Test tarafı — 36 ölü yaprağın sınıflandırması

Hepsi kusur değildir. Üç sınıfa ayrılır ve **yalnız birinci sınıf gerçek eksiktir**.

### 2.A — Kasıtlı: koşucu tarafı uçları (UI'dan çağrılmamalı)

| Yaprak | Gerekçe |
|---|---|
| `runs.start` | Pending koşumu Running'e claim eder; dış Arazzo runner'ın işidir |
| `runs.writeTerminal` | Hükmü ve bulguları atomik yazar; runner yazar, insan yazmaz |
| `runs.create` | UI kuyruğa `trigger` ile girer; `create` runner/otomasyon yoludur |

**Bu üçü doğru durumdadır.** `test.ts` içindeki yorum bunu zaten söylüyor.

### 2.B — Eksik ekran: backend hazır, yüzey yok

Wiki'nin 24 ekranlık envanteriyle (CURRENT-0007 §3) eşleştirildiğinde ölü yapraklar
doğrudan **eksik ekranlara** çıkıyor:

| Ölü yaprak(lar) | Karşılığı olan ekran | Wiki önceliği |
|---|---|---|
| `environments.list/create/update/remove/resetSandbox` | **Ekran 23 — Ortam bağlama** | **P0** |
| `findings.list` | **Ekran 4 — Bulgu listesi ve filtre** | **P0** |
| `health.list`, `health.get` | Ekran 8 — Senaryo sağlığı (pass/fail/flaky, p95) | P1 |
| `bridge.explain` | Ekran 5 — Teşhis raporu (RFC 9457 + hipotezler) | P1 |
| `runs.getResult`, `runs.getArtifactLinks` | Ekran 7 — Artefakt indirme | P1 |
| `coverage.get` | Kapsam raporu (`denominatorState` dahil) | P1 |
| `scenarios.update`, `scenarios.delete`, `scenarios.deprecate` | Ekran 10 — katalog düzenleme eylemleri | P0 ekranının eksik eylemleri |
| `authoring.getSession` | Oturum kurtarma (sayfa yenilenince taslak okunur) | ARCH-0005 boşluk 3 |
| `lookups.runStatuses`, `triggerKinds`, `failureCategories` + 4 `get*` | Yerelleştirilmiş etiketler | §4'teki hata |
| `bridge.validate/knowledge/tools/agentProfile/toolBudget/taskStatus/overlaySuggestion`, `invariants.check` | Köprü yüzeyleri (ARCH-0006 §2.3) | P1–P2 |

**Sayı olarak: 36 ölü yaprağın 3'ü kasıtlı, 33'ü eksik yüzey.** Bunların **10'u P0 ekranlara**
aittir — yani wiki'nin *"olmadan ürün anlatılamaz"* dediği yüzeyler.

### 2.C — Doğrudan kusur: kapalı sözlük yerine ham kod gösterimi

`lookups.*` ölü olduğu için ekranlar veritabanı satırlarındaki yerelleştirilmiş `name` değerini
değil, ham kodu/kimliği gösteriyor. CURRENT-0007 §4 bunu açıkça yasaklıyor:

> *"UI veritabanı satırlarını gösterir (yerelleştirilmiş `name`/`description` oradadır), kod
> sabitlerini yalnız dallanma mantığında kullanır."*

Somut belirti: senaryo listesinde durum rozeti `stateId` (GUID) düşebiliyor
(`scenarios-tab.tsx` → `stateLabel || scenario.stateId`), koşum listesinde tetikleyici ve
hata kategorisi hiç çevrilmiyor.

---

## 3. En büyük yapısal kusur — iki paralel istemci katmanı

`checker.ts`'in **28 yaprağından 25'i ölü**. Kullanılan 3 tanesi (`sources.list`,
`sources.listSnapshots`, `sources.captureSnapshot`) yalnız yeni test tezgâhı tarafından
çağrılıyor. Portal modülleri aynı backend için **üretilmiş tiplerle** yazılmış ayrı bir
katman kullanıyor: `sources.api.ts`, `snapshots.api.ts`, `checks.api.ts`.

Yani aynı checker için iki istemci var:

| Katman | Tip kaynağı | Tüketici |
|---|---|---|
| `sources.api.ts` · `snapshots.api.ts` · `checks.api.ts` | `generated/schema.d.ts` (Swagger'dan üretilmiş) | `(portal)/api-contract/**` |
| `checker.ts` | **elle yazılmış** | yalnız `app/test/**` |

**Bu ikilik teorik bir kaygı değil; bu oturumda iki gerçek hata üretti:**

1. `SpecSnapshotHeaderDto` elle `capturedAt`/`operationCount` taşıyordu → ekranda
   *"Invalid Date · ? operasyon"*. Backend'de bu alanlar hiç yok.
2. `SpecDocumentDto` elle `url`/`displayName` taşıyordu → doküman açılır listesi **boş**.
   Backend `documentName`/`path` döndürüyor.

İkisi de derleme hatası vermedi çünkü elle yazılan tip kendi içinde tutarlıydı. Üretilmiş tip
kullanılsaydı ikisi de `tsc` aşamasında yakalanırdı.

### 3.1 Düzeltme sırasında üretilen regresyon — ve kapanışı

`checker.ts` kaldırıldığında dosyanın **ölü sanılan 12 yaprağı** da gitti. Bunlar ölü değil,
**ekransız**dı ve hepsi yayımlanan `CheckNexus.ApiContracts` **0.2.0-alpha.9** paketinin
gerçek uçlarıydı:

| Uç | Ne zaman geldi |
|---|---|
| `GET /api/snapshots/{id}/operations` | `alpha.7` — KBP-630 operasyon envanteri |
| `POST /api/snapshots/{id}/operations/find` · `POST .../schemas/describe` | yazarlık yüzeyleri |
| `GET /api/snapshots/authoring-results/{ref}` | ajan sonucunun opak adresi |
| `POST /api/contract-checks/conformance/*` (7 uç) | `alpha.5` — uygunluk oracle'ı |
| `POST /api/contract-checks/diagnosis` | sözleşme teşhisi |

Silme, G-3'ü (her backend ucu bağlı olmalı) **ihlal etti**: kapsama 24/24'ten 12/24'e düştü.
Bağlantılar `snapshots.api.ts` ve yeni `conformance.api.ts` içinde geri kuruldu; kapsama
yeniden **24/24**.

> [!IMPORTANT] `generated/schema.d.ts` BAYAT — bu yüzden tipler elle yazıldı
> Üretilmiş şema **2026-08-07** tarihlidir; conformance ailesi `alpha.5` (08-14), operasyon
> envanteri `alpha.7` (08-16) ile açıldı. Şema bu yüzeyleri **hiç içermiyor**
> (`conformance`, `SnapshotOperation`, `contract-checks` dizgileri dosyada yok). Yani
> "her şey üretilmiş tipten gelsin" kuralı bugün **uygulanamaz durumdadır**; önce Swagger
> tek kökenden yeniden üretilmelidir (E-5 / G-03).

> **Teslim kuralı olarak:** aynı backend için ikinci bir elle yazılmış istemci katmanı,
> sessiz alan kayması için açık davettir. AI geliştiriciye devredilen bir kod tabanında bu
> özellikle tehlikelidir: ajan iki katmandan hangisinin doğru olduğunu repodan çıkaramaz.

---

## 4. Neden bu duruma gelindi — kök sebep

| # | Sebep | Kanıt |
|---|---|---|
| K-1 | İstemci katmanı **ekranlardan önce ve toptan** yazıldı; ekranlar sonra ve kısmen geldi | 232 yaprağın 121'i kullanılıyor; `test.ts` 65 ucun 64'ünü bağlıyor ama 3 sekme var |
| K-2 | Kullanılmayan export **hiçbir araç tarafından raporlanmıyor** | `eslint` `no-unused-vars` yalnız dosya içi kapsama bakar; export edilen üye "kullanılıyor" sayılır |
| K-3 | `tsc` ölü yüzeyi göremez; **bağlanmamış ekran derleme hatası değildir** | Build yeşil, ekranlar yok |
| K-4 | Üretilmiş tip kuralı (`openapi-typescript`) **tek modülde uygulanmış**, test tarafında elle yazılmış | ARCH-0007 §1 kuralı vs `checker.ts` |
| K-5 | Wiki'nin 24 ekranlık envanteri ile kodun **karşılaştırıldığı bir kapı yok** | ARCH-0006 kağıtta, CI'da değil |

---

## 5. Teslim öncesi karşılanması gereken gereksinimler

Talep *"AI geliştiriciye teslim edilmeden önce asla böyle bir durum olmamalı"* olduğu için
gereksinimler **tek seferlik temizlik değil, tekrarlayan kapı** olarak yazılmıştır.

| # | Gereksinim | Kabul ölçütü |
|---|---|---|
| **G-1** | Her istemci yaprağı ya bir ekrandan çağrılır ya da **gerekçeli allowlist**'te yer alır | Kapsama betiği 0 sınıflandırılmamış ölü yaprak raporlar |
| **G-2** | Allowlist girdisi **serbest metin değil**, sebep kodu taşır: `runner-owned` · `anonymous-surface` · `planned-screen:<ekran-no>` | Her girdinin sebebi ve varsa ekran numarası var |
| **G-3** | Her backend ucu ya istemcide bağlıdır ya allowlist'tedir | Test Module için bugün 64/65; webhook `anonymous-surface` olarak işaretlenir |
| **G-4** | Aynı backend için **tek** istemci katmanı bulunur | `checker.ts`'in kullanılan üç yaprağı üretilmiş tipli katmana taşınır, dosya kaldırılır |
| **G-5** | Kapalı sözlükler ekranda **ham kod olarak görünmez** | Rozet ve filtre değerleri lookup `name` alanından gelir; GUID düşen tek yer kalmaz |
| **G-6** | P0 ekranlar teslimden önce **var** olur | Ekran 4 (bulgu listesi), ekran 23 (ortam bağlama) ve katalog düzenleme eylemleri bağlanır |
| **G-7** | Kapı **CI'da** koşar ve kırmızıya düşürür | `npm run audit:api` (yeni script) build zincirinde |
| **G-8** | Denetim çıktısı **wiki ekran envanteriyle** eşleşir | Ölü yaprak → ekran numarası eşlemesi raporda görünür |

### Önerilen kapı betiği — davranış tanımı (kod değil)

1. `src/api/**` ayrıştırılır, dışa açılan her istemci yaprağı çıkarılır.
2. `src/**` (api hariç) taranır; her yaprağın referansı aranır.
3. Backend depolarının controller'ları okunur, rota sabitleri çözülür, uç kümesi çıkarılır.
4. Üç küme karşılaştırılır: **bağlanmamış uç**, **çağrılmayan yaprak**, **backend'de karşılığı olmayan yaprak**.
5. `api-allowlist.json` ile karşılaştırılır; sınıflandırılmamış her satır için çıkış kodu ≠ 0.

> Üçüncü küme bugün boştur ve **boş kalmalıdır**: istemcide olup backend'de olmayan bir rota,
> `checker.ts` sınıfından bir hatanın erken uyarısıdır.

---

## 6. Ölçüm dışı kalan alanlar (dürüst sınır)

| Alan | Durum |
|---|---|
| Database Checker backend uç sayımı | Controller'ları farklı düzende; rota sabitleri otomatik çözülemedi. `db.ts`'in 20 ölü yaprağı yine de kesindir |
| API Contract Checker'ın 23 "bağlanmamış" ucu | Büyük kısmı **auth/tenant/e-posta** uçlarıdır ve UI bunları bilinçli olarak `<AUTH_ORIGIN>`'e yönlendirir (ADR-0013); e-posta uçları hostta compose edilmiyor (ARCH-0006 §4.2). Bu satırlar allowlist adayıdır, kusur değil |
| Çalışma zamanı doğrulaması | Hiçbir uç canlı çağrılmadı; ölçüm statik kaynak analizidir |

---

## 7. Sıradaki adım

Bu belge **gereksinim analizidir**; uygulama planı değildir. Sıra:

1. `api-allowlist.json` sınıflandırması (ürün kararı: hangi ölü yaprak "planlanan ekran", hangisi "kaldırılacak").
2. `/sc:workflow` ile faz planı — G-4 (tek istemci katmanı) ve G-6 (P0 ekranlar) ayrı fazlar olmalı.
3. G-7 kapısının CI'ya bağlanması.
