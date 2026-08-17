"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ArrowRight, Cable, CheckCircle2, Database, FileBarChart, GitCompareArrows, PlayCircle } from "lucide-react";
import { Badge } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { useCanWrite } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/presentation";
import { dbApi } from "@/api/db";
import { dbApi } from "@/api/db";
import type { ComparisonRunDto } from "@/types";

export function DashboardOverview() {
  const canWrite = useCanWrite();
  const loader = useCallback(async () => {
    const [connections, runs] = await Promise.all([
      dbApi.connections.getList({ maxResultCount: 1000 }),
      comparisonRunsService.getList({ maxResultCount: 8 }),
    ]);
    return { connections, runs };
  }, []);
  const { data, isLoading, error } = useAsyncResource(loader);

  return (
    <div>
      <PageHeader
        eyebrow="Database Checker"
        title="Veritabanlarınız aynı mı?"
        description="Kaynak veritabanını referans alın, hedefi karşılaştırın ve farkları uygulanabilir bir rapor olarak inceleyin."
        actions={canWrite ? <Button asChild><Link href="/schema-comparison"><GitCompareArrows />Yeni karşılaştırma</Link></Button> : <Button asChild variant="outline"><Link href="/runs"><FileBarChart />Raporları görüntüle</Link></Button>}
      />
      {error ? <ErrorState message={error} /> : null}
      {isLoading || !data ? <LoadingRows /> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewMetric label="Aktif bağlantı" value={data.connections.items.filter((item) => item.isActive).length} detail={`${data.connections.totalCount} toplam kayıt`} icon={Cable} />
            <OverviewMetric label="Toplam çalışma" value={data.runs.totalCount} detail="Kalıcı karşılaştırma geçmişi" icon={PlayCircle} />
            <OverviewMetric label="Son 8 çalışmadaki fark" value={data.runs.items.reduce((sum, item) => sum + item.schemaDifferenceCount + item.dataDifferenceCount + item.migrationDifferenceCount, 0)} detail="Yapı, veri ve migration" icon={FileBarChart} />
          </div>

          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Üç adımda başlayın</CardTitle><p className="mt-1 text-sm text-slate-500">İlk kez kullanan biri için önerilen iş sırası.</p></CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-3">
              <StartStep number="01" title="Bağlantıları hazırlayın" description="Kaynak ve hedef veritabanlarını ekleyip gerçek erişimi test edin." href="/connections" action="Bağlantıları aç" icon={Database} />
              {canWrite ? <StartStep number="02" title="Karşılaştırmayı çalıştırın" description="Referans ve hedefi seçin; isterseniz kapsamı tablo veya kolona kadar daraltın." href="/schema-comparison" action="Karşılaştır" icon={GitCompareArrows} /> : <StartStep number="02" title="Raporları inceleyin" description="Ekibinizin tamamladığı karşılaştırmaları ve bulunan farkları görüntüleyin." href="/runs" action="Raporlara git" icon={GitCompareArrows} />}
              <StartStep number="03" title="Raporu inceleyin" description="Hedefte eksik, fazladan ve değişmiş öğeleri filtreleyip ayrıntıları açın." href="/runs" action="Raporlara git" icon={FileBarChart} />
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <Card>
              <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Son çalışmalar</CardTitle><p className="mt-1 text-sm text-slate-500">En yeni kalıcı karşılaştırma sonuçları</p></div><Button asChild variant="outline" size="sm"><Link href="/runs">Tümünü gör<ArrowRight /></Link></Button></CardHeader>
              <CardContent className="space-y-2">{data.runs.items.length ? data.runs.items.map((run) => <RecentRun key={run.id} run={run} />) : <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Henüz kalıcı bir karşılaştırma çalıştırılmadı.</div>}</CardContent>
            </Card>

            <Card className="h-fit border-emerald-400/20 bg-emerald-400/[0.04]">
              <CardHeader><div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="size-5" /></div><CardTitle className="mt-3">Sistem hazır</CardTitle><p className="mt-1 text-sm leading-6 text-slate-500">PostgreSQL ve SQL Server bağlantıları, canlı şema taraması, yapı/veri karşılaştırması ve yapısal rapor API’si arayüze bağlı.</p></CardHeader>
              <CardContent className="space-y-2">{canWrite ? <><Button asChild className="w-full"><Link href="/schema-comparison"><GitCompareArrows />Yeni karşılaştırma başlat</Link></Button><Button asChild variant="outline" className="w-full"><Link href="/schema-discovery">Veritabanını incele</Link></Button></> : <><Button asChild className="w-full"><Link href="/runs"><FileBarChart />Raporları görüntüle</Link></Button><Button asChild variant="outline" className="w-full"><Link href="/connections">Bağlantıları görüntüle</Link></Button></>}</CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewMetric({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Cable }) {
  return <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-400">{label}</span><span className="flex size-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><Icon className="size-4" /></span></div><div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-100">{value.toLocaleString("tr-TR")}</div><div className="mt-1 text-xs text-slate-600">{detail}</div></div>;
}

function StartStep({ number, title, description, href, action, icon: Icon }: { number: string; title: string; description: string; href: string; action: string; icon: typeof Database }) {
  return <Link href={href} className="group rounded-2xl border border-slate-700/70 bg-slate-950/25 p-5 transition-colors hover:border-sky-400/25 hover:bg-sky-400/[0.04]"><div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-[0.12em] text-sky-300">{number}</span><Icon className="size-5 text-slate-600 transition-colors group-hover:text-sky-300" /></div><h3 className="mt-5 font-semibold text-slate-100">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><div className="mt-5 flex items-center gap-2 text-sm font-semibold text-sky-300">{action}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></div></Link>;
}

function RecentRun({ run }: { run: ComparisonRunDto }) {
  const total = run.schemaDifferenceCount + run.dataDifferenceCount + run.migrationDifferenceCount;
  return <Link href={`/runs?runId=${run.id}`} className="grid gap-3 rounded-xl border border-transparent bg-slate-950/25 p-3.5 transition-colors hover:border-slate-700 hover:bg-slate-800/45 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-200">{run.comparisonDefinitionName || `${run.sourceConnectionName} → ${run.targetConnectionName}`}</div><div className="mt-0.5 truncate text-[11px] text-slate-500">{run.sourceConnectionName} → {run.targetConnectionName}</div><div className="mt-1 text-[11px] text-slate-600">{formatDateTime(run.creationTime)}</div></div><div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500"><span className="truncate">{run.comparisonTypeName}</span><ArrowRight className="size-3 shrink-0" /><span className="truncate">{run.statusName}</span></div><div className="flex items-center justify-between gap-2 sm:justify-end"><StatusBadge code={run.statusCode} label={run.statusName} /><Badge variant={total ? "warning" : "success"}>{total ? `${total} fark` : "Uyumlu"}</Badge></div></Link>;
}
