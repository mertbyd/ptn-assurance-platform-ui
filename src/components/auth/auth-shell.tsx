import type { ReactNode } from "react";
import Image from "next/image";
import { Database, GitCompareArrows, ShieldCheck, type LucideIcon } from "lucide-react";

interface AuthShellProps {
  children: ReactNode;
}

// Login / register / email dogrulama sayfalarinin ortak split-screen cercevesi.
export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="hidden border-r border-slate-800 bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="flex items-center gap-3">
          <Image className="rounded-xl" src="/database-checker-logo.svg" alt="Database Checker" width={46} height={46} />
          <div>
            <div className="font-semibold text-slate-100">Database Checker</div>
            <div className="text-xs text-slate-500">Kurumsal karşılaştırma platformu</div>
          </div>
        </div>
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">Veritabanı güveni</div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] text-slate-100 xl:text-5xl">Farkları bulun.<br />Ne anlama geldiğini anlayın.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">PostgreSQL ve SQL Server yapılarını, migration geçmişini ve veriyi karşılaştırın. Teknik sonuçları ekiplerin kullanabileceği anlaşılır raporlara dönüştürün.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <AuthFeature icon={Database} text="Canlı şema taraması" />
            <AuthFeature icon={GitCompareArrows} text="Yön bilgili farklar" />
            <AuthFeature icon={ShieldCheck} text="Güvenli kimlik bilgisi" />
          </div>
        </div>
        <div className="text-xs text-slate-600">Database Checker · Güvenli yönetim çalışma alanı</div>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-8">{children}</section>
    </main>
  );
}

function AuthFeature({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3">
      <Icon className="size-4 text-sky-300" />
      <div className="mt-2 text-xs font-medium text-slate-300">{text}</div>
    </div>
  );
}
