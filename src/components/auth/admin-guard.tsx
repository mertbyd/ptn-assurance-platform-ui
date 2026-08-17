"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { LoadingRows } from "@/components/shared/panel-state";
import { useCanWrite, useCurrentUser, useIsAdmin, useIsHostAdmin } from "@/hooks/useAuth";

// Admin ekranlari icin istemci tarafi rol koruması. Asil guvenlik backend'de (403);
// bu yalnizca yetkisiz kullaniciya erisimi gostermemek icindir.
export function AdminGuard({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const admin = useIsAdmin();

  // Bootstrap tamamlanana kadar kullanici null olabilir; kisa bir yukleme goster.
  if (!user) {
    return <LoadingRows />;
  }

  if (!admin) {
    return <AccessDenied message="Bu bölüm yalnızca Yönetici (Admin) rolündeki kullanıcılar içindir." />;
  }

  return <>{children}</>;
}

// Tenant kullanici/rol yonetimi host baglaminda calismaz. Host admin once tenant'i
// olusturur; uyeleri ilgili tenant'in kendi admini davet eder.
export function TenantAdminGuard({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const admin = useIsAdmin();

  if (!user) {
    return <LoadingRows />;
  }

  if (!admin || !user.tenantId) {
    return <AccessDenied message="Üye yönetimi yalnızca ilgili şirket (tenant) bağlamında giriş yapan Admin kullanıcılar içindir." />;
  }

  return <>{children}</>;
}

// Host (platform) yoneticisi koruması — tenant yonetimi ekranlari icin.
export function HostGuard({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const hostAdmin = useIsHostAdmin();

  if (!user) {
    return <LoadingRows />;
  }

  if (!hostAdmin) {
    return <AccessDenied message="Bu bölüm platform (host) yöneticileri içindir. Bir tenant hesabıyla giriş yaptınız; tenant oluşturma/yönetme yetkisi yalnızca host hesabındadır." />;
  }

  return <>{children}</>;
}

export function WriteGuard({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const writable = useCanWrite();

  if (!user) {
    return <LoadingRows />;
  }

  if (!writable) {
    return <AccessDenied message="Bu işlem Admin veya DatabaseUser rolü gerektirir. Salt okunur hesabınızla geçmiş plan ve raporları görüntüleyebilirsiniz." />;
  }

  return <>{children}</>;
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-300"><ShieldAlert className="size-6" /></div>
      <h1 className="mt-4 text-xl font-semibold text-slate-100">Bu sayfaya erişiminiz yok</h1>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
      <Button asChild variant="outline" className="mt-6"><Link href="/dashboard">Genel Bakış’a dön</Link></Button>
    </div>
  );
}
