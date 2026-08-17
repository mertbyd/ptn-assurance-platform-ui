"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Building2, Edit3, Info, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@chakra-ui/react";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { AdminUsersWorkspace } from "@/components/shared/admin-users-workspace";
import { extractUserMessage } from "@/lib/error-messages";
import { searchable } from "@/lib/presentation";
import { tenantManagementService } from "@/services/tenants.service";
import type { TenantCreateDto, TenantDto } from "@/types";

interface TenantFormState {
  name: string;
  adminEmailAddress: string;
}

const emptyForm: TenantFormState = { name: "", adminEmailAddress: "" };

export function AdminTenantsWorkspace() {
  const loader = useCallback(() => tenantManagementService.getList({ maxResultCount: 1000, sorting: "name" }), []);
  const { data, isLoading, error, reload } = useAsyncResource(loader);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState<TenantDto | null>(null);
  const [editing, setEditing] = useState<TenantDto | null>(null);
  const [form, setForm] = useState<TenantFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = searchable(query.trim());
    return (data?.items ?? []).filter((tenant) => !normalized || searchable(tenant.name).includes(normalized));
  }, [data, query]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(tenant: TenantDto) {
    setEditing(tenant);
    setForm({ name: tenant.name, adminEmailAddress: "" });
    setFormError(null);
    setModalOpen(true);
  }

  function updateField<K extends keyof TenantFormState>(key: K, value: TenantFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) {
      setFormError("Tenant adı zorunludur.");
      return;
    }
    if (!editing && !form.adminEmailAddress.trim()) {
      setFormError("Yeni tenant için yönetici e-postası gereklidir.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await tenantManagementService.update(editing.id, { name: form.name.trim(), concurrencyStamp: editing.concurrencyStamp });
      } else {
        const randomPassword = crypto.randomUUID() + "aA1!"; // ABP güvenlik kurallarını geçmesi için güçlü bir şifre uyduruyoruz
        const dto: TenantCreateDto = { name: form.name.trim(), adminEmailAddress: form.adminEmailAddress.trim(), adminPassword: randomPassword };
        await tenantManagementService.create(dto);
      }
      setModalOpen(false);
      await reload();
    } catch (caught) {
      setFormError(extractUserMessage(caught, "Tenant kaydedilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(tenant: TenantDto) {
    if (!window.confirm(`“${tenant.name}” tenant’ını silmek istiyor musunuz? Bu işlem tenant’a ait tüm verileri kaldırır.`)) return;
    setRowError(null);
    try {
      await tenantManagementService.remove(tenant.id);
      await reload();
    } catch (caught) {
      setRowError(extractUserMessage(caught, "Tenant silinemedi."));
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Platform yönetimi" title="Tenant Yönetimi" description="Platform genelinde tenant’ları oluşturun ve yönetin. Her tenant izole veri, kullanıcı ve bağlantılara sahiptir." actions={<><Button variant="outline" onClick={() => void reload()}><RefreshCw />Yenile</Button><Button onClick={openCreate}><Plus />Yeni tenant</Button></>} />
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-3.5 text-sm text-slate-300"><Info className="mt-0.5 size-4 shrink-0 text-sky-300" />Yeni tenant oluşturduğunuzda o tenant için bir yönetici hesabı da açılır. Roller (Admin, DatabaseUser, ReadOnly) tenant sağlama sırasında backend tarafında seed edilir.</div>
      {error ? <ErrorState message={error} /> : null}
      {rowError ? <ErrorState message={rowError} /> : null}
      {isLoading || !data ? <LoadingRows /> : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-4">
            <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tenant ara" className="pl-10" /></div>
          </div>
          {filtered.length ? (
            <div className="grid gap-3 xl:grid-cols-2">{filtered.map((tenant) => (
              <Card key={tenant.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><Building2 className="size-5" /></span>
                    <div className="min-w-0"><div className="truncate font-semibold text-slate-100">{tenant.name}</div><div className="mt-0.5 truncate text-xs text-slate-600">{tenant.id}</div></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedTenantForUsers(tenant)} aria-label="Üyeleri Yönet"><Users /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tenant)} aria-label="Tenant’ı düzenle"><Edit3 /></Button>
                    <Button variant="ghost" size="icon" onClick={() => void remove(tenant)} aria-label="Tenant’ı sil"><Trash2 /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}</div>
          ) : <EmptyState icon={Building2} title="Tenant bulunamadı" description="Arama filtresini temizleyin veya ilk tenant’ı oluşturun." action={<Button onClick={openCreate}><Plus />Yeni tenant</Button>} />}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Tenant’ı düzenle" : "Yeni tenant"} description={editing ? "Tenant adını güncelleyin." : "Tenant ve ilk yönetici hesabı oluşturulur."} size="md" footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Vazgeç</Button><Button onClick={() => void save()} disabled={isSaving}>{isSaving ? "Kaydediliyor…" : "Kaydet"}</Button></>}>
        <div className="space-y-4">
          {formError ? <ErrorState message={formError} /> : null}
          <Field label="Tenant adı"><Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Örn. Piton Backend" autoComplete="off" /></Field>
          {!editing ? (
            <Field label="Yönetici e-postası"><Input type="email" value={form.adminEmailAddress} onChange={(event) => updateField("adminEmailAddress", event.target.value)} placeholder="admin@tenant.com" autoComplete="off" /></Field>
          ) : null}
        </div>
      </Modal>

      <Modal open={!!selectedTenantForUsers} onClose={() => setSelectedTenantForUsers(null)} title={`${selectedTenantForUsers?.name} Üyeleri`} description="Bu tenant içindeki kullanıcıları ve yetkilerini yönetin." size="xl" footer={<Button onClick={() => setSelectedTenantForUsers(null)}>Kapat</Button>}>
        {selectedTenantForUsers ? <div className="mt-4"><AdminUsersWorkspace tenantId={selectedTenantForUsers.id} /></div> : null}
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="text-sm font-semibold text-slate-200">{label}</span><span className="mt-2 block">{children}</span></label>;
}
