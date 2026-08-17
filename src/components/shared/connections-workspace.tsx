"use client";

import { useCallback, useMemo, useState } from "react";
import { Cable, CheckCircle2, Database, Edit3, Plus, Power, RefreshCw, Search, Server, ShieldCheck, XCircle, Zap } from "lucide-react";
import { Badge } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@chakra-ui/react";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { ReadOnlyNotice } from "@/components/shared/read-only-notice";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useCanWrite } from "@/hooks/useAuth";
import { extractUserMessage } from "@/lib/error-messages";
import { searchable } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import { dbApi } from "@/api/db";
import { databaseEnginesService } from "@/services/lookups.service";
import type { DatabaseConnectionDto, Guid, TestConnectionResultDto } from "@/types";

interface ConnectionFormState {
  engineId: string;
  name: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
  isActive: boolean;
}

const emptyForm: ConnectionFormState = { engineId: "", name: "", host: "", port: "", databaseName: "", username: "", password: "", isActive: true };

export function ConnectionsWorkspace() {
  const canWrite = useCanWrite();
  const loader = useCallback(async () => {
    const [connections, engines] = await Promise.all([
      dbApi.connections.getList({ maxResultCount: 1000 }),
      canWrite ? databaseEnginesService.getList({ maxResultCount: 100 }) : Promise.resolve({ items: [], totalCount: 0 }),
    ]);
    return { connections, engines };
  }, [canWrite]);
  const { data, isLoading, error, reload } = useAsyncResource(loader);
  const [query, setQuery] = useState("");
  const [engineFilter, setEngineFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [testResults, setTestResults] = useState<Record<Guid, TestConnectionResultDto | "loading">>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DatabaseConnectionDto | null>(null);
  const [form, setForm] = useState<ConnectionFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const connections = useMemo(() => data?.connections.items ?? [], [data]);
  // Motor filtresini bağlantıların kendisinden türet: read-only kullanıcıda engines listesi yüklenmese de çalışır.
  const engineOptions = useMemo(
    () => Array.from(new Map(connections.map((connection) => [connection.engineCode, connection.engineName || connection.engineCode])).entries()),
    [connections],
  );
  const filteredConnections = useMemo(() => {
    const normalized = searchable(query.trim());
    return connections.filter((connection) => {
      const matchesSearch = !normalized || searchable(`${connection.name} ${connection.host} ${connection.databaseName} ${connection.engineName}`).includes(normalized);
      const matchesEngine = engineFilter === "all" || connection.engineCode === engineFilter;
      return matchesSearch && matchesEngine && (showInactive || connection.isActive);
    });
  }, [connections, query, engineFilter, showInactive]);

  function openCreate() {
    const firstEngine = data?.engines.items.find((engine) => engine.isActive);
    setEditing(null);
    setForm({ ...emptyForm, engineId: firstEngine?.id ?? "", port: firstEngine?.code === "PostgreSql" ? "5432" : firstEngine?.code === "SqlServer" ? "1433" : "" });
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(connection: DatabaseConnectionDto) {
    setEditing(connection);
    setForm({ engineId: connection.engineId, name: connection.name, host: connection.host, port: String(connection.port), databaseName: connection.databaseName, username: "", password: "", isActive: connection.isActive });
    setFormError(null);
    setFormOpen(true);
  }

  function updateField<K extends keyof ConnectionFormState>(key: K, value: ConnectionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveConnection() {
    if (!form.engineId || !form.name.trim() || !form.host.trim() || !form.port || !form.databaseName.trim()) {
      setFormError("Motor, bağlantı adı, sunucu, port ve veritabanı alanlarını doldurun.");
      return;
    }
    if (!editing && (!form.username.trim() || !form.password)) {
      setFormError("Yeni bağlantı için kullanıcı adı ve parola gereklidir.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await dbApi.connections.update(editing.id, {
          engineId: form.engineId,
          name: form.name.trim(),
          host: form.host.trim(),
          port: Number(form.port),
          databaseName: form.databaseName.trim(),
          username: form.username.trim() || null,
          password: form.password || null,
          isActive: form.isActive,
        });
      } else {
        await dbApi.connections.create({
          engineId: form.engineId,
          name: form.name.trim(),
          host: form.host.trim(),
          port: Number(form.port),
          databaseName: form.databaseName.trim(),
          username: form.username.trim(),
          password: form.password,
          isActive: form.isActive,
        });
      }
      setFormOpen(false);
      await reload();
    } catch (caught) {
      setFormError(extractUserMessage(caught, "Bağlantı kaydedilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  async function testConnection(id: Guid) {
    setTestResults((current) => ({ ...current, [id]: "loading" }));
    try {
      const result = await dbApi.connections.testConnection(id);
      setTestResults((current) => ({ ...current, [id]: result }));
    } catch (caught) {
      setTestResults((current) => ({ ...current, [id]: { succeeded: false, message: extractUserMessage(caught, "Bağlantı testi başarısız.") } }));
    }
  }

  async function passivate(connection: DatabaseConnectionDto) {
    if (!window.confirm(`“${connection.name}” bağlantısını pasife almak istiyor musunuz? Geçmiş raporlar korunur.`)) return;
    setActionError(null);
    try {
      await dbApi.connections.passivate(connection.id);
      await reload();
    } catch (caught) {
      setActionError(extractUserMessage(caught, "Bağlantı pasife alınamadı."));
    }
  }

  function handleEngineChange(engineId: string) {
    const engine = data?.engines.items.find((item) => item.id === engineId);
    setForm((current) => ({ ...current, engineId, port: current.port || (engine?.code === "PostgreSql" ? "5432" : engine?.code === "SqlServer" ? "1433" : "") }));
  }

  return (
    <div>
      <PageHeader eyebrow="Güvenli bağlantı yönetimi" title="Veritabanı Bağlantıları" description="Karşılaştırmalarda kullanılacak kaynak ve hedefleri yönetin; erişimi kaydetmeden önce gerçek sunucuda test edin." actions={<><Button variant="outline" onClick={() => void reload()}><RefreshCw />Yenile</Button>{canWrite ? <Button onClick={openCreate}><Plus />Yeni bağlantı</Button> : null}</>} />
      <ReadOnlyNotice message="Bağlantıları görüntüleyebilirsiniz. Yeni bağlantı ekleme, test etme ve pasife alma için veritabanı kullanıcısı yetkisi gerekir." />
      {error ? <ErrorState message={error} /> : null}
      {actionError ? <ErrorState message={actionError} /> : null}
      {isLoading || !data ? <LoadingRows /> : (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/65 p-4 md:grid-cols-[minmax(220px,1fr)_auto_auto] md:items-center">
            <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bağlantı, sunucu veya veritabanı ara" className="pl-10" /></div>
            <Select value={engineFilter} onChange={(event) => setEngineFilter(event.target.value)} className="md:w-52" aria-label="Motora göre filtrele"><option value="all">Tüm motorlar</option>{engineOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</Select>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="size-4 accent-sky-400" />Pasif bağlantıları göster</label>
          </div>
          <div className="-mt-2 flex items-center justify-between px-1 text-xs text-slate-500"><span>{filteredConnections.length} / {connections.length} bağlantı gösteriliyor</span>{(query || engineFilter !== "all") ? <button type="button" onClick={() => { setQuery(""); setEngineFilter("all"); }} className="text-sky-400 hover:text-sky-300">Filtreleri temizle</button> : null}</div>

          {filteredConnections.length ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{filteredConnections.map((connection) => <ConnectionCard key={connection.id} connection={connection} canWrite={canWrite} testResult={testResults[connection.id]} onTest={() => void testConnection(connection.id)} onEdit={() => openEdit(connection)} onPassivate={() => void passivate(connection)} />)}</div> : <EmptyState icon={Cable} title="Bağlantı bulunamadı" description="Arama filtresini temizleyin veya ilk veritabanı bağlantınızı ekleyin." action={canWrite ? <Button onClick={openCreate}><Plus />Yeni bağlantı</Button> : undefined} />}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Bağlantıyı düzenle" : "Yeni veritabanı bağlantısı"} description={editing ? "Kullanıcı adı ve parola boş bırakılırsa mevcut güvenli bilgiler korunur." : "Erişim bilgileri uygulama veritabanında açık olarak tutulmaz."} size="md" footer={<><Button variant="ghost" onClick={() => setFormOpen(false)}>Vazgeç</Button><Button onClick={() => void saveConnection()} disabled={isSaving}>{isSaving ? "Kaydediliyor…" : editing ? "Değişiklikleri kaydet" : "Bağlantıyı oluştur"}</Button></>}>
        <div className="space-y-5">
          {formError ? <ErrorState message={formError} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bağlantı adı" help="Kullanıcıların listede göreceği anlaşılır ad"><Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Örn. Üretim PostgreSQL" /></Field>
            <Field label="Veritabanı motoru"><Select value={form.engineId} onChange={(event) => handleEngineChange(event.target.value)}><option value="">Motor seçin</option>{data?.engines.items.filter((engine) => engine.isActive).map((engine) => <option key={engine.id} value={engine.id}>{engine.name}</option>)}</Select></Field>
            <Field label="Sunucu / host"><Input value={form.host} onChange={(event) => updateField("host", event.target.value)} placeholder="db.company.local" /></Field>
            <Field label="Port"><Input type="number" min={1} max={65535} value={form.port} onChange={(event) => updateField("port", event.target.value)} placeholder="5432" /></Field>
            <Field label="Veritabanı adı" className="sm:col-span-2"><Input value={form.databaseName} onChange={(event) => updateField("databaseName", event.target.value)} placeholder="production_db" /></Field>
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.05] p-4">
            <div className="flex items-center gap-2 font-semibold text-sky-100"><ShieldCheck className="size-4" />Güvenli erişim bilgileri</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{editing ? "Yalnız değiştirmek istiyorsanız yeni değer girin." : "Bu bilgiler şifreli gizli kasa üzerinden saklanır."}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Kullanıcı adı"><Input value={form.username} onChange={(event) => updateField("username", event.target.value)} autoComplete="off" placeholder={editing ? "Değişmeyecekse boş bırakın" : "db_user"} /></Field><Field label="Parola"><Input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} autoComplete="new-password" placeholder={editing ? "Değişmeyecekse boş bırakın" : "••••••••"} /></Field></div>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-700/70 bg-slate-950/25 p-4"><span><span className="block text-sm font-semibold text-slate-200">Bağlantı aktif</span><span className="mt-1 block text-xs text-slate-500">Aktif bağlantılar yeni karşılaştırmalarda seçilebilir.</span></span><input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} className="size-5 accent-sky-400" /></label>
        </div>
      </Modal>
    </div>
  );
}

function ConnectionCard({ connection, canWrite, testResult, onTest, onEdit, onPassivate }: { connection: DatabaseConnectionDto; canWrite: boolean; testResult?: TestConnectionResultDto | "loading"; onTest: () => void; onEdit: () => void; onPassivate: () => void }) {
  return <Card className="overflow-hidden"><CardContent className="p-0 md:p-0">
    <div className="flex items-start justify-between gap-3 p-5"><div className="flex min-w-0 items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300"><Database className="size-5" /></span><div className="min-w-0"><h2 className="truncate font-semibold text-slate-100">{connection.name}</h2><div className="mt-1 flex flex-wrap gap-2"><Badge variant="neutral">{connection.engineName || connection.engineCode}</Badge><Badge variant={connection.isActive ? "success" : "warning"}>{connection.isActive ? "Aktif" : "Pasif"}</Badge></div></div></div>{canWrite ? <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Bağlantıyı düzenle"><Edit3 /></Button> : null}</div>
    <div className="grid gap-3 border-y border-slate-700/70 bg-slate-950/25 p-4 text-sm sm:grid-cols-2"><Info icon={Server} label="Sunucu" value={`${connection.host}:${connection.port}`} /><Info icon={Database} label="Veritabanı" value={connection.databaseName} /></div>
    {testResult && testResult !== "loading" ? <div className={cn("mx-4 mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm", testResult.succeeded ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.06] text-red-100")}>{testResult.succeeded ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}<div><div className="font-semibold">{testResult.succeeded ? "Bağlantı başarılı" : "Bağlantı kurulamadı"}</div><div className="mt-0.5 text-xs opacity-70">{testResult.serverVersion || testResult.message || "Sunucu yanıt verdi."}</div></div></div> : null}
    {canWrite ? <div className="flex flex-wrap items-center gap-2 p-4"><Button variant="outline" onClick={onTest} disabled={testResult === "loading" || !connection.isActive}><Zap />{testResult === "loading" ? "Test ediliyor…" : "Bağlantıyı test et"}</Button>{connection.isActive ? <Button variant="ghost" onClick={onPassivate}><Power />Pasife al</Button> : null}</div> : null}
  </CardContent></Card>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-2"><Icon className="size-4 shrink-0 text-slate-600" /><div className="min-w-0"><div className="text-[11px] text-slate-600">{label}</div><div className="truncate font-medium text-slate-300">{value}</div></div></div>;
}

function Field({ label, help, className, children }: { label: string; help?: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="text-sm font-semibold text-slate-200">{label}</span>{help ? <span className="mt-1 block text-xs text-slate-500">{help}</span> : null}<span className="mt-2 block">{children}</span></label>;
}
