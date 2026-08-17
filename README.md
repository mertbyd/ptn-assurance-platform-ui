# PTN Assurance Platform — Birleşik Arayüz

API sözleşmesi, veritabanı kalıcılığı ve iş senaryosu doğrulamasını **tek arayüzde** birleştiren
Next.js uygulaması. Backend tarafı `ptn-assurance-platform` deposundadır; bu depo yalnız
istemcidir ve hiçbir iş kuralı barındırmaz.

---

## 1. Ürün tek cümlede

İnsan iki metin yükler — **iş akışı** ve **iş kuralları** — bir ajan bunları checker'lardan
gelen **gerçek kanıta** bağlayarak Arazzo 1.0.1 test belgesi yazar, insan onaylar, koşum yapılır
ve *hangi adımda, ne test edilirken, hangi katmanın neden hayır dediğini* söyleyen bir rapor çıkar.

Sistemin sorumluluk sınırı katıdır:

| Soru | Cevaplayan |
|---|---|
| Bu adım hangi API operasyonuna düşüyor? | API Contract Checker |
| Yanıt sözleşmeye uyuyor mu? | API Contract Checker |
| Satır düştü mü, değer doğru mu? | Database Checker |
| Adımlar nasıl koştu? | Arazzo Runner (Respect) |
| **Geçti mi kaldı mı?** | **Yalnız checker** — ajan değil, runner değil |

Bu ayrım arayüze de yansır: **ajan hakem değildir.** Hiçbir ekran model çıktısını "geçti/kaldı"
olarak göstermez; hüküm yalnız `TestOutcomeStatusCodes` sözlüğünden gelir.

---

## 2. Çalışması için gereken süreçler

Arayüz **üç ayrı kökene** konuşur. İkisi zorunludur, üçüncüsü yalnız yazarlık sekmesi için gerekir.

| Köken | Varsayılan | Ne sunar | Zorunlu mu |
|---|---|---|---|
| `NEXT_PUBLIC_AUTH_ORIGIN` | `https://localhost:44323` | Giriş, oturum tazeleme, tenant, kullanıcı, rol | **Evet** — bu olmadan giriş yapılamaz, hiçbir ekran açılmaz |
| `NEXT_PUBLIC_TEST_MODULE_ORIGIN` | `https://localhost:44366` | Test Module + iki checker + Notifications + e-posta | **Evet** |
| `NEXT_PUBLIC_AGENT_ORIGIN` | `http://localhost:4310` | Ajan sohbeti (HTTP + SSE) | Yazarlık sekmesi için evet |

> [!IMPORTANT] Neden Authenticator ayrı bir host
> Test Module bir **resource server**'dır: `Authenticator.HttpApi` paketini referanslamaz ve
> composition'ında hiçbir Authenticator modülü yoktur. Kimliğin domain/EF katmanları paketten
> gelir (tablo sahibi Authenticator'dır) ama **login HTTP yüzeyi gelmez**. Host'un kendi
> composition yorumu bunu söyler: *"kimliği ayrı deploy edilen Authenticator'dan bearer token
> ile tüketir"*.

> [!CAUTION] Ajan kapalıyken yazarlık sekmesi kilitlidir
> "Mühürle ve ajana yükle" adımı önce kuralları Test Module'e mühürler (çalışır), hemen
> ardından bağlamı ajana yükler. Ajan kapalıysa burada durur ve **"Yazarlık oturumunu başlat"
> butonu hiç açılmaz**. Diğer sekmeler (Senaryolar, Koşumlar, Bulgular, Ortamlar) ve API
> Sözleşme / Veritabanı modülleri ajansız normal çalışır.

---

## 3. Kurulum

### 3.1 Önkoşullar

| Gereksinim | Not |
|---|---|
| Node.js **≥ 20.9** | `next@16` şartı |
| npm | Depo `package-lock.json` ile gelir |
| PostgreSQL + Redis | Backend host'larının bağımlılığı |
| Vault | Sır çözümü — bağlantı parolaları ve API token'ları burada durur |

### 3.2 Backend'i ayağa kaldırma sırası

1. PostgreSQL, Redis ve Vault çalışır durumda olsun.
2. **Authenticator migration'ları uygulanmış** olsun — kimlik, izin ve ayar tablolarının sahibi odur.
3. `Authenticator.HttpApi.Host` → `:44323`
4. Test Module host → `:44366`. Host, `Database:EnsureSharedAbpSchema=true` **olmadan hiç
   açılmaz**; bayrak açık olsa bile Authenticator migration'ları uygulanmamışsa ayar/izin
   yüzeyi 500 verir.
5. (Yazarlık için) `ptn-test-agent` → `:4310`. Kendi ortam değişkenleri: `OPENAI_API_KEY`,
   `PTN_MCP_URL`, `AUTH_ORIGIN`, `UI_ORIGIN`.
   **`UI_ORIGIN` tam eşleşmeli CORS kullanır** — arayüz 3000 dışında bir portta koşarsa ajan
   çağrıları sessizce düşer.

### 3.3 Arayüzü çalıştırma

```bash
npm ci
cp .env.example .env.local   # üç kökeni kendi portlarınıza göre düzenleyin
npm run dev
```

`http://localhost:3000` → giriş ekranı.

> Backend'ler HTTPS ve geliştirme sertifikası kullanıyorsa, tarayıcının `:44323` ve `:44366`
> sertifikalarını bir kez kabul etmesi gerekir; aksi hâlde istekler yanıt bile dönmeden
> `NETWORK_ERROR` olur.

### 3.4 Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Turbopack ile geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm start` | Derlenmiş çıktıyı sunar |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Tip denetimi |

> Turbopack **bilinçli olarak varsayılandır**. Depo bir dönem `--webpack` ile açılıyordu;
> ölçüldü, derleme 76 sn'den 28 sn'ye indi. Webpack'e dönmek gerekirse `next dev --webpack`.

---

## 4. Modüller ve ekranlar

Üst bardaki modül anahtarı renk kodludur: API Sözleşme kırmızı vurgulu, Veritabanı mavi,
Test Platform kehribar, Ekip mor, Ayarlar yeşil.

### 4.1 API Sözleşme — `/api-contract`

| Sekme | Ne yapar |
|---|---|
| **Kaynaklar** | Spec kaynağı CRUD'u, erişilebilirlik testi, doküman monitoring'i, snapshot zaman çizelgesi |
| **Snapshot Explorer** | Endpoint ağacı, şema kataloğu, request/response ve curl görünümü |
| **Kıyasla** | Baz/hedef snapshot seçimi, **canlı** veya kayıtlı hedef, kapsam kuralları, fark raporu ve filtrelenebilir bulgular |

"Canlı" hedef soyut değildir: seçim anında kaynaktan yeni bir snapshot yakalanır ve kıyaslama
o donmuş görüntüye bağlanır.

### 4.2 Veritabanı — `/database`

| Sekme | Ne yapar |
|---|---|
| **Bağlantılar** | Bağlantı CRUD'u, erişim testi, pasife alma |
| **Şema Gezgini** | Şema → tablo/nesne → kolon, index, constraint, trigger |
| **Kıyasla** | Kaynak/hedef, şema seçimi, `Include` · `Exclude` · `Ignore` · `DataCompare` kapsamları |
| **Koşumlar** | Karşılaştırma geçmişi, rapor, fark listesi |

### 4.3 Test Platform — `/test`

Beş sekme. Ürünün kalbi ilkidir.

#### Agent ile Yazarlık — üç bölgeli tezgâh

IDE mantığında bir çalışma yüzeyi: **solda kalıcı kanıt rayı**, **ortada sabit sohbet çapası**,
**altta terminal gibi boyutlanabilir belge paneli**. Bölmeler sürüklenerek boyutlanır ve ölçüler
`localStorage`'da korunur.

Kanıt rayı altı numaralı adımdan oluşur:

1. **Malzeme** — senaryo metni (yalnız ajan bağlamı) + iş kuralları (kanonik kaynağa yazılır ve
   mühürlenir). Kural metni değişirse mühür düşer.
2. **Sözleşme** — kaynak → doküman → snapshot. "Canlı" seçilirse sözleşme o an yakalanır.
3. **Operasyonlar** — adımların bağlanacağı uçlar. Opak referansı insan-okur `METHOD /path`'e
   çeviren tek kaynak budur.
4. **Veritabanı** — bağlantı → aday tablo → çözülmüş tanım. Adaylar ancak bir operasyon
   seçildikten sonra gelir: veritabanı adımı, o operasyonun **ne yazdığını** doğrular.
5. **Profil paketi** — iş kavramlarını şemaya bağlar; bağlanmamış kavram, yazılamayan adım demektir.
6. **İş akışı** — ad ve özet insandan, kaynak adresleri seçimlerden üretilir.

Alt panelde beş sekme: **Adımlar** · **Sorular** · **DB adımı** · **Arazzo** · **Yayın**.

- **DB adımı editörü** kapalı kümelerini sunucudan alır: doğrulanabilir kolonlar, izinli
  matcher'lar ve aday anahtarlar tablo tanımından gelir; arayüz bunları sabitlemez.
- **Arazzo** bir **okuyucudur**, editör değil — serbest düzenleme kaynak mührünü kırardı.
  Eklenen satırlar bir önceki belgeye göre işaretlenir.
- **Yayın** sırası sabittir: `compile-preview` → `evaluate-publication` → (yeşilse) `publish`.
  Beş kapı kod bazında gösterilir ve her biri "nasıl düzelir" bilgisini taşır.

#### Sohbet yüzeyi

- Ajanın ne yaptığı **soluk aktivite satırında** görünür — mesaj balonu değil. Yalnız araç
  **adı** akar; argüman ve sonuç tarayıcıya hiç gelmez. Tur bitince satırlar tek özete çöker.
- **Kapalı soru kartı**: girdi yalnız seçimdir. Serbest metin kutusu ve "diğer" seçeneği
  **yoktur** — ajan tahmin etmez. Bekleyen her soru tam bir kez cevaplanır.
- **Onay kartı** kanıt-birincil sıradadır: önce ne yapılacak ve ne değişecek, sonra soluk bir
  blokta ajanın gerekçesi. Reddetme oturumu kapatır ve geri döndürmez.
- Tur/token bütçesi ve 30 dakikalık yazarlık TTL'i başlıkta canlı durur.
- Ajan maskotu sürüklenebilir; tıklanınca köşesine koşar.

#### Diğer sekmeler

| Sekme | Ne yapar |
|---|---|
| **Senaryolar** | Katalog, durum filtresi, derle→onaya sun→kapı değerlendir→yayınla, karantina, cron, kullanımdan kaldırma ve silme |
| **Koşumlar** | Koşum listesi ve raporu, iptal, kuru koşum çelişki kartı, teşhis, CTRF/JUnit/SARIF ihracı, HAR indirme |
| **Bulgular** | Tüm koşumlardaki bulgular; hüküm, kaynak checker, kural ve koşum filtreleri; satır açılınca parmak izi |
| **Ortamlar** | Ortam bağlama, düzenleme, kaldırma, sandbox sıfırlama |

> Ortam formunda **parola alanı yoktur ve olamaz**. Sözleşme sır *değeri* taşımaz, yalnız Vault
> referans anahtarı taşır; sır koşum anında sunucuda çözülür.

### 4.4 Ekip — `/team` · Ayarlar — `/settings`

Organizasyonlar, kullanıcılar, rol ve izinler; e-posta sağlayıcı ve şablonları; lookup yönetimi;
alıcı listeleri. Tenant ve kullanıcı çağrılarının tamamı `<AUTH_ORIGIN>`'e gider.

---

## 5. Arayüzün uymak zorunda olduğu değişmezler

Bunlar tasarım tercihi değildir; ihlal edilirse ürün yanlış çalışır.

| # | Değişmez | Ekrandaki karşılığı |
|---|---|---|
| 1 | Ajan hakem değildir | Hiçbir ekran model çıktısını hüküm olarak göstermez |
| 2 | Ajan tahmin etmez | Ajan girdisi olan hiçbir alan serbest metin değildir |
| 3 | Türetilemeyen assertion yayınlanamaz | Adımda en az bir beklenti zorunludur |
| 4 | Yayın sırası sabittir | `publish` asla ilk eylem değildir |
| 5 | Mühürleri sunucu üretir | İstemci spec/DB parmak izi göndermez |
| 6 | `Inconclusive` bir hata değildir | Kırmızıya boyanmaz; "hiçbir şey doğrulanmadı" demektir |
| 7 | Kanıt toplanamadıysa "yetki yok" denmez | "Kanıt okunamadı" yazılır |
| 8 | Kapalı sözlükler uydurulmaz | Rozetin rengi koddan, **yazısı** lookup satırından gelir |
| 9 | Sır değeri tarayıcıdan geçmez | Yalnız Vault referansı |
| 10 | Gizlenen eylem için istek atılmaz | İzinsiz buton çizilmez |

---

## 6. Mimari

### 6.1 Dizin düzeni

```
src/
├── api/          HTTP sözleşmeleri — her backend ailesi için bir dosya
├── app/          Next.js App Router rotaları
│   ├── (auth)/   login · confirm-email · accept-invitation
│   ├── (portal)/ api-contract · database · settings
│   ├── test/     Test Platform (beş sekme)
│   └── team/     Ekip yönetimi
├── components/   shell (ModuleShell) · ui (FloatingAgent) · layout · shared
├── features/     Alan bazlı bileşen ve hook'lar (sources, checks, database, email…)
├── lib/          api-client · hata eşleme · izinler · biçimlendirme
├── stores/       Zustand oturum durumu
└── types/        Paylaşılan tipler
```

### 6.2 İstemci katmanı kuralı

**Tipler elle yazılmaz.** `src/api/generated/schema.d.ts` Swagger'dan üretilir ve
`sources.api.ts`, `snapshots.api.ts`, `checks.api.ts` bu tipleri kullanır.

> [!WARNING] Üretilmiş şema şu an bayattır
> Dosya **2026-08-07** tarihlidir; checker'ın `alpha.5` (uygunluk ailesi) ve `alpha.7`
> (operasyon envanteri) yüzeylerini içermez. Bu yüzden `conformance.api.ts` ve
> `snapshots.api.ts`'in yeni bölümleri ile `test.ts`'in köprü tipleri paketlenen kaynaktan
> **elle hizalanmıştır**. Swagger tek kökenden yeniden üretildiğinde bunlar üretilmiş
> tiplerle değiştirilmelidir.

Zarf ve hata biçimi tek yerde açılır (`lib/api-client.ts`):

| Köken | Başarı | Hata |
|---|---|---|
| Test Module + checker | `Result<T>` · `PagedResultDto<T>` | ABP `RemoteServiceErrorResponse` |
| Ajan | düz JSON / `text/event-stream` | `{ code }` — kapalı küme |

### 6.3 Ajan olay sözlüğü

SSE yedi olay taşır: `text_delta` · `tool_call` · `input_required` · `approval_required` ·
`completed` · `cancelled` · `error`.

İki ayrıntı arayüzü doğrudan belirler:

1. `input_required` ve `approval_required` **akışı bitirir**. Devam, cevaplarla yeni bir mesaj
   isteği ya da onay çağrısıyla olur.
2. **Araç bitiş olayı yoktur.** `tool_call` araç çalışmadan önce yayılır; bitiş, sonraki
   olaydan **türetilir**. Arayüz durum uydurmaz.

---

## 7. Wiki eşlemesi

Kanonik ürün kuralları `ptn-assurance-platform/docs/wiki-brain` altındadır. Bu arayüzün
dayandığı sayfalar:

| Wiki | Bu depodaki karşılığı |
|---|---|
| ARCH-0004 · Altı An | Ürün akışı — §1 |
| ARCH-0005 · Ajan yüzeyi | Sohbet, kapalı soru, onay kartı, TTL/bütçe — §4.3, §6.3 |
| ARCH-0006 · Ekran–uç–izin matrisi | Modül/sekme envanteri — §4 |
| CURRENT-0007 · UI gereksinim analizi | Değişmezler tablosu — §5 |
| CURRENT-0002 · Checker paket gerçeği | Paket sınırı ve sürüm otoritesi — §8 |
| RULE-0005 / 0006 / 0007 | Değişmezler 1, 3, 2 |
| ADR-0013 / ADR-0005 | Auth'un ayrı host olması — §2 |

Arayüzün wiki ile **uyuşmadığı** yerler (kod doğrudur, wiki eskidir):

| Wiki iddiası | Kodun gerçeği |
|---|---|
| ARCH-0005 §8 · *"Ajan yüzeyinde kimlik doğrulama yok"* | Beş ucun beşi de bearer doğrular; token `<AUTH_ORIGIN>/api/authenticator/auth/me`'ye sorulur |
| ARCH-0005 §8 · *"Tek paylaşılan MCP bearer'ı"* | `PTN_MCP_BEARER_TOKEN` yoktur; gateway her istekte çağıranın kendi bearer'ını kullanır |

Wiki'nin *hâlâ geçerli* açık maddeleri: ajan oturumu kalıcı değildir (sayfa yenilenince sohbet
kaybolur) ve oturum listesi yoktur.

---

## 8. Sürüm ve kaynak otoritesi

Bir DTO'nun doğruluğu tartışılırsa bakılacak yer sırayla:

1. **Paketlenen kaynak** — `ptn-assurance-platform/checkers/*` ve `ptn-test-module/src`
2. **Yayımlanan paket sürümü** — host `common.props` pinleri
3. Üretilmiş `schema.d.ts` (bayat olabilir — §6.2)

| Paket ailesi | Sürüm |
|---|---|
| `CheckNexus.ApiContracts` | `0.2.0-alpha.9` |
| `CheckNexus.DatabaseComparison` | `0.2.0-alpha.9` |
| `CheckNexus.Vault` | `0.2.0-alpha.2` |
| `Authenticator.*` | `2.1.0` |
| `Piton.Emailing.*` | `1.5.0` |

> [!CAUTION] `ptn-api-contract-checker` standalone deposu otorite **değildir**
> O depo `0.1.0`'dır ve auth henüz sökülmemiş eski backend'i taşır. Host onu tüketmez.
> Sözleşme doğrulaması paketlenen kaynağa karşı yapılır.

**Uç kapsaması** (statik ölçüm):

| Kaynak | Uç | İstemcide bağlı |
|---|---|---|
| Test Module host | 65 | 64 — bağlanmayan tek uç `POST /runs/webhook`, anonim ve paylaşılan sırla korunduğu için bilinçli |
| `CheckNexus.ApiContracts` | 24 | 24 |
| `CheckNexus.DatabaseComparison` | 26 | 26 |

---

## 9. Bilinen sınırlar

| # | Sınır | Etki |
|---|---|---|
| 1 | Ajan oturumu bellekte tutulur | Sayfa yenileme sohbeti siler; yazarlık taslağı Test Module TTL'i (30 dk) içinde kalıcılaştırılmalıdır |
| 2 | Aday tablo referansları etiketsiz gelir | Arayüz her aday için ek bir zemin sorgusu yaparak adı çözer |
| 3 | Üretilmiş şema bayat | §6.2 |
| 4 | Ajan CORS'u tek origin | Arayüz farklı portta koşarsa ajan çağrıları düşer |
| 5 | Uçtan uca canlı koşum kanıtı yok | Sözleşme ve tip doğrulaması statiktir; ilk kurulumda tam zincir bir kez elle koşulmalıdır |

---

## 10. Sorun giderme

| Belirti | Sebep | Çözüm |
|---|---|---|
| `NETWORK_ERROR`, "Sunucuya ulaşılamıyor" | İlgili host kapalı ya da sertifikası kabul edilmemiş | Portu kontrol edin; HTTPS host'unu tarayıcıda bir kez açın |
| Giriş ekranından ileri gidilemiyor | `<AUTH_ORIGIN>` kapalı | Authenticator host'unu başlatın |
| "Yazarlık oturumunu başlat" hiç açılmıyor | Ajan kapalı — malzeme yükleme yarıda kalıyor | `ptn-test-agent`'ı başlatın |
| Ajan çağrıları sessizce düşüyor | `UI_ORIGIN` eşleşmiyor | Ajanın `UI_ORIGIN` değerini arayüzün gerçek adresine eşitleyin |
| Kalıcılaştırmada `InvalidHash` | Mühür malzemesi bayat | Malzemeleri yeniden mühürleyip oturumu tazeleyin |
| Rozette ham kod görünüyor | Lookup okunamadı | Test Module'ün lookup uçlarına erişimi ve izni kontrol edin |
