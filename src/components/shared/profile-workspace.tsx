"use client";

import { FormEvent, useEffect, useState } from "react";
import { AtSign, CheckCircle2, MailWarning, User } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@chakra-ui/react";
import { Label } from "@chakra-ui/react";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { extractUserMessage } from "@/lib/error-messages";
import { accountService } from "@/services/account.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ProfileDto } from "@/types";

interface ProfileFormState {
  email: string;
  name: string;
  surname: string;
  phoneNumber: string;
}

export function ProfileWorkspace() {
  // tenantId, e-posta degisiminden sonra yeniden dogrulama mailini dogru tenant'a gondermek icin.
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [form, setForm] = useState<ProfileFormState>({ email: "", name: "", surname: "", phoneNumber: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Bos degilse: e-posta bu adrese degistirildi ve yeniden dogrulama gerekiyor.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    let active = true;
    accountService
      .getMyProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setForm({ email: result.email ?? "", name: result.name ?? "", surname: result.surname ?? "", phoneNumber: result.phoneNumber ?? "" });
      })
      .catch((caught) => active && setLoadError(extractUserMessage(caught, "Profil bilgileri yüklenemedi.")))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function updateField<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setError(null);
    setSaved(false);
    setPendingEmail(null);
    setResendState("idle");

    const newEmail = form.email.trim();
    if (!newEmail) {
      setError("E-posta adresi zorunludur.");
      return;
    }
    const emailChanged = newEmail.toLowerCase() !== (profile.email ?? "").toLowerCase();

    setIsSaving(true);
    try {
      const updated = await accountService.updateMyProfile({
        userName: profile.userName,
        email: newEmail,
        name: form.name.trim() || null,
        surname: form.surname.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
        concurrencyStamp: profile.concurrencyStamp,
      });
      setProfile(updated);
      setForm({ email: updated.email ?? "", name: updated.name ?? "", surname: updated.surname ?? "", phoneNumber: updated.phoneNumber ?? "" });

      if (emailChanged) {
        // E-posta degisince ABP EmailConfirmed'i sifirlar; yeni adrese dogrulama linki gonderiyoruz.
        setPendingEmail(newEmail);
        await sendConfirmation(newEmail);
      } else {
        setSaved(true);
      }
    } catch (caught) {
      setError(extractUserMessage(caught, "Profil güncellenemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  async function sendConfirmation(email: string) {
    setResendState("sending");
    try {
      await authService.resendEmailConfirmation({ email }, tenantId);
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="Hesap" title="Profil" description="Ad, soyad, telefon ve e-posta adresinizi güncelleyin." />
      {isLoading ? (
        <LoadingRows />
      ) : loadError ? (
        <ErrorState message={loadError} />
      ) : (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="size-5 text-sky-300" />Hesap bilgileri</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="userName">Kullanıcı adı</Label>
                <Input id="userName" value={profile?.userName ?? ""} disabled readOnly />
                <p className="text-xs text-slate-500">Kullanıcı adı bu ekrandan değiştirilemez.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="name">Ad</Label><Input id="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="surname">Soyad</Label><Input id="surname" value={form.surname} onChange={(event) => updateField("surname", event.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="phoneNumber">Telefon</Label><Input id="phoneNumber" value={form.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} /></div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
                  <Input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="pl-10" autoComplete="email" required />
                </div>
                <p className="text-xs text-slate-500">E-postanızı değiştirirseniz yeni adresinize bir doğrulama bağlantısı gönderilir; bir sonraki girişten önce onaylamanız gerekir.</p>
              </div>

              {error ? <ErrorState message={error} /> : null}
              {saved ? <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100"><CheckCircle2 className="size-4" />Profiliniz güncellendi.</div> : null}

              {pendingEmail ? (
                <div className="space-y-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                  <div className="flex items-start gap-2"><MailWarning className="mt-0.5 size-4 shrink-0" /><span><strong>{pendingEmail}</strong> adresini doğrulamanız gerekiyor. {resendState === "sent" ? "Doğrulama bağlantısı bu adrese gönderildi." : resendState === "error" ? "Doğrulama e-postası gönderilemedi." : "Doğrulama e-postası gönderiliyor…"} Onaylayana kadar bu adresle tekrar giriş yapamazsınız.</span></div>
                  <div className="flex justify-end"><Button type="button" variant="outline" size="sm" disabled={resendState === "sending"} onClick={() => void sendConfirmation(pendingEmail)}>{resendState === "sending" ? "Gönderiliyor…" : "Doğrulama e-postasını tekrar gönder"}</Button></div>
                </div>
              ) : null}

              <div className="flex justify-end"><Button type="submit" disabled={isSaving}>{isSaving ? "Kaydediliyor…" : "Kaydet"}</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
