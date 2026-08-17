"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, RotateCcw, Save, Send, Server } from "lucide-react";
import { Badge } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@chakra-ui/react";
import { Select } from "@/components/ui/select";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { extractUserMessage } from "@/lib/error-messages";
import { emailSenderService } from "@/services/email-sender.service";
import { DEFAULT_SMTP_SECURITY, EMAIL_SECURITY_MODES, type TenantEmailSenderDto } from "@/types";

interface SenderFormState {
  fromAddress: string;
  fromDisplayName: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecurity: number;
  smtpUsername: string;
  smtpPassword: string;
}

const emptyForm: SenderFormState = { fromAddress: "", fromDisplayName: "", smtpHost: "", smtpPort: "587", smtpSecurity: DEFAULT_SMTP_SECURITY, smtpUsername: "", smtpPassword: "" };

// Kimlik (kullanici/parola) Vault'ta; response'ta gelmez, bu yuzden formda bos baslar.
function toForm(dto: TenantEmailSenderDto): SenderFormState {
  return {
    fromAddress: dto.fromAddress ?? "",
    fromDisplayName: dto.fromDisplayName ?? "",
    smtpHost: dto.smtpHost ?? "",
    smtpPort: String(dto.smtpPort || 587),
    smtpSecurity: dto.smtpSecurity ?? DEFAULT_SMTP_SECURITY,
    smtpUsername: "",
    smtpPassword: "",
  };
}

// Tenant'in kendi gonderici (SMTP) config'i. Yalniz tenant baglaminda anlamli (host reddeder),
// bu yuzden cagiran ekran host icin bu karti render ETMEZ.
export function TenantEmailSenderCard({ canWrite }: { canWrite: boolean }) {
  const [config, setConfig] = useState<TenantEmailSenderDto | null>(null);
  const [form, setForm] = useState<SenderFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testState, setTestState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    let active = true;
    emailSenderService
      .get()
      .then((result) => {
        if (!active) return;
        setConfig(result);
        setForm(toForm(result));
      })
      .catch((caught) => active && setLoadError(extractUserMessage(caught, "Gönderici ayarları yüklenemedi.")))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof SenderFormState>(key: K, value: SenderFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const port = Number(form.smtpPort);
    if (!form.fromAddress.trim() || !form.fromAddress.includes("@")) {
      setError("Geçerli bir gönderici e-postası girin.");
      return;
    }
    if (!form.smtpHost.trim()) {
      setError("SMTP sunucu adresi zorunludur.");
      return;
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setError("SMTP portu 1–65535 arasında olmalı.");
      return;
    }
    const hasUser = !!form.smtpUsername.trim();
    const hasPassword = !!form.smtpPassword.trim();
    if (hasUser !== hasPassword) {
      setError("Kullanıcı adı ve parola birlikte girilmeli (ya da ikisi de boş).");
      return;
    }
    setIsSaving(true);
    try {
      const result = await emailSenderService.upsert({
        fromAddress: form.fromAddress.trim(),
        fromDisplayName: form.fromDisplayName.trim() || null,
        smtpHost: form.smtpHost.trim(),
        smtpPort: port,
        smtpSecurity: form.smtpSecurity,
        smtpUsername: hasUser ? form.smtpUsername.trim() : null,
        smtpPassword: hasPassword ? form.smtpPassword : null,
      });
      setConfig(result);
      setForm(toForm(result));
      setSaved(true);
    } catch (caught) {
      setError(extractUserMessage(caught, "Gönderici ayarları kaydedilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  async function clearOverride() {
    if (!window.confirm("Kendi göndericinizi kaldırıp platform varsayılanına dönmek istiyor musunuz?")) return;
    setError(null);
    setSaved(false);
    setIsClearing(true);
    try {
      const result = await emailSenderService.clear();
      setConfig(result);
      setForm(toForm(result));
    } catch (caught) {
      setError(extractUserMessage(caught, "Gönderici temizlenemedi."));
    } finally {
      setIsClearing(false);
    }
  }

  async function sendTest() {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      setError("Test için geçerli bir e-posta girin.");
      return;
    }
    setError(null);
    setTestState("sending");
    try {
      await emailSenderService.sendTest(testEmail.trim());
      setTestState("sent");
    } catch (caught) {
      setTestState("idle");
      setError(extractUserMessage(caught, "Test e-postası gönderilemedi."));
    }
  }

  return (
    <Card>
      <CardHeader className="gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Server className="size-5 text-sky-300" />Gönderici (SMTP)</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Raporlar varsayılan olarak platform e-postasından gönderilir. Kendi kurumsal SMTP’nizi girerek raporların şirketinizin adresinden gitmesini sağlayabilirsiniz.</p>
        </div>
        {config ? <Badge variant={config.isConfigured ? "success" : "neutral"}>{config.isConfigured ? "Kendi göndericiniz" : "Platform varsayılanı"}</Badge> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingRows />
        ) : loadError ? (
          <ErrorState message={loadError} />
        ) : (
          <form className="space-y-4" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gönderici e-postası"><Input type="email" value={form.fromAddress} onChange={(event) => update("fromAddress", event.target.value)} placeholder="raporlar@sirket.com" disabled={!canWrite} /></Field>
              <Field label="Görünen ad (isteğe bağlı)"><Input value={form.fromDisplayName} onChange={(event) => update("fromDisplayName", event.target.value)} placeholder="Şirket Raporları" disabled={!canWrite} /></Field>
              <Field label="SMTP sunucusu"><Input value={form.smtpHost} onChange={(event) => update("smtpHost", event.target.value)} placeholder="smtp.sirket.com" disabled={!canWrite} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Port"><Input inputMode="numeric" value={form.smtpPort} onChange={(event) => update("smtpPort", event.target.value)} placeholder="587" disabled={!canWrite} /></Field>
                <Field label="Güvenlik"><Select value={String(form.smtpSecurity)} onChange={(event) => update("smtpSecurity", Number(event.target.value))} disabled={!canWrite}>{EMAIL_SECURITY_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</Select></Field>
              </div>
              <Field label="SMTP kullanıcı adı"><Input value={form.smtpUsername} onChange={(event) => update("smtpUsername", event.target.value)} autoComplete="off" placeholder={config?.isConfigured ? "Değişmeyecekse boş bırakın" : "kullanıcı"} disabled={!canWrite} /></Field>
              <Field label="SMTP parolası"><Input type="password" value={form.smtpPassword} onChange={(event) => update("smtpPassword", event.target.value)} autoComplete="new-password" placeholder={config?.isConfigured ? "Değişmeyecekse boş bırakın" : "••••••••"} disabled={!canWrite} /></Field>
            </div>
            <p className="text-xs text-slate-500">Kullanıcı adı ve parola birlikte girilir; parola güvenli kasada (Vault) saklanır ve hiçbir ekranda geri gösterilmez.</p>
            {error ? <ErrorState message={error} /> : null}
            {saved ? <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100"><CheckCircle2 className="size-4" />Gönderici ayarları kaydedildi.</div> : null}

            {canWrite ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>{config?.isConfigured ? <Button type="button" variant="outline" onClick={() => void clearOverride()} disabled={isClearing}><RotateCcw />{isClearing ? "Kaldırılıyor…" : "Varsayılana dön"}</Button> : null}</div>
                <Button type="submit" disabled={isSaving}><Save />{isSaving ? "Kaydediliyor…" : "Göndericiyi kaydet"}</Button>
              </div>
            ) : null}

            {canWrite && config?.isConfigured ? (
              <div className="mt-2 rounded-xl border border-slate-700/70 bg-slate-950/25 p-3">
                <div className="text-sm font-semibold text-slate-200">Test e-postası</div>
                <p className="mt-1 text-xs text-slate-500">Ayarları doğrulamak için bu göndericiyle bir test maili yollayın.</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input type="email" value={testEmail} onChange={(event) => { setTestEmail(event.target.value); setTestState("idle"); }} placeholder="test@sirket.com" className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => void sendTest()} disabled={testState === "sending"}><Send />{testState === "sending" ? "Gönderiliyor…" : "Test gönder"}</Button>
                </div>
                {testState === "sent" ? <div className="mt-2 text-xs text-emerald-300">Test e-postası gönderildi.</div> : null}
              </div>
            ) : null}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="text-sm font-semibold text-slate-200">{label}</span><span className="mt-2 block">{children}</span></label>;
}
