"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Download,
  FileBarChart,
  GitCompareArrows,
  Mail,
  Printer,
  RefreshCw,
  Search,
  Timer,
} from "lucide-react";
import { Badge } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@chakra-ui/react";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { FindingsExplorer } from "@/components/shared/findings-explorer";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useIsAdmin } from "@/hooks/useAuth";
import { extractUserMessage } from "@/lib/error-messages";
import { normalizeEntityId } from "@/lib/guid";
import {
  formatDateTime,
  formatDuration,
  getComparisonTypeLabel,
  getDifferenceKindMeta,
  getObjectTypeLabel,
  searchable,
} from "@/lib/presentation";
import { cn } from "@/lib/utils";
import { dbApi } from "@/api/db";
import { emailNotificationsService } from "@/services/email-notifications.service";
import type {
  ComparisonReportDto,
  ComparisonRunDto,
} from "@/types";

export function RunsWorkspace() {
  const loader = useCallback(async () => {
    const runs = await dbApi.runs.list({ maxResultCount: 250 });
    return { runs };
  }, []);
  const { data, isLoading, error, reload } = useAsyncResource(loader);
  const canResendEmail = useIsAdmin();
  const rawRequestedRunId = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("runId") ?? "";
  const requestedRunId = normalizeEntityId(rawRequestedRunId);
  const autoOpenedRunId = useRef<string | null>(null);
  const openRequest = useRef<AbortController | null>(null);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [report, setReport] = useState<ComparisonReportDto | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [differenceFilter, setDifferenceFilter] = useState("all");
  const [isOpening, setIsOpening] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const runs = useMemo(() => data?.runs.items ?? [], [data]);
  const statuses = useMemo(() => Array.from(new Map(runs.map((run) => [run.statusCode, run.statusName])).entries()), [runs]);
  const filteredRuns = useMemo(() => {
    const normalized = searchable(query.trim());
    return runs.filter((run) => {
      const total = run.schemaDifferenceCount + run.dataDifferenceCount + run.migrationDifferenceCount;
      const matchesSearch = !normalized || searchable(`${run.comparisonDefinitionName ?? ""} ${run.sourceConnectionName} ${run.targetConnectionName} ${run.comparisonTypeName} ${run.statusName}`).includes(normalized);
      const matchesStatus = statusFilter === "all" || run.statusCode === statusFilter;
      const matchesDifference = differenceFilter === "all" || (differenceFilter === "with" && total > 0) || (differenceFilter === "clean" && total === 0);
      return matchesSearch && matchesStatus && matchesDifference;
    });
  }, [differenceFilter, query, runs, statusFilter]);

  const openReport = useCallback(async (runId: string) => {
    const normalizedRunId = normalizeEntityId(runId);
    if (!normalizedRunId) {
      setActionError("Çalıştırma kimliği geçersiz. Listeyi yenileyip tekrar deneyin.");
      return;
    }

    openRequest.current?.abort();
    const controller = new AbortController();
    openRequest.current = controller;
    setSelectedRunId(normalizedRunId);
    setIsOpening(true);
    setActionError(null);
    setActionMessage("Karşılaştırma arka planda çalışıyor; sonuç hazır olduğunda rapor otomatik açılacak.");
    setReport(null);
    try {
      await dbApi.runs.waitUntilTerminal(normalizedRunId, controller.signal);
      const nextReport = await dbApi.runs.getReport(normalizedRunId, controller.signal);
      if (controller.signal.aborted) return;
      setReport(nextReport);
      setActionMessage(null);
      await reload();
    } catch (caught) {
      if (controller.signal.aborted) return;
      setActionError(extractUserMessage(caught, "Rapor açılamadı."));
      setActionMessage(null);
    } finally {
      if (openRequest.current === controller) {
        openRequest.current = null;
        setIsOpening(false);
      }
    }
  }, [reload]);

  useEffect(() => () => openRequest.current?.abort(), []);

  useEffect(() => {
    if (!rawRequestedRunId || requestedRunId) return;
    const timeoutId = window.setTimeout(() => {
      setActionError("Bağlantıdaki çalıştırma kimliği geçersiz. Geçmiş listesinden bir rapor seçin.");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [rawRequestedRunId, requestedRunId]);

  useEffect(() => {
    if (!requestedRunId || !data || autoOpenedRunId.current === requestedRunId) return;
    autoOpenedRunId.current = requestedRunId;
    window.setTimeout(() => void openReport(requestedRunId), 0);
  }, [data, openReport, requestedRunId]);

  function downloadReport() {
    if (!report) return;
    const runId = normalizeEntityId(selectedRunId) ?? normalizeEntityId(report.runId);
    if (!runId) {
      setActionError("Rapor kimliği geçersiz olduğu için dosya indirilemedi. Raporu yeniden açın.");
      return;
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `database-checker-${runId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function resendEmail() {
    if (!report) return;
    const runId = normalizeEntityId(selectedRunId) ?? normalizeEntityId(report.runId);
    if (!runId) {
      setActionError("Rapor kimliği geçersiz olduğu için e-posta gönderilemedi. Raporu yeniden açın.");
      return;
    }

    setIsResendingEmail(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await emailNotificationsService.resend(runId);
      setActionMessage("Rapor e-postası aktif alıcılara gönderildi.");
    } catch (caught) {
      setActionError(extractUserMessage(caught, "Rapor e-postası yeniden gönderilemedi."));
    } finally {
      setIsResendingEmail(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kalıcı karşılaştırma kayıtları"
        title="Geçmiş ve Raporlar"
        description="Tamamlanan karşılaştırmaları açın ve farkları teknik kodlar yerine iş anlamıyla inceleyin."
        actions={<Button variant="outline" onClick={() => void reload()}><RefreshCw />Listeyi yenile</Button>}
      />

      {error ? <ErrorState message={error} /> : null}
      {isLoading || !data ? <LoadingRows /> : (
        <div className="space-y-5">
          {actionError ? <ErrorState message={actionError} /> : null}
          {actionMessage ? <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3.5 text-sm text-emerald-200">{actionMessage}</div> : null}

          <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
            <Card className="h-fit overflow-hidden xl:sticky xl:top-24">
              <CardHeader className="border-b border-slate-700/70"><CardTitle>Çalıştırma geçmişi</CardTitle><p className="mt-1 text-sm text-slate-500">{filteredRuns.length} / {runs.length} kayıt</p></CardHeader>
              <CardContent className="p-0 md:p-0">
                <div className="space-y-3 border-b border-slate-700/70 p-4">
                  <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Veritabanı veya durum ara" className="pl-10" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Durum filtresi"><option value="all">Tüm durumlar</option>{statuses.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</Select>
                    <Select value={differenceFilter} onChange={(event) => setDifferenceFilter(event.target.value)} aria-label="Fark filtresi"><option value="all">Tüm sonuçlar</option><option value="with">Fark bulunanlar</option><option value="clean">Farksız olanlar</option></Select>
                  </div>
                </div>
                <div className="max-h-[68vh] space-y-2 overflow-y-auto p-3">
                  {filteredRuns.map((run) => <RunListItem key={run.id} run={run} selected={selectedRunId === run.id} loading={isOpening && selectedRunId === run.id} onOpen={() => void openReport(run.id)} />)}
                  {!filteredRuns.length ? <div className="px-4 py-10 text-center text-sm text-slate-500">Bu filtrelerle eşleşen çalıştırma yok.</div> : null}
                </div>
              </CardContent>
            </Card>

            <div id="run-report" className="min-w-0 scroll-mt-28">
              {isOpening ? <LoadingRows /> : report ? <ReportView report={report} canResendEmail={canResendEmail} isResendingEmail={isResendingEmail} onDownload={downloadReport} onResendEmail={() => void resendEmail()} /> : <EmptyState icon={FileBarChart} title="Bir rapor seçin" description="Geçmişteki bir çalıştırmaya tıklayın. Özet ve tüm bulgular burada açılacak." />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RunListItem({ run, selected, loading, onOpen }: { run: ComparisonRunDto; selected: boolean; loading: boolean; onOpen: () => void }) {
  const total = run.schemaDifferenceCount + run.dataDifferenceCount + run.migrationDifferenceCount;
  const statusCode = run.statusCode.toLowerCase();
  const isInProgress = statusCode === "pending" || statusCode === "running";
  const isFailed = statusCode === "failed";
  const resultLabel = loading ? "Bekleniyor…" : isInProgress ? run.statusName : isFailed ? "Başarısız" : total ? `${total} fark` : "Uyumlu";
  return (
    <button type="button" onClick={onOpen} className={cn("w-full rounded-xl border p-3.5 text-left transition-all", selected ? "border-sky-400/35 bg-sky-400/[0.07]" : "border-transparent bg-slate-950/25 hover:border-slate-700 hover:bg-slate-800/45")}>
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-100">{run.comparisonDefinitionName || `${run.sourceConnectionName} → ${run.targetConnectionName}`}</div><div className="mt-0.5 truncate text-[11px] text-slate-500">{run.sourceConnectionName} → {run.targetConnectionName}</div><div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500"><span className="truncate">{run.comparisonTypeName}</span><ArrowRight className="size-3 shrink-0" /><span className="truncate">{run.statusName}</span></div></div><StatusBadge code={run.statusCode} label={run.statusName} /></div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-700/60 pt-3"><span className="text-[11px] text-slate-600">{formatDateTime(run.creationTime)}</span><Badge variant="subtle" colorPalette={isFailed ? "red" : total ? "orange" : isInProgress ? "gray" : "green"}>{resultLabel}</Badge></div>
    </button>
  );
}

function ReportView({ report, canResendEmail, isResendingEmail, onDownload, onResendEmail }: { report: ComparisonReportDto; canResendEmail: boolean; isResendingEmail: boolean; onDownload: () => void; onResendEmail: () => void }) {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-700/70 bg-gradient-to-r from-sky-400/[0.08] to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><StatusBadge code={report.statusCode} label={report.statusName} /><Badge variant="subtle" colorPalette="gray">{getComparisonTypeLabel(report.comparisonTypeCode, report.comparisonTypeName)}</Badge></div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-100">Karşılaştırma raporu</h2><p className="mt-1 text-sm text-slate-500">{formatDateTime(report.completedAt || report.creationTime)}</p></div>
            <div className="flex flex-wrap gap-2" data-print-hidden="true">{canResendEmail ? <Button variant="outline" onClick={onResendEmail} disabled={isResendingEmail}><Mail />{isResendingEmail ? "Gönderiliyor…" : "E-postayı yeniden gönder"}</Button> : null}<Button variant="outline" onClick={onDownload}><Download />JSON indir</Button><Button variant="outline" onClick={() => window.print()}><Printer />Yazdır</Button></div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <DatabaseEndpoint label="Kaynak · referans" name={report.sourceConnectionName} engine={report.sourceEngineName || report.sourceEngineCode} />
            <ArrowRight className="mx-auto hidden size-5 text-slate-600 md:block" />
            <DatabaseEndpoint label="Hedef · incelenen" name={report.targetConnectionName} engine={report.targetEngineName || report.targetEngineCode} />
          </div>
        </div>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4 md:pt-6">
          <ReportMetric label="Toplam bulgu" value={report.summary.totalDifferenceCount} icon={BarChart3} />
          <ReportMetric label="Yapı farkı" value={report.summary.schemaDifferenceCount} icon={GitCompareArrows} />
          <ReportMetric label="Veri farkı" value={report.summary.dataDifferenceCount} icon={FileBarChart} />
          <ReportMetric label="Süre" value={formatDuration(report.startedAt, report.completedAt)} icon={Timer} textValue />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Farkların yönü</CardTitle><p className="mt-1 text-sm text-slate-500">Hedef veritabanına göre ne yapılması gerektiğini gösterir.</p></CardHeader><CardContent><CountBars items={report.summary.kindCounts.map((item) => ({ code: item.code, label: getDifferenceKindMeta(item.code).label, count: item.count }))} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Nesne türleri</CardTitle><p className="mt-1 text-sm text-slate-500">Farkların hangi veritabanı öğelerinde yoğunlaştığı.</p></CardHeader><CardContent><CountBars items={report.summary.objectTypeCounts.map((item) => ({ code: item.code, label: getObjectTypeLabel(item.code), count: item.count }))} /></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Bulgu ayrıntıları</CardTitle><p className="mt-1 text-sm text-slate-500">Arayın, fark yönüne göre süzün ve satırı açarak kaynak–hedef tanımlarını inceleyin.</p></CardHeader><CardContent><FindingsExplorer findings={report.findings} /></CardContent></Card>
    </div>
  );
}

function DatabaseEndpoint({ label, name, engine }: { label: string; name: string; engine: string }) {
  return <div className="rounded-xl border border-slate-700/70 bg-slate-950/30 p-4"><div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">{label}</div><div className="mt-1 font-semibold text-slate-100">{name}</div><div className="mt-1 text-xs text-slate-500">{engine}</div></div>;
}

function ReportMetric({ label, value, icon: Icon, textValue = false }: { label: string; value: number | string; icon: typeof BarChart3; textValue?: boolean }) {
  return <div data-report-metric={label} className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/25 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><Icon className="size-[18px]" /></span><div><div className={cn("font-semibold tracking-[-0.02em] text-slate-100", textValue ? "text-lg" : "text-2xl")}>{typeof value === "number" ? value.toLocaleString("tr-TR") : value}</div><div className="text-xs text-slate-500">{label}</div></div></div>;
}

function CountBars({ items }: { items: { code: string; label: string; count: number }[] }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  if (!items.length) return <div className="py-6 text-center text-sm text-slate-500">Dağılım verisi yok.</div>;
  return <div className="space-y-3">{items.slice(0, 10).map((item) => <div key={item.code}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-300">{item.label}</span><span className="font-semibold text-slate-100">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-300" style={{ width: `${Math.max((item.count / max) * 100, 4)}%` }} /></div></div>)}</div>;
}
