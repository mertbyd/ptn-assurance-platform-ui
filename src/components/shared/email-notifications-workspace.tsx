"use client";

import { useCallback, useMemo, useState } from "react";
import { BellRing, Edit3, Mail, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { ReadOnlyNotice } from "@/components/shared/read-only-notice";
import { TenantEmailSenderCard } from "@/components/shared/tenant-email-sender-card";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useCanWrite } from "@/hooks/useAuth";
import { extractUserMessage } from "@/lib/error-messages";
import { searchable } from "@/lib/presentation";
import { emailNotificationsService } from "@/services/email-notifications.service";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ComparisonNotificationSettingsDto, ComparisonRecipientDto } from "@/types";

export function EmailNotificationsWorkspace() {
  const loader = useCallback(async () => {
    const [recipients, preferences] = await Promise.all([
      emailNotificationsService.getList({ maxResultCount: 1000, sorting: "Email" }),
      emailNotificationsService.getPreferences(),
    ]);
    return { recipients, preferences };
  }, []);
  const { data, isLoading, error, reload } = useAsyncResource(loader);
  const canWrite = useCanWrite();
  // Kendi gonderici (SMTP) ayari TENANT ozelligidir; host baglaminda backend reddeder, o yuzden yalniz tenant'ta gosteririz.
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComparisonRecipientDto | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [preferencesForm, setPreferencesForm] = useState<ComparisonNotificationSettingsDto | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const currentPreferences = preferencesForm ?? data?.preferences ?? null;
  const filteredRecipients = useMemo(() => {
    const normalized = searchable(query.trim());
    return (data?.recipients.items ?? []).filter((recipient) => !normalized || searchable(`${recipient.name ?? ""} ${recipient.email}`).includes(normalized));
  }, [data, query]);

  function openCreate() {
    setEditing(null);
    setName("");
    setEmail("");
    setIsActive(true);
    setRecipientError(null);
    setModalOpen(true);
  }

  function openEdit(recipient: ComparisonRecipientDto) {
    setEditing(recipient);
    setName(recipient.name ?? "");
    setEmail(recipient.email);
    setIsActive(recipient.isActive);
    setRecipientError(null);
    setModalOpen(true);
  }

  async function saveRecipient() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setRecipientError("Geçerli bir e-posta adresi girin.");
      return;
    }
    setIsSaving(true);
    setRecipientError(null);
    try {
      const dto = { name: name.trim() || null, email: normalizedEmail, isActive };
      if (editing) await emailNotificationsService.update(editing.id, dto);
      else await emailNotificationsService.create(dto);
      setModalOpen(false);
      await reload();
    } catch (caught) {
      setRecipientError(extractUserMessage(caught, "Alıcı kaydedilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeRecipient(recipient: ComparisonRecipientDto) {
    if (!window.confirm(`“${recipient.email}” alıcısını silmek istiyor musunuz?`)) return;
    setRecipientError(null);
    try {
      await emailNotificationsService.remove(recipient.id);
      await reload();
    } catch (caught) {
      setRecipientError(extractUserMessage(caught, "Alıcı silinemedi."));
    }
  }

  async function savePreferences() {
    if (!currentPreferences) return;
    setIsSavingPreferences(true);
    setPreferencesError(null);
    try {
      setPreferencesForm(await emailNotificationsService.updatePreferences(currentPreferences.sendWhenNoDifferences));
    } catch (caught) {
      setPreferencesError(extractUserMessage(caught, "Bildirim tercihi kaydedilemedi."));
    } finally {
      setIsSavingPreferences(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Tenant bildirim merkezi" title="E-posta Bildirimleri" description="Karşılaştırma tamamlandığında rapor alacak tenant alıcılarını ve farksız sonuç davranışını yönetin." actions={<><Button variant="outline" onClick={() => void reload()}><RefreshCw />Yenile</Button>{canWrite ? <Button onClick={openCreate}><Plus />Yeni alıcı</Button> : null}</>} />
      <ReadOnlyNotice message="Bildirim alıcılarını ve tercihini görüntüleyebilirsiniz. Değişiklik için yönetim yetkisi gerekir." />
      {error ? <ErrorState message={error} /> : null}
      {isLoading || !data || !currentPreferences ? <LoadingRows /> : (
        <div className="space-y-5">
          {tenantId ? <TenantEmailSenderCard canWrite={canWrite} /> : null}

          <Card>
            <CardHeader><CardTitle>Bildirim davranışı</CardTitle><p className="text-sm text-slate-500">Bu tenant, karşılaştırma farksız sonuçlansa da rapor gönderilip gönderilmeyeceğini seçer.</p></CardHeader>
            <CardContent>
              {preferencesError ? <ErrorState message={preferencesError} /> : null}
              <label className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/25 p-4 text-sm text-slate-300"><Checkbox checked={currentPreferences.sendWhenNoDifferences} disabled={!canWrite} onChange={(event) => setPreferencesForm({ sendWhenNoDifferences: event.target.checked })} />Fark yoksa da rapor gönder</label>
              {canWrite ? <div className="mt-4 flex justify-end"><Button onClick={() => void savePreferences()} disabled={isSavingPreferences}><Save />{isSavingPreferences ? "Kaydediliyor…" : "Tercihi kaydet"}</Button></div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between"><div><CardTitle>Bildirim alıcıları</CardTitle><p className="mt-1 text-sm text-slate-500">Aktif alıcılar tamamlanan karşılaştırma raporlarını e-posta ile alır.</p></div><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad veya e-posta ara" /></CardHeader>
            <CardContent>
              {recipientError ? <ErrorState message={recipientError} /> : null}
              {filteredRecipients.length ? <div className="space-y-2">{filteredRecipients.map((recipient) => <RecipientRow key={recipient.id} recipient={recipient} canWrite={canWrite} onEdit={() => openEdit(recipient)} onRemove={() => void removeRecipient(recipient)} />)}</div> : <EmptyState icon={Mail} title="Alıcı bulunamadı" description="Raporların gönderileceği ilk tenant alıcısını ekleyin." action={canWrite ? <Button onClick={openCreate}><Plus />Yeni alıcı</Button> : undefined} />}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Alıcıyı düzenle" : "Yeni bildirim alıcısı"} description="Aynı tenant içinde bir e-posta adresi yalnızca bir kez eklenebilir." size="md" footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Vazgeç</Button><Button onClick={() => void saveRecipient()} disabled={isSaving}>{isSaving ? "Kaydediliyor…" : "Kaydet"}</Button></>}>
        <div className="space-y-4">
          {recipientError ? <ErrorState message={recipientError} /> : null}
          <label className="block"><span className="text-sm font-semibold text-slate-200">Alıcı adı (isteğe bağlı)</span><Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn. Veri Platformu Ekibi" /></label>
          <label className="block"><span className="text-sm font-semibold text-slate-200">E-posta</span><Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="raporlar@sirket.com" /></label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/25 p-4 text-sm text-slate-300"><Checkbox checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />Alıcı aktif</label>
        </div>
      </Modal>
    </div>
  );
}

function RecipientRow({ recipient, canWrite, onEdit, onRemove }: { recipient: ComparisonRecipientDto; canWrite: boolean; onEdit: () => void; onRemove: () => void }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-slate-700/70 bg-slate-950/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><BellRing className="size-4" /></span><div className="min-w-0"><div className="truncate font-semibold text-slate-100">{recipient.name || recipient.email}</div><div className="mt-0.5 truncate text-sm text-slate-500">{recipient.email}</div></div><Badge variant={recipient.isActive ? "success" : "warning"}>{recipient.isActive ? "Aktif" : "Pasif"}</Badge></div>{canWrite ? <div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={onEdit} aria-label="Alıcıyı düzenle"><Edit3 /></Button><Button variant="ghost" size="icon" onClick={onRemove} aria-label="Alıcıyı sil"><Trash2 /></Button></div> : null}</div>;
}
