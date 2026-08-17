# PTN Assurance UI — düzeltme iş akışı ve karar otoritesi defteri

- **Üretildi:** 2026-08-17
- **Kapsam:** `ptn-assurance-platform-ui` düzeltmesi + bağlı `ptn-assurance-platform` önkoşulları
- **Sınıf:** uygulama planı — kod yazılmadı, dosya değiştirilmedi, build/test koşulmadı
- **Girdi:** `IMPLEMENTATION-STATUS.md`, `docs/wiki-brain` (57 belge), her iki deponun kaynağı, saha denetimi G-01…G-14
- **Standart kilidi:** epoch `767421b907e24cb894a836ab73cedf89`, route `abp-existing`

---

## 0. Bu defterin cevapladığı soru

Talep şuydu: *"Bütün çözümleri neye göre yapacağını tek tek belirle."*

Bu belge **ne yapılacağını değil, her kararın hangi kanıta dayanacağını** sabitler. Bir düzeltmenin
"doğru" sayılması için hangi dosyanın ne dediğine bakılacağı önceden yazılmazsa, on dört düzeltme
on dört farklı gerekçeyle yapılır ve ikinci turda hepsi tartışmaya açılır.

Her bulgu için beş alan sabitlenmiştir:

| Alan | Anlamı |
|---|---|
| **Karar sorusu** | Gerçekte kararı verilecek olan şey |
| **Karar otoritesi** | Cevabı veren tek dosya/kural — tam yol |
| **Karar kuralı** | Otoriteden cevaba giden deterministik kural |
| **Belirsizlikte** | Otorite susarsa ne yapılır (tahmin yasak) |
| **Doğrulama** | Kararın uygulandığını kanıtlayan komut/ölçüt |

---

## 1. Karar otoritesi hiyerarşisi

Bütün bulgularda aşağıdaki merdiven geçerlidir. Üstteki alttakini ezer; alttaki üsttekini
**hiçbir koşulda** ezmez.

| # | Otorite | Örnek |
|---|---|---|
| 1 | Aktif konuşmada doğrudan, ezdiği kuralı adıyla anan talimat | "ADR-0025'i yok say, axios'ta kal" |
| 2 | Hedefi açıkça yöneten checked-in scoped kural | `checkers/database-comparison/.claude/rules/verify-patterns.json` |
| 3 | **Çalışan kaynak kod + derleyici/çalışma zamanı kanıtı** | `TestRunListInput.cs`, `tsc --noEmit` çıktısı |
| 4 | Geniş depo/şirket talimatı | global `CLAUDE.md`, `AGENTS.md`, commit grameri |
| 5 | Wiki `01-Current` / `02-Rules` / `03-Decisions` (`accepted`) | `CURRENT-0007`, `RULE-0006` |
| 6 | Wiki `03-Decisions` (`proposed`) | **`ADR-0025` — bağlayıcı değil** |
| 7 | Wiki `90-Inbox` (PLAN / RESEARCH / TASK / AUDIT) | kapsam malzemesi, mimari otorite değil |
| 8 | Genel framework örneği, dış proje, eski UI | yalnız şekil kontrolü |

### 1.1 Bu depoya özel üç ayırıcı kural

**A — Kod wiki'yi ezer, ama önce `git status` okunur.**
Kod ile wiki çeliştiğinde kod kazanır (`ARCH-0006` §6 bunu açıkça der: *"iki sayı tutmuyorsa
sayfa değil kod doğrudur"*). **Ancak** kod commit'lenmemişse o kod *geçici gerçektir*: plana
bağımlılık olarak yazılır, üstüne kalıcı UI sözleşmesi kurulmaz.

> Bugün tam olarak bu durumdayız — bkz. §2 Blokaj-0.

**B — `proposed` bir ADR karar üretmez.**
`ADR-0025` (UI yığını, üç köken, ajan olay sözleşmesi) `status: proposed`. Kendi metni der ki:
*"ürün sahibi kabul etmeden `accepted` olmaz ve bağlayıcı değildir."* Beş düzeltme bu ADR'ye
dayanıyor; hepsi §5'teki sahip kararına bağlanmıştır. Kabul gelmeden bu beşi "standart gereği"
diye yapmak, kararı sessizce ADR'nin yerine geçirmektir.

**C — Sayısal hakem testtir, sayfa değil.**
Uç sayısı tartışmasında otorite `OutwardSurfaceTests.ExpectedControllerActionCount`'tur.
Wiki sayfası ile test çelişirse test doğrudur.

### 1.2 Tespit edilen otorite boşluğu

`ARCH-0007` §1 ve §2, *"tipler elle yazılmaz — `openapi-typescript` kullanılır"* kuralını
**"RULE-0001"e** dayandırır. Bu wiki'deki `RULE-0001` ise
`02-Rules/RULE-0001-Package-And-Host-Boundary.md`'dir ve **paket/host sınırını** anlatır; UI tip
üretimiyle ilgisi yoktur. Atıf, bu depoya taşınmamış eski API Checker UI kural setine gidiyor.

**Sonuç:** *"UI tipleri elle yazılmaz"* kuralının bu depoda **bağlayıcı bir sahibi yok.**
G-03'ün otoritesi bu yüzden `ADR-0025` §B/§C'dir ve o da `proposed`'dır. Karar sahibe aittir
(§5, S-1).

---

## 2. Blokaj-0 — plan başlamadan çözülmesi gereken

> `abp-coding-standards` §2 "Gate concurrent worktree writers" gereği kayda geçirildi.

`ptn-assurance-platform` deposu **kirli**: `predev` dalında **23 değiştirilmiş + 2 izlenmeyen**
dosya var, `origin/predev` ile senkron.

| Değişen | Neden plan için kritik |
|---|---|
| `ptn-test-agent/src/**` (10 dosya) | Ajanın bearer doğrulaması **burada**. Saha denetiminde "wiki geride" dediğim E-3 aslında *commit'lenmemiş iş*. |
| `ptn-test-module/host/…/TestModuleHttpApiHostModule.cs` + `host/…/Emailing/` (untracked) | Emailing compose kararı **burada**. `ARCH-0006` §4.2 ile çelişkinin kaynağı bu. |
| `…/Domain/Data/PermissionGrantDataSeedContributor.cs` + 2 test | Rol→izin dağıtımı **burada**. G-07'nin doğrulama zemini. |
| İki checker `appsettings.json` | Host ayağa kalkma davranışı — G-03'ün önkoşulu. |

**Kural:** Bu değişiklikler commit'lenip `predev`'e girmeden, üstlerine UI sözleşmesi kurulmaz.
Sebebi somut: G-07 izin listesini `PermissionGrantDataSeedContributor.cs`'ten türetecek; o dosya
commit'lenmeden değişirse UI izin sözlüğü sessizce yanlış olur.

**Yapılacak:** Sahibi bu değişiklikleri kendi ticket'ında tamamlayıp commit etsin. Bu plan
o commit'ten *sonra* başlar. Bu iş bu planın kapsamında **değildir** — başkasının yarım işini
commit etmek `backend-verify` §3'te açıkça yasaktır.

---

## 3. Bulgu bazında karar otoritesi

### G-01 — Tip hatası: `outcomeCode`

| | |
|---|---|
| **Karar sorusu** | Koşum listesi sonuç koduna göre filtrelenebilir mi? |
| **Karar otoritesi** | `ptn-test-module/src/…Application.Contracts/Dtos/Runs/TestRunListInput.cs` |
| **Karar kuralı** | Backend DTO tek sözleşmedir. `TestRunListInput` **sekiz** filtre taşır; `OutcomeCode` yoktur. `OutcomeCode` yalnız `TestFindingListInput`'tadır. Dosyanın kendi yorumu gerekçeyi verir: *"agir rapor kolonlarini tasimaz"* — yani bu bir eksik değil, **bilinçli sınır**. |
| **Karar** | UI'dan filtre kaldırılır. UI tipi backend DTO'sunu birebir yansıtır; cast/`any` ile susturulmaz. |
| **Belirsizlikte** | Filtre gerçekten isteniyorsa bu bir **backend ticket'ıdır** (`TestRunListInput` + repository sorgusu + test). UI tarafında çözülmez. |
| **Doğrulama** | `npx tsc --noEmit` → 0 hata |

---

### G-02 — Lint kapsamı sahte

| | |
|---|---|
| **Karar sorusu** | 13 ignore deseninin her biri kalacak mı, kalkacak mı? |
| **Karar otoritesi** | `eslint.config.mjs` + G-04'ün ölü/canlı kararı |
| **Karar kuralı** | Ignore yalnız iki gerekçeyle meşrudur: (a) üretilmiş dosya, (b) `eslint-config-next`'in kendi varsayılanı. Onüçünün hiçbiri bu ikisine girmiyor — hepsi *"lint hatası veriyordu, sustur"* kaynaklı. Dolayısıyla **silinecek dosyanın ignore'u da silinir; yaşayacak dosya lint'e sokulur.** Ara yol yok. |
| **Karar** | Ignore listesi yalnız `eslint-config-next` varsayılanlarına iner. `src/**/*.test.ts` ignore'u G-11 ile birlikte kalkar. |
| **Belirsizlikte** | Bir kural gerçekten yanlış pozitifse dosya değil **kural** devre dışı bırakılır, satır bazında `eslint-disable-next-line` + gerekçe yorumu ile. Klasör bazında susturma geri gelmez. |
| **Doğrulama** | `npx eslint src` → 0 hata **ve** `eslint.config.mjs` içinde `src/` ile başlayan ignore satırı yok |

---

### G-03 — Üretilmiş tip şeması bayat ve tek kökenli

| | |
|---|---|
| **Karar sorusu** | Tipler nereden gelecek: üretim mi, elle mi? Hangi kökenden? |
| **Karar otoritesi** | **Yok — boşluk.** `ADR-0025` §B/§C tek aday ve `proposed`. `ARCH-0007`'nin dayandığı "RULE-0001" bu depoda başka bir kuraldır (§1.2). |
| **Karar kuralı** | Sahip `ADR-0025`'i `accepted` yaparsa: `openapi-typescript` ile **yalnız** `<TEST_MODULE_ORIGIN>` Swagger'ından üretilir, çıktı elle düzenlenmez; ajan tipleri elle yazılır ve `ptn-test-agent/src/contracts.ts` ile hizalama testine bağlanır. Kabul gelmezse mevcut elle yazma sürer ve bayatlık kalıcı borç olarak kaydedilir. |
| **Önkoşul** | Tek Swagger ancak host ayağa kalkarsa alınır. `CURRENT-0007` E-4: host `Database:EnsureSharedAbpSchema=true` olmadan açılmıyor; bayrak açık olsa da Authenticator migration'ları uygulanmamışsa ayar/izin yüzeyi 500 veriyor. Yani **önce Authenticator migration'ları aynı veritabanına uygulanır.** |
| **Belirsizlikte** | Host ayağa kalkmıyorsa şema üretilmez ve **sahte şema yazılmaz**. Faz durur, engel raporlanır. |
| **Doğrulama** | `schema.d.ts` içinde `Ptn.TestModule` ve `DatabaseChecker` şemaları > 0; `/api/lookups/` yolu yok, `/api/api-contract/lookups/` var |

---

### G-04 — Kaynağın %41'i erişilemez

| | |
|---|---|
| **Karar sorusu** | 119 ölü dosyanın hangisi **silinecek**, hangisi **bağlanacak**? |
| **Karar otoritesi** | İki kaynak birlikte: **(1)** `ARCH-0006` §1 portal iskeleti (dört alan + settings) ekranın var olup olmayacağını söyler; **(2)** backend controller envanteri o ekranın veri kaynağı var mı söyler. |
| **Karar kuralı** | Üç kova, deterministik: <br>**SİL** — arkasında backend ucu olmayan veya birebir kopya olan (`db-types/**` 19 dosya `types/**` kopyası; `api/test-module/client.ts` hiç import edilmiyor; `stores/useAuthStore.ts` ikinci store). <br>**BAĞLA** — `ARCH-0006`'da ekranı olan ve ucu yaşayan (`features/team`, `features/lookups`, `features/email`). `app/(portal)/settings/*` `redirect()` kabukları gerçek sayfayla değişir. <br>**KARAR BEKLE** — ucu kaldırılmış olan (`features/recipients` → G-05). |
| **Belirsizlikte** | Bir dosya üç kovaya da girmiyorsa silinmez, `claudedocs/`'ta karar bekleyen listesine yazılır. Şüpheli silme yapılmaz. |
| **Doğrulama** | Erişilebilirlik taraması yeniden koşulur; ölü dosya sayısı 0 veya her kalan için yazılı gerekçe |

---

### G-05 — Kaldırılmış uçlara bağlı ekranlar

| | |
|---|---|
| **Karar sorusu** | `recipients`, `email`, `conformance` yüzeyleri bugün nerede yaşıyor? |
| **Karar otoritesi** | Checker kaynağı — `checkers/api-contract/src/**` ağacı ve `ApiContractCheckerRoutes.cs` |
| **Karar kuralı** | Kaynakta klasörü olmayan uç **yoktur**; wiki ne derse desin. Ölçüm: `src/` altında recipient/email klasörü yok → `/api/recipients` ölü. `ApiContractCheckerRoutes.Conformance = "api/contract-checks/conformance"` → UI'daki `/api/conformance/runs` yanlış. `Routes.Lookups.*` modül önekli → `/api/lookups` ölü. |
| **Karar** | Ölü yola giden istemci ve ekran silinir. Yanlış yazılmış yol (`conformance`) sabit sınıftaki değere hizalanır. |
| **Belirsizlikte** | E-posta yüzeyi özel: `EmailingHttpApiModule` **compose ediliyor** ama bu commit'lenmemiş (Blokaj-0). Blokaj-0 kapanana kadar e-posta ekranı kararı verilmez. `CURRENT-0007` G-11 hâlâ geçerli: `POST /api/emailing/emails` son kullanıcıya açılmaz. |
| **Doğrulama** | UI'daki her `/api/...` literali için backend'de karşılık gelen route sabiti bulunur; eşleşmeyen kalmaz |

---

### G-06 — Üç paralel mimari

| | |
|---|---|
| **Karar sorusu** | Hangi yığın hayatta kalacak? |
| **Karar otoritesi** | `ADR-0025` §B (`proposed`) + `CURRENT-0006` + fiilî olgunluk ölçümü |
| **Karar kuralı** | `ARCH-0007` §1 bu soruyu zaten cevaplamış ve o bölüm **hâlâ geçerli** sayılıyor (`ARCH-0007` uyarı kutusu §1 ve §3'ün kalıcı değerde olduğunu söyler): *"Yeni UI, daha katı standartlara sahip **API Contract Checker UI** kurallarını baz alacaktır; eski generic servis yapısı tamamen terk edilecektir."* <br>Ölçüm de aynı yöne işaret ediyor: `features/*` yığını tipli, `TanStack Query` kullanıyor, `Chakra` ile tutarlı ve lint'e giriyor; diğer ikisi `any` + inline style + lint dışı. |
| **Karar** | `features/*` + `*.api.ts` hedef yığındır. `components/shared/*` + `services/*` göç eder. `app/test/*` de aynı yığına taşınır. İki store → `stores/auth-store.ts`; iki hata sözlüğü → `i18n/error-messages.ts`. |
| **Belirsizlikte** | Göç tek seferde değil, ekran ekran yapılır. Bir ekran taşınmadan eski karşılığı silinmez. |
| **Doğrulama** | `services/` ve `components/shared/` klasörleri boş; `grep "useAsyncResource"` → 0 |

---

### G-07 — İzin sözlüğünde tek modül var

| | |
|---|---|
| **Karar sorusu** | UI hangi izin adlarını tanıyacak ve butonu neye göre gizleyecek? |
| **Karar otoritesi** | Üç kaynak, sırayla: <br>**(1)** `ptn-test-module/src/…Domain.Shared/Permissions/TestModulePermissions.*.cs` (4 dosya) <br>**(2)** `checkers/database-comparison/src/…Domain.Shared/Permissions/DatabaseCheckerPermissions.*.cs` (6 dosya) <br>**(3)** çalışma zamanı: `GET /api/abp/application-configuration` → `auth.grantedPolicies` |
| **Karar kuralı** | `house-profile.md` "Stable string ownership": izin adının tek sahibi `Domain.Shared`'dır. UI adı **kopyalar**, türetmez, kısaltmaz. `ADR-0025` §F: izin yoksa buton **render edilmez**; `403` almak UI hatasıdır. `Anonymous` uçlar (`runs/webhook`) istemcide **tanımlanmaz** (`CURRENT-0007` G-14). |
| **Ek kanıt** | Hangi rolün hangi izni aldığı `PermissionGrantDataSeedContributor.cs`'tedir — **şu an commit'lenmemiş** (Blokaj-0). Bu adım Blokaj-0'a bağlıdır. |
| **Belirsizlikte** | `Publish` ikili izin ister (`Approve` + `Publish`) ve ikisi aynı kişiye verilebilir. `CURRENT-0007` §2 uyarısı: UI bunu **güvenlik kontrolü gibi sunmaz**, en fazla uyarı gösterir. |
| **Doğrulama** | `lib/permissions.ts` sabitleri ile üç `*Permissions*.cs` ailesi arasında ad farkı yok; gizli butonun ucuna istek atılmadığı ağ kaydıyla doğrulanır |

---

### G-08 — Ortam bağlama yüzeyi yok

| | |
|---|---|
| **Karar sorusu** | Ortam formu hangi alanları taşıyacak? |
| **Karar otoritesi** | `TestEnvironmentController` + `TestEnvironmentBindingDto` + `ARCH-0006` §2.6 |
| **Karar kuralı** | DTO **sır değeri taşımaz**. `CURRENT-0007` G-08 kesin: *"Ortam formunda sır/parola alanı yoktur — yalnız `secretRef` referansı."* `api.secretRef` Vault'tan çözülür ve runner'a tek ortam değişkeni olarak geçer (KBP-112). |
| **Karar** | Form yalnız `environmentKey` + referans anahtarlarını alır. Parola alanı **eklenmez**. Yazma eylemleri `Runs.ManageEnvironments`, sandbox sıfırlama `Runs.SandboxReset` iznine bağlanır. |
| **Belirsizlikte** | DTO'da anlamı belirsiz alan varsa `TestEnvironmentBindingDto` okunur; wiki'den tahmin edilmez. |
| **Doğrulama** | Form kaynağında `password`/`secret` girdi alanı yok; 5 uç da çağrılıyor |

---

### G-09 — Bulgu ve sağlık ekranları çağrılmıyor

| | |
|---|---|
| **Karar sorusu** | Bulgu listesi hangi kapalı sözlüklerle gösterilecek? |
| **Karar otoritesi** | `CURRENT-0007` §4 kapalı sözlük tablosu + `Domain.Shared/Constants/**` |
| **Karar kuralı** | Rozet, etiket ve açılır listedeki her değer backend'deki kapalı kümeden gelir; **UI'da yeniden tanımlanmaz**. Yerelleştirilmiş `name`/`description` veritabanı satırlarından (`/api/test-module/lookups/*`) okunur; kod sabitleri yalnız dallanma mantığında kullanılır. |
| **Kritik ayrım** | `Inconclusive` bir **hata değildir**. `CURRENT-0007` §4: kırmızı `Failed` ile aynı renkte gösterilirse kullanıcı var olmayan bir hatayı kovalar. Aynı ilke `Unavailable` ve `NOT_BOUND` için de geçerli — *"kanıt toplanamadı"* denir, *"yetki yok"* denmez. |
| **Ek** | `getSession` bağlanır; `TtlMs` görünür olur ve %80'de uyarı verir (`CURRENT-0007` G-07). |
| **Belirsizlikte** | Bir kod sözlükte yoksa ekranda ham kod gösterilir; UI çeviri uydurmaz. |
| **Doğrulama** | `Inconclusive` için ayrı görsel durum var; lookup listeleri veritabanından geliyor |

---

### G-10 — Köprü yüzeyi bağlanmamış

| | |
|---|---|
| **Karar sorusu** | Dokuz köprü ucundan hangisi ekrana çıkar, hangi kademede? |
| **Karar otoritesi** | `ARCH-0006` §2.3 izin tablosu + `RULE-0005` + `ADR-0018` |
| **Karar kuralı** | Her uç kendi `TestModule.Bridge.*` iznine bağlanır. İki sınır mutlaktır: <br>**(a)** `overlay-suggestion` **kademe 4** ve `Applied` alanı önerinin uygulanmadığını taşır → ekran *"uygula"* değil **"incele ve dışa aktar"** olarak kurulur. <br>**(b)** `ADR-0025` §D: `tool_call_result` eklenmez — tool sonucu modele gider, tarayıcıya gitmez; ajan checker'ın ham kanıtını **görmez ve göstermez** (`ADR-0018`). |
| **Sayı uyarısı** | `PtnToolCodes.Governed` **12** kod taşır ama `PtnMcpTools` bunlardan **10**'unu register eder; `PatchSuggest` ve `PatchReview` `ReviewOnly` kümesinde ve `tools/list`'te görünmez. UI tool rozetini `tools/list ∩ ptn_profile.allowedToolCodes` olarak kurar — 12 değil. |
| **Belirsizlikte** | Bir ucun ekran karşılığı `ARCH-0006`'da yoksa ekran açılmaz; istemciye tanım eklenip ekran ertelenir. |
| **Doğrulama** | 9 + 1 uç izinle koşullu; `overlay-suggestion` ekranında "uygula" butonu yok |

---

### G-11 — Test koşucusu yok

| | |
|---|---|
| **Karar sorusu** | Hangi koşucu? |
| **Karar otoritesi** | Kardeş proje kanıtı — `ptn-test-agent/package.json` |
| **Karar kuralı** | `dotnet-clean-code-standards` §2 "Copy structure, not names": aynı organizasyonda kardeş TypeScript projesi **Vitest 4.1.10** kullanıyor ve `test` / `test:unit` / `test:integration` scriptlerini taşıyor. Yeni bir koşucu seçmek için gerekçe yok. |
| **Karar** | Vitest kurulur, kardeşin script şeması kopyalanır, mevcut üç test dosyası koşturulur. `ADR-0025` §C'nin ajan↔UI hizalama testi buraya eklenir (ADR kabul edilirse). |
| **Belirsizlikte** | Üç mevcut test bugün geçmiyorsa **test düzeltilir, silinmez**; silinen kapsam `backend-verify` §3'te ayrıca raporlanır. |
| **Doğrulama** | `npm test` → 3/3 veya daha fazla geçer; `eslint.config.mjs`'de test ignore'u yok |

---

### G-12 — Ölü istemci sabit port taşıyor

| | |
|---|---|
| **Karar sorusu** | Origin değerleri kaynak dosyada bulunabilir mi? |
| **Karar otoritesi** | `ADR-0025` §A (`proposed`) — *"Origin değerleri derleme zamanında sabitlenmez; `localhost` veya port hiçbir kaynak dosyada bulunmaz."* |
| **Karar kuralı** | `api/test-module/client.ts` zaten ölü ve hiç import edilmiyor → G-04'ün **SİL** kovasına girer, ADR beklemez. Kalan iki fallback (`lib/api-client.ts:17-18`, `api/agent.ts:42`) ADR'nin kabulüne bağlıdır. |
| **Belirsizlikte** | ADR kabul edilmezse fallback'ler kalır ama `.env.example` ile birebir aynı değeri taşımaları zorunlu tutulur (bugün `api-client.ts` `44366`, `.env.example` `44366` — tutuyor). |
| **Doğrulama** | `grep -rE "localhost\|:[0-9]{4,5}" src/` → yalnız kabul edilen istisnalar |

---

### G-13 — Ajan yalnız tek modülde

| | |
|---|---|
| **Karar sorusu** | Ajan her ekranda mı görünecek? |
| **Karar otoritesi** | İki kaynak çelişiyor: `IMPLEMENTATION-STATUS.md` 5/9 *"pet her ekranda sol alt köşeye sabitlenecek"* der; `ARCH-0005`/`ARCH-0006` ajanı **yazarlık alanına** bağlar. |
| **Karar kuralı** | Merdiven §1: uygulama defteri kullanıcının kendi hedef beyanıdır (sıra 1'e yakın), wiki mimarisi sıra 5. **Ancak** `ADR-0025` §E daha sert bir sınır koyar: *"tarayıcı ajana doğrudan bağlanmaz"* — ajan yüzeyi UI'ya ancak kimlik doğrulaması sağlandıktan sonra açılır. |
| **Karar** | Görünürlük genişletmesi **§5 S-2'ye bağlıdır**. Teknik olarak ajan artık bearer doğruluyor (Blokaj-0'daki commit'lenmemiş kod), ama bu commit'lenip `ADR-0025` §E'nin iki şıkkından biri karşılandı diye kabul edilmeden ajan diğer modüllere açılmaz. |
| **Belirsizlikte** | Karar gelmezse mevcut durum korunur — `/test` dışında `showAgent={false}` kalır. |
| **Doğrulama** | Karara göre: ya `showAgent` kaldırılmış, ya gerekçe yazılı |

---

### G-14 — Wiki koddan geride

| | |
|---|---|
| **Karar sorusu** | Wiki mi düzeltilecek, kod mu? |
| **Karar otoritesi** | `ADR-0001` (wiki governance) + `git status` |
| **Karar kuralı** | Saha denetiminde *"wiki geride"* dedim; `git status` daha kesin bir cevap veriyor: **wiki geri değil, kod commit'lenmemiş.** Bu yüzden düzeltme wiki'de değil, Blokaj-0'ın commit'inde yapılır — o commit `docs/`'u da aynı iş içinde günceller. |
| **Etkilenen satırlar** | `CURRENT-0007` E-3 (ajan kimlik doğrulaması) · `ARCH-0006` §4.2 (Emailing compose) · `CURRENT-0001` "ajan kodu depoda değil" (kaynak artık izleniyor) |
| **Kural** | `ADR-0001`: engel kapandığında satır **silinmez**, "kapandı" olarak işaretlenir ve kanıt commit'i yazılır. |
| **Belirsizlikte** | — |
| **Doğrulama** | Üç satır kanıt commit'i ile işaretli |

---

## 4. Faz planı ve kapılar

Her faz bir iş dalıdır. **Başarısız kapıdan sonra sonraki faza geçilmez** (`AGENTS.md`).

| Faz | İş | Bağımlılık | Kapı |
|---|---|---|---|
| **0** | Blokaj-0: backend worktree'nin sahibi tarafından commit'lenmesi | — | `git status` temiz; `check-backend-diff.ps1` geçti |
| **1** | G-01 tip hatası + G-02 lint ignore listesi | — | `tsc --noEmit` 0 · `eslint src` 0 |
| **2** | G-04 ölü kod tasnifi + G-05 ölü uç temizliği + G-12 ölü istemci | Faz 1 | Erişilemez dosya 0 veya gerekçeli; UI'daki her route backend sabitinde var |
| **3** | G-03 tek tip kaynağı | Faz 0, 2 · §5 S-1 | `schema.d.ts` üç modülü de içeriyor; host smoke geçti |
| **4** | G-07 izin sözlüğü | Faz 0, 3 | Üç izin ailesi UI'da; gizli butona istek yok |
| **5** | G-08 ortam + G-09 bulgu/sağlık/TTL | Faz 3, 4 | 5 P0 ekranı çağrılıyor; `Inconclusive` ayrı durumda |
| **6** | G-06 yığın birleştirme | Faz 2, 5 | `services/` ve `components/shared/` boş |
| **7** | G-10 köprü + G-13 ajan görünürlüğü | Faz 4 · §5 S-2 | 10 uç izinle bağlı; `overlay-suggestion` salt inceleme |
| **8** | G-11 test koşucusu + G-14 wiki senkronu | Faz 1 | `npm test` geçti; üç wiki satırı işaretli |
| **9** | Kontrollü doğrulama | Hepsi | `IMPLEMENTATION-STATUS.md` 9/9 sırası |

**Faz 9 sırası (defterden birebir):** lint → type/build → backend scanner/build/test → API smoke →
gerçek DB ve API karşılaştırma senaryoları → **en son** tarayıcı ekran turu ve responsive kontrol.

---

## 5. Sahibe ait açık kararlar

Bu dördü **kod boşluğu değil ürün kararıdır**. Cevapsız kalırsa bağlı fazlar bekler.

| # | Soru | Kilitlediği | Cevapsızsa |
|---|---|---|---|
| **S-1** | `ADR-0025` `accepted` olacak mı? | G-03 · G-06 · G-12 (Faz 3, 6) | Elle tip yazımı sürer, bayatlık kalıcı borç |
| **S-2** | Ajan yüzeyi UI'ya açılıyor mu? `ADR-0025` §E'nin hangi şıkkı? | G-13 (Faz 7) | Ajan `/test` ile sınırlı kalır |
| **S-3** | E-posta yüzeyi son kullanıcıya açılacak mı? | G-05 e-posta dalı | E-posta ekranı planlanmaz (`CURRENT-0007` G-11) |
| **S-4** | Sohbet geçmişi kalıcı olacak mı? (`agent_sessions`) | Yazarlık oturumu sürdürme | TTL dolunca oturum kaybolur |

`CURRENT-0007` §7 ayrıca iki soru daha açık bırakır (otonomi seviyesi ayarı, `RULE-0008` DMN
kapsam kapısının UI'da gösterilmesi). İkisi de bu planın kapsamında değildir.

---

## 6. Doğrulama ve commit rejimi

### 6.1 UI deposu Git değil

`ptn-assurance-platform-ui` bir Git deposu **değildir** (yalnız `.gitignore` var). Sonuçları:

- Commit **yoktur** ve iddia edilmez (`backend-verify` §3).
- `git init` **çalıştırılmaz** — global `CLAUDE.md`: *"never initialize Git or manufacture history."*
- Her faz için **dosya defteri** tutulur: değiştirilen ve eklenen dosyaların tam listesi.
- Faz sonunda o defter `claudedocs/` altına yazılır.

### 6.2 Backend deposu Git

Backend tarafına dokunulursa (Faz 0, Faz 3 önkoşulu):

- Dal `KBP-<no>`, bir dal = bir commit (`README.md`).
- Konu satırı: `#KBP-<no> <type>: <past-tense>` — yeni iş için **`created`**, asla `added`.
- Commit öncesi zorunlu:
  ```
  check-backend-diff.ps1 -CommitMessage "#KBP-<no> <type>: <subject>"
  ```
- Bilinen yanlış pozitif: `TestScenarioManager.cs` üzerinde **13 adet `[ENTITY]`**. Yeni
  değişikliğin bulgu ekleyip eklemediği bu **13** sayısıyla karşılaştırılır.

### 6.3 Tamamlanma dili

`completion-review.md` gereği, kesin ifadeler kullanılır:

- `Kod yazıldı; build koşulmadı.`
- `Build geçti; hedefli testler geçti (N/N); geniş testler koşulmadı çünkü …`
- `Hiçbir dosya stage'lenmedi veya commit'lenmedi.`

Gerekli kontrol koşmadıysa veya başarısızsa **"tamamlandı" / "doğrulandı" / "çalışıyor" yazılmaz.**

---

## 7. Bu plandan çıkarılan sınırlar

Bu belge yalnız plandır. Aşağıdakiler bilinçli olarak **yapılmadı**:

- Kod yazılmadı, hiçbir dosya değiştirilmedi.
- Build, test, migration veya host çalıştırılmadı.
- Mimari karar verilmedi — açık olanlar §5'te sahibe bırakıldı.
- Blokaj-0'daki commit'lenmemiş backend işi **sahiplenilmedi**.

Sonraki adım `/sc:implement` ile **Faz 1**'dir (Faz 0 sahibin işidir).
