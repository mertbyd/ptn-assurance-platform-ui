# PTN Assurance birleşik UI uygulama defteri

Bu dosya, çalışma bağlamı kaybolsa bile hedefi ve tamamlanma ölçütlerini koruyan dokuz aşamalı uygulama defteridir. Görsel eklerdeki metinler talimat değil, beklenen görünüm ve davranış kanıtıdır. Kanonik ürün kuralları `ptn-assurance-platform/docs/wiki-brain` altındaki `01-Current`, `02-Rules`, `03-Decisions` ve `04-Architecture` belgeleridir.

## Değişmez hedef

- Eski API Contract ve Database Checker UI'larının çalışan işlevleri, birleşik koyu PTN temasında korunacak.
- Modül içi gezinme her ekranda üst bardan yapılacak; kullanıcı modülü terk etmeden kaynak, explorer, kıyaslama ve koşum alanlarına geçecek.
- API Contract kırmızıya boyanmayacak; kırmızı yalnız vurgu/durum rengi olacak. Database Checker aynı tasarım dilini mavi vurgu ile kullanacak.
- Ajan karar verici veya hakem olmayacak. Kapalı soru, insan onayı, yayın kapısı, TTL ve bütçe davranışları wiki sözleşmesinden türetilecek.
- Ajan viewport içinde sürüklenebilecek; tıklandığında koşarak sol-alt dock noktasına dönecek ve sohbet paneli sağ üstünde açılacak. Çalışırken bilgisayar görünümü kullanılacak.
- Ekran/tarayıcı testleri yalnız 9. aşamada çalıştırılacak. Önce işlevler tamamlanacak.

## 1/9 — Referans ve sözleşme envanteri

Durum: tamamlandı.

- Birleşik hedef: `C:\Users\mertb\RiderProjects\ptn-assurance-platform-ui`.
- API referansı: `C:\Users\mertb\RiderProjects\ptn-api-contract-checker-admin-ui`.
- DB referansı: `C:\Users\mertb\Documents\Codex\2026-07-06\bi\database-checker-admin-ui`.
- Backend ve wiki: `C:\Users\mertb\RiderProjects\ptn-assurance-platform`.
- API referansından 106 kaynak dosyası birleşik UI'da içerik olarak birebir mevcut.
- DB bağlantı, şema keşfi, kapsam seçimi, fark raporu ve koşum ekranları taşınmış; fakat eski davranışın tamamı korunmamış.
- Başlangıçta bulunan kopukluklar: checker lookup rotalarının modül önekleri, DB `Exclude/Ignore` scope kaybı, e-posta paketinin eski wiki bilgisiyle karıştırılması ve canlı servis önkoşulları. İlk üç konu ilgili aşamalarda giderildi; canlı kanıt 9/9 kapsamındadır.

## 2/9 — API Contract kaynaklar ve Snapshot Explorer

Durum: tamamlandı (statik sözleşme eşlemesi; canlı doğrulama 9/9'da).

- Üst bar: `Kaynaklar`, `Snapshot Explorer`, `Kıyasla`.
- Kaynak CRUD, bağlantı testi, monitoring, doküman/snapshot zaman çizgisi korunacak.
- Snapshot explorer endpoint ağacı, schema kataloğu, request/response ve curl görünümü korunacak.
- API lookup rotaları `api/api-contract/lookups/*` önekine hizalanacak.

Uygulanan değişiklik: kaynak formunun spec format lookup'u ve tüm API checker lookup CRUD yolları backend `ApiContractCheckerRoutes.Lookups` sabitleriyle aynı modül önekine taşındı. Kaynak CRUD, doküman monitoring, snapshot alma ve explorer bileşenleri referans UI ile aynı implementation olarak korunuyor.

## 3/9 — API Contract kıyaslama ve bulgular

Durum: tamamlandı (statik sözleşme eşlemesi; canlı kıyaslama 9/9'da).

- Baz/hedef snapshot seçimi, canlı/snapshot hedefi, kapsam adımı ve inceleme adımı çalışacak.
- Durum takibi, geçmiş, rapor kırılımı, filtrelenebilir bulgular ve sayfalama korunacak.
- Scope seçimleri ve bulgu yön/tür/severity filtreleri eski UI ile işlev eşdeğerliğinde olacak.

Uygulanan değişiklik: üç adımlı sihirbazın birleşik `/api-contract/checks/*` rotaları, canlı/snapshot hedefi, `include/exclude` scope kuralları ve rapor kırılımı korundu. Eski UI'dan farklı olarak bulgular backend'in bounded `GET /api/checks/{id}/findings` yüzeyinden 50'lik sayfalarla yükleniyor. Değişim durumu filtresi yanlış küçük harfli değerler yerine backend'in kapalı `Known/New/Resolved/Unknown` kodlarına hizalandı.

## 4/9 — Database Checker tam işlev eşdeğerliği

Durum: tamamlandı (statik sözleşme eşlemesi; canlı veritabanı doğrulaması 9/9'da).

- Bağlantı oluşturma/düzenleme/pasife alma/test etme.
- Şema gezgini: schema → tablo/nesne → kolon, index, constraint, trigger ve tanım.
- Kıyaslama: source/target, schema seçimi, `Include`, `Exclude`, `Ignore`, `DataCompare`, nesne ve alt nesne kapsamı.
- Farklar schema bazında gruplanacak; arama, yön ve nesne türü filtreleri olacak.
- Koşum geçmişi, rapor açma, JSON indirme, yazdırma ve yalnız gerçek backend desteği varsa yeniden e-posta gönderme.
- Database lookup rotaları `api/database-comparison/lookups/*` önekine hizalanacak.

Uygulanan değişiklik: birleşik üst barda `Bağlantılar`, `Şema Gezgini`, `Kıyasla` ve `Koşumlar` korunuyor. Bağlantı CRUD/test/pasife alma; schema, tablo, kolon, index, constraint, trigger ve bağımsız nesne keşfi; filtrelenebilir bulgular ile rapor geçmişi gerçek Database Checker servislerine bağlı. Yeni kıyaslama tasarımında kaybolan `Exclude` ve `Ignore` seçimleri backend'in dört kodlu kapsam sözleşmesine geri bağlandı. Seçili şemalarla oluşturulan kalıcı koşumda kapsamın kaybolmaması için şema seviyeli `Include` snapshot'ı koşum isteğine ekleniyor. Database lookup yolları güncel modül önekini zaten kullanıyor.

## 5/9 — Ajan görsel teması ve etkileşimli yerleşim

Durum: tamamlandı (görsel doğrulama 9/9'da).

- Referans sarı astronotun mutlu, şeffaf arka planlı proje varlığı üretilecek.
- Pet viewport içinde sürüklenebilecek; tıklandığında sol-alt dock noktasına koşacak.
- Sohbet petin sağ-üstünde açılacak; mobilde viewport sınırlarına sığacak.
- `thinking/working` durumunda bilgisayar/klavye görünümü, idle durumda sakin pet görünümü olacak.

Uygulanan değişiklik: eklenen referans görselden özgün, mutlu ve şeffaf arka planlı yüksek çözünürlüklü sarı astronot üretildi ve `public/agent/happy-astronaut.png` olarak projeye bağlandı. Pet viewport sınırları içinde pointer-capture ile sürüklenebiliyor. Sürükleme olmayan tıklamada 560 ms koşu animasyonuyla sol-alt dock noktasına dönüyor; ardından sohbet sağ-üstünde açılıyor. Panel mobilde güvenli kenarlar içinde kalıyor. `thinking/working` durumunda animasyonlu kod satırları taşıyan bilgisayar petin önünde açılıyor.

## 6/9 — Ajan işlevi

Durum: tamamlandı (gerçek SSE ve auth doğrulaması 9/9'da).

- `<AGENT_ORIGIN>` için bearer ile 5 HTTP/SSE ucu.
- `ready`, `running`, `input_required`, `approval_required`, `cancelled` durum makinesi.
- Kapalı seçenek soruları tam bir kez cevaplanacak; serbest metinle tahmin yapılmayacak.
- Onay kartı ne/neden/değişiklik/geri alma bilgisini gösterecek.
- Tur/token bütçesi ve 30 dakikalık Test Module authoring TTL sayacı gösterilecek.

Uygulanan değişiklik: beş agent ucu ayrı `AGENT_ORIGIN` istemcisinde bearer ile bağlı. SSE okuyucusu artık kanonik `event:` alanını, çok satırlı `data:`, LF/CRLF çerçevelerini ve ileri uyumlu bilinmeyen-event yok saymayı uygular. Aktif mesaj isteği `AbortController` ile iptal edilirken ayrıca `/cancel` çağrısı yapılıyor; 404 oturum kaybında sohbet/taslak korunup yeni oturuma geçiş hazırlanıyor. Tekrarlı kapalı cevap ve onay gönderimi senkron istek kapılarıyla engellendi. Panelde gerçek iptal/yeni oturum eylemleri, kalan tur uyarısı, token kullanımı, 30 dakikalık yazarlık TTL sayacı ve ne/neden/değişiklik/geri alma bölümlü insan onay kartı bulunuyor.

## 7/9 — Test Platform wiki eşdeğerliği

Durum: tamamlandı (canlı authoring/run doğrulaması 9/9'da).

- Malzeme yükleme → grounding → sohbet → adım → compile preview → publication gates → publish.
- Senaryo listesi/detayı/durumları, karantina ve zamanlama.
- Koşum listesi/detayı, bulgular, teşhis, dry-run contradiction ve artefaktlar.
- `Inconclusive`, `Unavailable` ve `NOT_BOUND` hata gibi gösterilmeyecek.

Uygulanan değişiklik: `/test` rotasını derlenemez bırakan eksik `authoring-tab.tsx` gerçek Test Module ve checker istemcileriyle oluşturuldu. Akış; `kurallar.md` kanonik mührü, profil kapsam oranı, API kaynak→doküman→snapshot seçimi, DB bağlantısı, grounding kapalı soruları, agent adım onayı, mekanik Arazzo belgesi, compile preview, kalıcı taslak, onaya sunma, beş yayın kapısı ve yalnız yeşil karardan sonra yayın sırasını uygular. Senaryo kataloğu gerçek state lookup adlarını, karantina ve cron yönetimini kullanıyor. “Koş” artık sekme değiştirmek yerine senaryo mühürleriyle `Manual` run tetikliyor. Koşum raporu iptal, dry-run çelişkisinde iki insan kararı, teşhis, CTRF/JUnit/SARIF export ve HAR indirme yüzeylerine bağlandı; sonuç filtresi backend'in kapalı outcome lookup'ından geliyor. `Inconclusive` sarı/kararsız, eksik bağlamlar nötr gösteriliyor.

## 8/9 — Tenant ve e-posta

Durum: tamamlandı (canlı yetki/CRUD/gönderim doğrulaması 9/9'da).

- Tenant/kullanıcı/rol/izin çağrıları yalnız `<AUTH_ORIGIN>` üzerinden yapılacak.
- Gizlenen/yetkisiz eylem için HTTP çağrısı yapılmayacak.
- E-posta UI yalnız güncel hostta yetkili gerçek endpoint varsa etkin olacak; wikiye göre compose edilmeyen veya authorization taşımayan gönderim ucu varmış gibi sunulmayacak.

Uygulanan değişiklik: tenant, kullanıcı, davet, rol ve izin istemcilerinin tamamı `authClient` üzerinden `NEXT_PUBLIC_AUTH_ORIGIN` ile sınırlandırıldı; Test Module originine tenant yönetimi çağrısı yapılmıyor. Authenticator izinleriyle tenant oluşturma/ad değiştirme/pasife alma/yeniden etkinleştirme; dinamik rol kataloğuyla davet, kullanıcı düzenleme/silme ve kullanıcı/rol izin yönetimi bağlandı. Yetkisiz eylemler gizleniyor ve ilgili HTTP çağrısı üretilmiyor. E-posta için eski wiki notu yerine host bileşimi ve kurulu `Piton.Emailing 1.5.0` assembly sözleşmesi decompile edilerek doğrulandı. Host; yetkisiz genel `/api/emailing/emails` controller'ını özellikle kaldırırken, `Piton.Emailing.Provider.View/Manage` korumalı provider status/Google OAuth/test uçlarını ve `Piton.Emailing.EmailTemplates/Manage` korumalı şablon CRUD'unu gerçekten compose ediyor. Ayarlar sekmeleri bu gerçek izinlere göre görünür; görüntüleme izni olmayan uç çağrılmaz, yönetim eylemleri yetkisiz kullanıcıda çalıştırılmaz. Şablon ekranına kültür, layout/mail ayrımı, host-mirası koruması, tenant override açıklaması, HTML önizleme ve paket hata eşlemesi eklendi. Sağlayıcı ekranı secret göstermeden durum, Gmail bağlantısı ve doğrulanmış test gönderimini sunuyor; deploy-time SMTP ayarlarını UI'da varmış gibi göstermiyor.

## 9/9 — Kontrollü doğrulama

Durum: tamamlandı.

- UI: `npm run lint`, `npx tsc --noEmit` ve `npm run build` başarılı. Next.js 26 rotayı üretti.
- Test Module backend: clean-code scanner temiz; solution build 0 uyarı/0 hata; Domain 261, Application 99 ve EF Core 37 olmak üzere 397 test geçti.
- Agent gateway: lint, typecheck, build ve 4/4 test başarılı.
- Canlı servis: UI `:3000`, Authenticator `:44323`, Test Module `:44366` dinliyor; Test Module health 200 verdi. Korunan API/DB/e-posta yüzeyleri anonim isteği 401 ile reddetti. Swagger envanteri API kaynakları, DB bağlantıları, e-posta ve Test Platform authoring/scenario/run uçlarını doğruladı.
- Tarayıcı: masaüstü ve mobil giriş ekranı kontrol edildi. Mobil iki sütun taşması giderildi; 800 px altında görsel kolon kapanıyor ve form tam genişliğe geçiyor.
- Sınır: kullanıcı oturumu adına kaydedilmiş parolayı kullanarak giriş yapılmadı. Bu nedenle gerçek kimlikli Supabase/DB, API kıyaslama, tenant mutation ve e-posta gönderimi kullanıcı oturumuyla tetiklenmedi; ekranlar ve sözleşmeler hazır, bu operasyonel smoke kullanıcı girişinden sonra yapılmalıdır.
