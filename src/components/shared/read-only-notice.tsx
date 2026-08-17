"use client";

import { Eye } from "lucide-react";
import { useIsReadOnly } from "@/hooks/useAuth";

// Salt okunur (ReadOnly) rolundeki kullaniciya, degisiklik yapamayacagini belirten
// bilgilendirme. Backend (KBP-49) yetkiyi zaten 403 ile korur; bu yalnizca UX.
export function ReadOnlyNotice({ message }: { message?: string }) {
  const readOnly = useIsReadOnly();

  if (!readOnly) {
    return null;
  }

  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3.5 text-sm text-amber-100">
      <Eye className="mt-0.5 size-4 shrink-0" />
      {message ?? "Salt okunur erişiminiz var. İçeriği görüntüleyebilir ancak değişiklik yapamazsınız."}
    </div>
  );
}
