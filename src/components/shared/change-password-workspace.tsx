"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, Lock } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@chakra-ui/react";
import { Label } from "@chakra-ui/react";
import { ErrorState } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { extractUserMessage } from "@/lib/error-messages";
import { accountService } from "@/services/account.service";

export function ChangePasswordWorkspace() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDone(false);
    if (newPassword !== confirm) {
      setError("Yeni parolalar eşleşmiyor.");
      return;
    }
    setIsSaving(true);
    try {
      await accountService.changePassword({ currentPassword, newPassword });
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (caught) {
      setError(extractUserMessage(caught, "Şifre değiştirilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="Hesap güvenliği" title="Şifre Değiştir" description="Hesabınızın parolasını güncelleyin. Değişiklik hemen etkinleşir." />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-sky-300" />Parola güncelleme</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <PasswordField id="currentPassword" label="Mevcut şifre" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <PasswordField id="newPassword" label="Yeni şifre" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <PasswordField id="confirm" label="Yeni şifre (tekrar)" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            {error ? <ErrorState message={error} /> : null}
            {done ? <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100"><CheckCircle2 className="size-4" />Şifreniz güncellendi.</div> : null}
            <div className="flex justify-end"><Button type="submit" disabled={isSaving}>{isSaving ? "Kaydediliyor…" : "Şifreyi değiştir"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-500" />
        <Input id={id} type="password" value={value} onChange={(event) => onChange(event.target.value)} className="pl-10" autoComplete={autoComplete} required />
      </div>
    </div>
  );
}
