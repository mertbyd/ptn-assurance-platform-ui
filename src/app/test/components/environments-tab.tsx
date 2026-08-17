"use client";

import { Boxes, RotateCcw, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { testApi, type TestEnvironmentBindingDto } from "@/api/test";
import { extractUserMessage } from "@/lib/error-messages";
import { Btn, Card, CardHead, Empty, Loading } from "./primitives";

const BORDER = "rgba(255,255,255,0.08)";
const FIELD = { width: "100%", height: 32, padding: "0 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 7, color: "#e0e4f0", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label style={{ display: "grid", gap: 5 }}>
    <span style={{ color: "rgba(255,255,255,.62)", fontSize: 11.5, fontWeight: 650 }}>{label}</span>
    {children}
    {hint ? <small style={{ color: "rgba(255,255,255,.26)", fontSize: 10.5 }}>{hint}</small> : null}
  </label>;
}

interface EnvironmentForm {
  environmentKey: string;
  baseUrl: string;
  specSnapshotId: string;
  dbConnectionId: string;
  secretRef: string;
  apiSecretRef: string;
}

const emptyForm: EnvironmentForm = { environmentKey: "", baseUrl: "", specSnapshotId: "", dbConnectionId: "", secretRef: "", apiSecretRef: "" };

/* Ekran 23 — Ortam bağlama (CURRENT-0007 §3, P0).
 *
 * > [!IMPORTANT] Bu formda parola alanı YOKTUR ve olamaz.
 * `TestEnvironmentBindingDto` sır DEĞERİ taşımaz; yalnız Vault referans anahtarı taşır
 * (KBP-112). Sır, koşum anında sunucu tarafında çözülüp runner'a tek ortam değişkeni
 * olarak geçer. Ekranın sır alması, sırrı tarayıcıdan geçirmek olurdu — G-08 bunu yasaklar. */
export function TabEnvironments() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EnvironmentForm>(emptyForm);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["test-environments"], queryFn: () => testApi.environments.list() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["test-environments"] });

  const saveMutation = useMutation({
    mutationFn: async (values: EnvironmentForm) => {
      const payload = {
        environmentKey: values.environmentKey.trim(),
        baseUrl: values.baseUrl.trim(),
        specSnapshotId: values.specSnapshotId.trim(),
        dbConnectionId: values.dbConnectionId.trim(),
        secretRef: values.secretRef.trim(),
        apiSecretRef: values.apiSecretRef.trim(),
      };
      if (editingKey) {
        /* Güncellemede anahtar gövdede taşınmaz; rota parametresidir (`UpdateTestEnvironmentBindingDto`
         * zaten `Omit<…, "environmentKey">`). */
        return testApi.environments.update(editingKey, {
          baseUrl: payload.baseUrl,
          specSnapshotId: payload.specSnapshotId,
          dbConnectionId: payload.dbConnectionId,
          secretRef: payload.secretRef,
          apiSecretRef: payload.apiSecretRef,
        });
      }
      return testApi.environments.create(payload);
    },
    onSuccess: async () => { setForm(emptyForm); setEditingKey(null); setError(null); await invalidate(); },
    onError: (mutationError) => setError(extractUserMessage(mutationError, "Ortam kaydedilemedi.")),
  });

  const removeMutation = useMutation({
    mutationFn: (key: string) => testApi.environments.remove(key),
    onSuccess: invalidate,
    onError: (mutationError) => setError(extractUserMessage(mutationError, "Ortam kaldırılamadı.")),
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => testApi.environments.resetSandbox(key),
    onError: (mutationError) => setError(extractUserMessage(mutationError, "Sandbox sıfırlanamadı.")),
  });

  const environments = query.data ?? [];
  const canSave = Boolean(form.environmentKey.trim() && form.baseUrl.trim() && form.specSnapshotId.trim() && form.dbConnectionId.trim() && form.secretRef.trim() && form.apiSecretRef.trim());

  function startEdit(environment: TestEnvironmentBindingDto) {
    setEditingKey(environment.environmentKey);
    /* Sır referansları cevapta gelmez; düzenlemede yeniden girilir. Boş bırakılamaz —
     * sunucu ikisini de zorunlu tutar. */
    setForm({ ...environment, secretRef: "", apiSecretRef: "" });
    setError(null);
  }

  return (
    <div style={{ padding: "28px 32px", display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Ortamlar</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>Koşumun hangi adrese, hangi sözleşmeye ve hangi veritabanına bağlanacağını tanımlar.</p>
      </div>

      {error ? <div style={{ padding: "9px 11px", border: "1px solid #f87171", borderLeftWidth: 3, borderRadius: 8, background: "rgba(248,113,113,.10)", color: "#fca5a5", fontSize: 11.5 }}>{error}</div> : null}

      <Card>
        <CardHead title={editingKey ? `Ortamı düzenle · ${editingKey}` : "Yeni ortam bağla"} right={editingKey ? <Btn label="Vazgeç" small onClick={() => { setEditingKey(null); setForm(emptyForm); }} /> : undefined} />
        <div style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
            <Field label="Ortam anahtarı" hint={editingKey ? "Anahtar değiştirilemez." : "Örn. staging"}>
              <input value={form.environmentKey} disabled={Boolean(editingKey)} onChange={(e) => setForm((v) => ({ ...v, environmentKey: e.target.value }))} style={FIELD} />
            </Field>
            <Field label="Taban adres" hint="Koşumun HTTP adımlarını göndereceği kök">
              <input value={form.baseUrl} onChange={(e) => setForm((v) => ({ ...v, baseUrl: e.target.value }))} placeholder="https://staging.example.com" style={FIELD} />
            </Field>
            <Field label="Spec snapshot kimliği" hint="Koşumun uyacağı donmuş sözleşme">
              <input value={form.specSnapshotId} onChange={(e) => setForm((v) => ({ ...v, specSnapshotId: e.target.value }))} style={FIELD} />
            </Field>
            <Field label="Veritabanı bağlantı kimliği" hint="Kalıcılık doğrulamasının koşacağı bağlantı">
              <input value={form.dbConnectionId} onChange={(e) => setForm((v) => ({ ...v, dbConnectionId: e.target.value }))} style={FIELD} />
            </Field>
            <Field label="Veritabanı sır referansı" hint="Vault anahtarı — parolanın kendisi DEĞİL">
              <input value={form.secretRef} onChange={(e) => setForm((v) => ({ ...v, secretRef: e.target.value }))} placeholder="vault://db/staging" style={FIELD} />
            </Field>
            <Field label="API sır referansı" hint="Vault anahtarı — token/parola buraya yazılmaz">
              <input value={form.apiSecretRef} onChange={(e) => setForm((v) => ({ ...v, apiSecretRef: e.target.value }))} placeholder="vault://api/staging" style={FIELD} />
            </Field>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Btn label={editingKey ? "Değişikliği kaydet" : "Ortamı bağla"} icon={Save} variant="primary" disabled={!canSave} loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)} />
            <span style={{ color: "rgba(255,255,255,0.26)", fontSize: 11 }}>Sır değerleri hiçbir zaman tarayıcıdan geçmez; yalnız Vault referansı saklanır.</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead title={`Bağlı ortamlar${environments.length ? ` · ${environments.length}` : ""}`} />
        {query.isLoading ? <Loading /> : query.isError ? (
          <Empty icon={Boxes} title="Ortamlar okunamadı" hint="Test modülü bağlantısını kontrol edin." />
        ) : environments.length === 0 ? (
          <Empty icon={Boxes} title="Bağlı ortam yok" hint="Koşum tetiklemeden önce en az bir ortam bağlanmalıdır." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                {["Anahtar", "Taban adres", "Snapshot", "Bağlantı", ""].map((head) => (
                  <th key={head} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {environments.map((environment) => (
                <tr key={environment.environmentKey} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <td style={{ padding: "10px 16px" }}><code style={{ color: "#f0a020", fontSize: 12 }}>{environment.environmentKey}</code></td>
                  <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.55)", fontSize: 11.5 }}>{environment.baseUrl}</td>
                  <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.35)", fontSize: 11 }}><code>{environment.specSnapshotId.slice(0, 8)}</code></td>
                  <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.35)", fontSize: 11 }}><code>{environment.dbConnectionId.slice(0, 8)}</code></td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Btn label="Düzenle" small onClick={() => startEdit(environment)} />
                      <Btn label="Sandbox sıfırla" icon={RotateCcw} small loading={resetMutation.isPending && resetMutation.variables === environment.environmentKey} onClick={() => resetMutation.mutate(environment.environmentKey)} />
                      <Btn label="Kaldır" icon={Trash2} variant="danger-dim" small loading={removeMutation.isPending && removeMutation.variables === environment.environmentKey} onClick={() => removeMutation.mutate(environment.environmentKey)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
