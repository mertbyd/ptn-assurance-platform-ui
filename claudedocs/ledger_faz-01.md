# Faz 1 dosya defteri — yeşil temel (G-01 + G-02)

- **Tarih:** 2026-08-17
- **Depo:** `ptn-assurance-platform-ui` — **Git deposu değil**, bu yüzden commit yoktur; bu defter
  `claudedocs/workflow_ptn-ui-remediation.md` §6.1 gereği tutulur.
- **Kapılar:** `tsc --noEmit` → 0 · `eslint src` → 0 hata / 0 uyarı · `next build` → 0 uyarı
- **Değiştirilen dosya:** 23 · **eklenen:** 1 (bu defter) · **silinen:** 0

---

## G-01 — tip hatası

**Bu oturumda yapılmadı.** `runs-tab.tsx`'teki `outcomeCode` hatası ve `authoring-tab.tsx`'teki
`set-state-in-effect` hatası 15:43–15:45 arasında **oturum dışında** düzeltilmişti; 16:03'te
alınan taze `tsc --noEmit` ölçümü 0 hata verdi.

> Not: uygulanan çözüm plandaki karardan farklıdır. Plan filtrenin kaldırılmasını öngörüyordu
> (otorite: `TestRunListInput.cs` — `OutcomeCode` yok, dosya yorumu *"agir rapor kolonlarini
> tasimaz"*). Uygulanan çözüm filtreyi istemci tarafında tutuyor. Bunun üç yan etkisi ölçüldü ve
> **açık bırakıldı** — bkz. §Kalan riskler.

## G-02 — lint kapsamı

`eslint.config.mjs` ignore listesi 13 proje yolundan **0**'a indirildi; geriye yalnız
`eslint-config-next` varsayılanları kaldı (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`).

Açığa çıkan ve kapatılan: **47 hata + 40 uyarı, 22 dosya.**

| Kural | Adet | Nasıl kapatıldı |
|---|---:|---|
| `@typescript-eslint/no-explicit-any` | 39 | 30'u ölü blok silinerek, 9'u gerçek tiple |
| `@typescript-eslint/no-unused-vars` | 39 | kullanılmayan import specifier'ları çıkarıldı |
| `react-hooks/set-state-in-effect` | 4 | effect gövdesindeki senkron setState kaldırıldı |
| `react/no-unescaped-entities` | 4 | `"` → `&ldquo;` / `&rdquo;` |
| `@next/next/no-location-assign-relative-destination` | 1 | `router.push` |
| `react-hooks/purity` | 1 | ara çözümde oluştu, kaynağında giderildi |

---

## Değiştirilen dosyalar

### Yapılandırma
| Dosya | Değişiklik |
|---|---|
| `eslint.config.mjs` | 19 proje-yolu ignore deseni kaldırıldı |

### Ölü yüzey temizliği — G-05'in doğrulanmış kısmı öne alındı
| Dosya | Değişiklik |
|---|---|
| `src/api/checker.ts` | `conformance`, `lookups`, `recipients` blokları ve `ConformanceRunStatusDto` silindi (−64 satır). Kalan 3 `any` → `unknown`. Başlığa kaldırma gerekçesi yazıldı. |

**Neden Faz 1'de:** bu üç blok 32 `any` hatasının 30'unu üretiyordu ve üçünün de rotası
backend'de **yok** (`ApiContractCheckerRoutes.cs` ile doğrulandı: `conformance` kökü
`api/contract-checks/conformance`, `lookups` modül önekine taşındı, `recipients` tamamen
söküldü). Tüketici sayısı grep ile **0** ölçüldü — `checkerApi`'den yalnız `sources.list` ve
`sources.listSnapshots` kullanılıyor. Var olmayan uçlar için el ile DTO yazmak, plandaki
"ara yol yok" kuralının yasakladığı işti.

### Tip düzeltmeleri
| Dosya | Değişiklik |
|---|---|
| `src/components/ui/card.tsx` | 6 bileşenin `any` propları → `React.ComponentPropsWithoutRef<"div"\|"h3"\|"p">` |
| `src/api/notifications.api.ts` | `payload: any` → `unknown` |

### React 19 doğruluk düzeltmeleri
| Dosya | Değişiklik |
|---|---|
| `src/components/ui/agent-bot.tsx` | Üç effect de effect gövdesinde senkron `setState` çağırıyordu. Mesaj/göz/kol durumları artık **render sırasında türetiliyor**; effect'ler yalnız zamanlayıcı kurup sayaç ilerletiyor. Kol salınımı, güncelleyici içinde mutasyona uğrayan `dir` değişkeni yerine saf üçgen dalga fonksiyonu. Faz kayması orijinal başlangıç açısını (0°) birebir koruyor. `useRef` importu düştü. |
| `src/components/ui/floating-agent.tsx` | TTL geri sayımının ilk değerini yazan `setClock(Date.now())` effect gövdesinden çıkarıldı; `setTimeout(…, 0)` geri çağrısına taşındı. Render fazında `Date.now()` çağırmak `react-hooks/purity` ihlali olduğu için o yol **denendi ve geri alındı**. |

### Kalan lint düzeltmeleri
| Dosya | Değişiklik |
|---|---|
| `src/components/shared/schema-comparison-workspace.tsx` | `window.location.assign` → `useRouter().push` (tam sayfa reload yerine istemci gezinmesi); kullanılmayan `objs` propu tip ve çağrı yerinden çıkarıldı; 2 kaçırılmamış tırnak |
| `src/components/shared/schema-discovery-workspace.tsx` | 2 kaçırılmamış tırnak + kullanılmayan `Fingerprint` importu |
| `src/api/auth/DevAutoLoginProvider.tsx` | kullanılmayan `axios`, `useState` |
| `src/components/layout/navigation.ts` · `topbar.tsx` | kullanılmayan `Permissions`, `Settings2`, `UsersRound` |
| `src/components/shared/*-workspace.tsx` · `metric-card.tsx` · `tenant-email-sender-card.tsx` (12 dosya) | her dosyanın gerçekten kullanmadığı `Card*` specifier'ları |

---

## Doğrulama

```
npx tsc --noEmit -p tsconfig.json     → 0 hata
npx eslint src                        → 0 hata, 0 uyarı
npm run build                         → Compiled successfully in 18.6s, 0 uyarı, 26/26 sayfa
```

Üç komut da bu defterin yazıldığı çalışma ağacında koşturuldu.

---

## Kalan riskler

| # | Risk | Sınıf |
|---|---|---|
| R-1 | **Koşum listesi hüküm filtresi istemci tarafında.** `runs-tab.tsx` filtre aktifken `maxResultCount: 1000` çekip tarayıcıda süzüyor; `totalCount` 1000'in ötesinde sessizce yanlış oluyor ve `refetchInterval: 5000` bu 1000 satırı 5 saniyede bir yeniliyor. Doğru çözüm `TestRunListInput`'a `OutcomeCode` eklemek — **backend ticket'ı**. | Açık |
| R-2 | **Davranışsal test yok.** `agent-bot` ve `floating-agent` değişiklikleri derleme ve okuma ile doğrulandı; koşan test yok çünkü test koşucusu Faz 8'de kuruluyor (G-11). Animasyon davranışı tarayıcıda Faz 9'da doğrulanacak. | Kabul edilmiş |
| R-3 | `checker.ts` içinde `snapshots.findOperation`/`describeSchema`/`getAuthoringResult` yanıtları `unknown`. Rotalar canlı ama üretilmiş şemada yok; G-03'te gerçek DTO'ya bağlanacak. | Planlı |
| R-4 | Faz 2'de silinecek dosyalarda da lint düzeltildi (`components/shared/*`'ın bir kısmı erişilemez). Küçük ve bilinçli bir israf: plan ignore kararını sil/kal kararına bağlıyor, ama sil/kal Faz 2'nin işi. | Kabul edilmiş |

## Sıradaki

**Faz 2** — G-04 ölü kod tasnifi (119 dosya, üç kova), G-05'in kalanı, G-12 ölü istemci.
Bu fazın ön koşulu yok.
