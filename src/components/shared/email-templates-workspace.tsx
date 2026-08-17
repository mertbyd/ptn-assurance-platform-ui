"use client";

import { useCallback, useMemo, useState } from "react";
import { Code2, Edit3, Eye, FileText, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useCanWrite } from "@/hooks/useAuth";
import { extractUserMessage } from "@/lib/error-messages";
import { searchable } from "@/lib/presentation";
import { emailTemplatesService } from "@/services/email-templates.service";
import type { EmailTemplateDto } from "@/types";

export function EmailTemplatesWorkspace() {
  const loader = useCallback(async () => {
    const result = await emailTemplatesService.getList({ maxResultCount: 1000, sorting: "Name" });
    return result;
  }, []);
  const { data, isLoading, error, reload } = useAsyncResource(loader);
  const canWrite = useCanWrite();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplateDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewing, setPreviewing] = useState<EmailTemplateDto | null>(null);
  const [previewMode, setPreviewMode] = useState<"rendered" | "source">("rendered");

  // Form state
  const [name, setName] = useState("");
  const [culture, setCulture] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isLayout, setIsLayout] = useState(false);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const templates = useMemo(() => {
    const normalized = searchable(query.trim());
    return (data?.items ?? []).filter(
      (t) => !normalized || searchable(`${t.name} ${t.culture} ${t.description ?? ""}`).includes(normalized),
    );
  }, [data, query]);

  const layouts = useMemo(() => templates.filter((t) => t.isLayout), [templates]);
  const mails = useMemo(() => templates.filter((t) => !t.isLayout), [templates]);

  function openCreate() {
    setEditing(null);
    setName("");
    setCulture("");
    setSubject("");
    setBody("");
    setIsLayout(false);
    setDescription("");
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(template: EmailTemplateDto) {
    setEditing(template);
    setName(template.name);
    setCulture(template.culture);
    setSubject(template.subject);
    setBody(template.body);
    setIsLayout(template.isLayout);
    setDescription(template.description ?? "");
    setFormError(null);
    setModalOpen(true);
  }

  function openPreview(template: EmailTemplateDto) {
    setPreviewing(template);
    setPreviewMode("rendered");
    setPreviewOpen(true);
  }

  async function saveTemplate() {
    if (!name.trim()) {
      setFormError("Şablon adı boş olamaz.");
      return;
    }
    if (!body.trim()) {
      setFormError("Şablon gövdesi boş olamaz.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const dto = {
        name: name.trim(),
        culture: culture.trim(),
        subject: subject.trim(),
        body,
        isLayout,
        description: description.trim() || null,
      };
      if (editing) await emailTemplatesService.update(editing.id, dto);
      else await emailTemplatesService.create(dto);
      setModalOpen(false);
      await reload();
    } catch (caught) {
      setFormError(extractUserMessage(caught, "Şablon kaydedilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeTemplate(template: EmailTemplateDto) {
    if (!window.confirm(`"${template.name}" (${template.culture || "tüm diller"}) şablonunu silmek istiyor musunuz?`)) return;
    try {
      await emailTemplatesService.remove(template.id);
      await reload();
    } catch (caught) {
      setFormError(extractUserMessage(caught, "Şablon silinemedi."));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform e-posta yönetimi"
        title="E-posta Şablonları"
        description="Sistemdeki tüm mail şablonlarını (layout, subject, body) yönetin. Scriban söz dizimi desteklenir."
        actions={
          <>
            <Button variant="outline" onClick={() => void reload()}>
              <RefreshCw />
              Yenile
            </Button>
            {canWrite ? (
              <Button onClick={openCreate}>
                <Plus />
                Yeni şablon
              </Button>
            ) : null}
          </>
        }
      />
      <ReadOnlyNotice message="Şablonları görüntüleyebilirsiniz. Değişiklik için yönetim yetkisi gerekir." />

      {error ? <ErrorState message={error} /> : null}
      {isLoading || !data ? (
        <LoadingRows />
      ) : (
        <div className="space-y-5">
          {/* Arama */}
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Şablon adı, kültür veya açıklama ara"
          />

          {/* Layout şablonları */}
          <Card>
            <CardHeader>
              <CardTitle>Layout Şablonları</CardTitle>
              <p className="text-sm text-slate-500">
                Ortak HTML kabuk. Mail gövdeleri bu layout içine <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-sky-300">{"{{ content }}"}</code> ile yerleşir.
              </p>
            </CardHeader>
            <CardContent>
              {layouts.length ? (
                <div className="space-y-2">
                  {layouts.map((t) => (
                    <TemplateRow key={t.id} template={t} canWrite={canWrite} onEdit={() => openEdit(t)} onRemove={() => void removeTemplate(t)} onPreview={() => openPreview(t)} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={Code2} title="Layout bulunamadı" description="Henüz layout şablonu yok." />
              )}
            </CardContent>
          </Card>

          {/* Mail şablonları */}
          <Card>
            <CardHeader>
              <CardTitle>Mail Şablonları</CardTitle>
              <p className="text-sm text-slate-500">
                Her mail türü için subject ve body şablonları. Kültür bazlı çeviri satırları eklenebilir.
              </p>
            </CardHeader>
            <CardContent>
              {formError && !modalOpen ? <ErrorState message={formError} /> : null}
              {mails.length ? (
                <div className="space-y-2">
                  {mails.map((t) => (
                    <TemplateRow key={t.id} template={t} canWrite={canWrite} onEdit={() => openEdit(t)} onRemove={() => void removeTemplate(t)} onPreview={() => openPreview(t)} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={FileText} title="Şablon bulunamadı" description="Henüz mail şablonu yok." action={canWrite ? <Button onClick={openCreate}><Plus />Yeni şablon</Button> : undefined} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Şablonu düzenle" : "Yeni e-posta şablonu"}
        description="Scriban söz dizimi kullanılır. Layout'ta {{ content }}, mail'de {{ model.PropertyName }}."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Vazgeç</Button>
            <Button onClick={() => void saveTemplate()} disabled={isSaving}>{isSaving ? "Kaydediliyor…" : "Kaydet"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <ErrorState message={formError} /> : null}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Şablon adı *</span>
              <Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="DatabaseChecker.Emails.ComparisonReport" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Kültür</span>
              <Input className="mt-2" value={culture} onChange={(e) => setCulture(e.target.value)} placeholder='Boş = kültür-nötr, "en", "tr"' />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-200">Konu (Subject)</span>
            <Input className="mt-2" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Rapor: {{ model.Source }} → {{ model.Target }}" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-200">Gövde (Body) *</span>
            <textarea
              className="mt-2 min-h-[200px] w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="<div>{{ content }}</div> veya <p>{{ model.UserName }}</p>"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-200">Açıklama</span>
            <Input className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Yönetim notu (isteğe bağlı)" />
          </label>

          <div className="flex gap-6">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/25 p-4 text-sm text-slate-300">
              <Checkbox checked={isLayout} onChange={(e) => setIsLayout(e.target.checked)} />
              Layout şablonu
            </label>
          </div>
        </div>
      </Modal>

      {/* Preview modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Önizleme: ${previewing?.name ?? ""}`}
        description={`Kültür: ${previewing?.culture || "(tüm)"} · ${previewing?.isLayout ? "Layout" : "Mail şablonu"}`}
        size="xl"
        footer={<Button variant="ghost" onClick={() => setPreviewOpen(false)}>Kapat</Button>}
      >
        {previewing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex gap-0.5 rounded-lg border border-slate-700 bg-slate-950/40 p-0.5">
                <Button variant={previewMode === "rendered" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("rendered")}><Eye />Önizleme</Button>
                <Button variant={previewMode === "source" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("source")}><Code2 />HTML kaynağı</Button>
              </div>
              <Badge variant={previewing.isLayout ? "default" : "neutral"}>{previewing.isLayout ? "Layout" : "Mail"}</Badge>
              {previewing.isInherited ? <Badge variant="warning">Host&apos;tan miras</Badge> : null}
            </div>

            {previewing.subject ? (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Konu</div>
                <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">{previewing.subject}</div>
              </div>
            ) : null}

            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{previewMode === "rendered" ? "Gövde önizleme" : "Gövde (HTML)"}</div>
              {previewMode === "rendered" ? (
                <iframe
                  title="E-posta önizleme"
                  sandbox=""
                  srcDoc={buildPreviewDoc(previewing)}
                  className="h-[460px] w-full rounded-lg border border-slate-700 bg-white"
                />
              ) : (
                <pre className="max-h-[460px] overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-slate-300">{previewing.body}</pre>
              )}
            </div>

            {previewMode === "rendered" ? (
              <p className="text-xs text-slate-500">
                Not: {"{{ ... }}"} Scriban ifadeleri örnek veriyle doldurulmadan olduğu gibi görüntülenir.
                {previewing.isLayout ? " Layout içindeki içerik alanı örnek bir kutuyla temsil edilir." : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// Sablonun HTML govdesini sandbox'li iframe icin tam bir dokumana cevirir.
// Layout ise {{ content }} yer tutucusu ornek bir icerik kutusuyla degistirilir.
function buildPreviewDoc(template: EmailTemplateDto): string {
  let body = template.body ?? "";
  if (template.isLayout) {
    const sample = `<div style="margin:12px 0;padding:16px;border:1px dashed #94a3b8;border-radius:8px;background:#f8fafc;color:#334155">`
      + `<p style="margin:0 0 6px;font-weight:600">[ İçerik alanı ]</p>`
      + `<p style="margin:0;color:#64748b;font-size:13px">Mail gövdeleri bu bölüme yerleşir.</p></div>`;
    body = body.replace(/\{\{\s*content\s*\}\}/gi, sample);
  }
  if (/<html[\s>]/i.test(body)) return body;
  return `<!doctype html><html><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width, initial-scale=1">`
    + `<style>body{margin:0;padding:16px;background:#ffffff;color:#0f172a;`
    + `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;`
    + `font-size:14px;line-height:1.5}img{max-width:100%}a{color:#2563eb}</style></head>`
    + `<body>${body}</body></html>`;
}

function TemplateRow({ template, canWrite, onEdit, onRemove, onPreview }: { template: EmailTemplateDto; canWrite: boolean; onEdit: () => void; onRemove: () => void; onPreview: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-700/70 bg-slate-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
          {template.isLayout ? <Code2 className="size-4" /> : <FileText className="size-4" />}
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-100">{template.name}</div>
          <div className="mt-0.5 truncate text-sm text-slate-500">
            {template.culture || "Tüm diller"}
            {template.description ? ` · ${template.description}` : ""}
          </div>
        </div>
        <Badge variant={template.isLayout ? "default" : "neutral"}>{template.isLayout ? "Layout" : "Mail"}</Badge>
        {template.isInherited ? <Badge variant="warning" title="Host'tan miras alınan şablon. Özelleştirmek için aynı ad ve kültürle yeni şablon oluşturun.">Miras</Badge> : null}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onPreview} aria-label="Şablonu önizle">
          <FileText />
        </Button>
        {canWrite ? (
          <>
            <Button variant="ghost" size="icon" onClick={onEdit} disabled={template.isInherited} aria-label="Şablonu düzenle">
              <Edit3 />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} disabled={template.isInherited} aria-label="Şablonu sil">
              <Trash2 />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
