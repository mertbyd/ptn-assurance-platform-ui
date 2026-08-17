// Tenant'in kendi gonderici (SMTP) mail config'i — backend KBP-55: /api/email/sender.
//
// Neden ayri: platform bir VARSAYILAN gonderici ile gelir; bir tenant kendi kurumsal
// SMTP'sini girerse raporlar o adresten/sunucudan gonderilir. Girilmezse (isConfigured=false)
// platform varsayilani kullanilir. Bu bir TENANT ozelligidir; host baglaminda uc reddeder.

// SMTP TLS modu (Piton.Emailing EmailSecurityMode). API enum'u SAYISAL serilesir.
// Calisan host'a karsi dogrulandi: gecerli/kullanilabilir degerler yalnizca 1=StartTls ve
// 2=SslOnConnect (gercek SMTP sunuculari bu ikisini kullanir: Gmail/O365 587/STARTTLS, 465/SSL).
// 3. deger saglayici tarafindan "gecersiz/eksik" (Piton.Emailing:00007) reddedildigi icin sunulmaz.
export const EMAIL_SECURITY_MODES = [
  { value: 1, label: "STARTTLS (önerilen · genelde 587)" },
  { value: 2, label: "SSL/TLS (genelde 465)" },
] as const;

export const DEFAULT_SMTP_SECURITY = 1; // StartTls — model varsayilani ve gercek dunya standardi

// GET /api/email/sender — parola/kullanici DONMEZ (Vault'ta).
export interface TenantEmailSenderDto {
  isConfigured: boolean;
  fromAddress?: string | null;
  fromDisplayName?: string | null;
  smtpHost?: string | null;
  smtpPort: number;
  smtpSecurity: number;
}

// PUT /api/email/sender — kullanici/parola cifti all-or-nothing (ikisi de verilir ya da bos birakilir;
// bos birakilinca mevcut Vault sirri korunur). Parola response'a hic donmez.
export interface UpsertTenantEmailSenderDto {
  fromAddress?: string | null;
  fromDisplayName?: string | null;
  smtpHost?: string | null;
  smtpPort: number;
  smtpSecurity: number;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
}
