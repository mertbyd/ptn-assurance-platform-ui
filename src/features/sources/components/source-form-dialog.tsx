"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import type { SpecSourceDto } from "@/api/sources.api";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { sourceSchema, type SourceFormValues } from "../source-schema";
import { useCreateSourceMutation, useUpdateSourceMutation } from "../hooks/use-source-queries";

/* ── design tokens ───────────────────────────────────────────────── */
const ACC = "#e84040";
const SURFACE = "#131620";
const BORDER  = "rgba(255,255,255,0.08)";
const SUBTLE  = "rgba(255,255,255,0.04)";

/* ── primitives ──────────────────────────────────────────────────── */

const GS = `
@keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
@keyframes dialogIn  { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
@keyframes spin      { to { transform:rotate(360deg); } }
`;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 12.5, fontWeight: 650, color: "rgba(255,255,255,0.65)", marginBottom: 6, display: "block" }}>
      {children}
    </span>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span style={{ fontSize: 11.5, color: "#f87171", marginTop: 4, display: "block" }}>{msg}</span>;
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <>
      <input
        {...props}
        style={{
          width: "100%",
          height: 36,
          padding: "0 12px",
          background: SUBTLE,
          border: `1px solid ${error ? "rgba(239,68,68,0.5)" : BORDER}`,
          borderRadius: 8,
          color: "#e0e4f0",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 130ms",
          ...props.style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.7)" : `${ACC}66`; if (props.onFocus) props.onFocus(e); }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : BORDER; if (props.onBlur) props.onBlur(e); }}
      />
      <FieldError msg={error} />
    </>
  );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          background: checked ? ACC : "rgba(255,255,255,0.12)",
          position: "relative",
          flexShrink: 0,
          transition: "background 160ms",
          cursor: "pointer",
        }}
      >
        <div style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 160ms",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }} />
      </div>
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>{label}</span>
    </label>
  );
}

/* ── defaults ─────────────────────────────────────────────────────── */

const emptyValues: SourceFormValues = {
  baseUrl: "",
  documents: [{ documentName: "", id: undefined, isActive: true, path: "" }],
  headerName: "",
  headerValue: "",
  name: "",
};

function valuesFromSource(source?: SpecSourceDto): SourceFormValues {
  if (!source) return emptyValues;
  return {
    baseUrl: source.baseUrl ?? "",
    documents: (source.documents ?? []).map((document) => ({
      documentName: document.documentName ?? "",
      id: document.id,
      isActive: document.isActive ?? true,
      path: document.path ?? "",
    })),
    headerName: "",
    headerValue: "",
    name: source.name ?? "",
  };
}

/* ═══════════════════════════════════════════════════════════════════
   SourceFormDialog
═══════════════════════════════════════════════════════════════════ */

export function SourceFormDialog({ onClose, open, source }: { onClose: () => void; open: boolean; source?: SpecSourceDto }) {
  const createMutation = useCreateSourceMutation();
  const updateMutation = useUpdateSourceMutation();
  const form = useForm<SourceFormValues>({ defaultValues: emptyValues, resolver: zodResolver(sourceSchema) });
  const documents = useFieldArray({ control: form.control, name: "documents" });
  const activeMutation = source ? updateMutation : createMutation;

  useEffect(() => {
    if (open) form.reset(valuesFromSource(source));
  }, [form, open, source]);

  const onSubmit = form.handleSubmit(async (values) => {
    activeMutation.reset();
    const input = {
      baseUrl: values.baseUrl,
      documents: values.documents.map((document) => ({ ...document, id: source ? document.id : undefined })),
      headerName: values.headerName || null,
      headerValue: values.headerValue || null,
      name: values.name,
    };
    try {
      if (source?.id) await updateMutation.mutateAsync({ id: source.id, input });
      else await createMutation.mutateAsync(input);
      onClose();
    } catch {
      /* error shown below */
    }
  });

  const requestError = activeMutation.error instanceof ApiRequestError ? activeMutation.error : null;

  if (!open) return null;

  return (
    <>
      <style>{GS}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 500,
          animation: "overlayIn 180ms ease both",
        }}
      />

      {/* Dialog */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 501,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        pointerEvents: "none",
      }}>
        <div
          style={{
            background: "#0f1118",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            width: "100%",
            maxWidth: 560,
            maxHeight: "calc(100dvh - 32px)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 32px 96px rgba(0,0,0,0.7)",
            animation: "dialogIn 200ms cubic-bezier(0.16,1,0.3,1) both",
            pointerEvents: "auto",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em" }}>
                {source ? t.sources.form.editTitle : t.sources.form.createTitle}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                all: "unset",
                cursor: "pointer",
                width: 28,
                height: 28,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.35)",
                transition: "background 130ms, color 130ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)";
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>
            <form id="source-form" noValidate onSubmit={onSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Error banner */}
                {requestError && (
                  <div style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "#f87171",
                  }}>
                    {getApiErrorMessage(requestError)}
                  </div>
                )}

                {/* Kaynak adı */}
                <div>
                  <Label>{t.sources.fields.name}</Label>
                  <Input
                    {...form.register("name")}
                    placeholder={t.sources.placeholders.name}
                    error={form.formState.errors.name?.message}
                  />
                </div>

                {/* Servis kök adresi */}
                <div>
                  <Label>{t.sources.fields.baseUrl}</Label>
                  <Input
                    {...form.register("baseUrl")}
                    type="url"
                    placeholder={t.sources.placeholders.baseUrl}
                    error={form.formState.errors.baseUrl?.message}
                  />
                </div>

                {/* Kimlik bilgileri */}
                <div style={{
                  background: SUBTLE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
                    {t.sources.form.credentialsTitle}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.55, marginBottom: 14 }}>
                    {source ? t.sources.form.credentialsEditHint : t.sources.form.credentialsHint}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <Label>{t.sources.fields.headerName}</Label>
                      <Input
                        {...form.register("headerName")}
                        autoComplete="off"
                        placeholder={t.sources.placeholders.headerName}
                        error={form.formState.errors.headerName?.message}
                      />
                    </div>
                    <div>
                      <Label>{t.sources.fields.headerValue}</Label>
                      <Input
                        {...form.register("headerValue")}
                        type="password"
                        autoComplete="new-password"
                        placeholder={t.sources.placeholders.headerValue}
                        error={form.formState.errors.headerValue?.message}
                      />
                    </div>
                  </div>
                </div>

                {/* Dokümanlar */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                        {t.sources.form.documentsTitle}
                      </div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                        {t.sources.form.documentsHint}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => documents.append({ documentName: "", isActive: true, path: "" })}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 10px",
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 600,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${BORDER}`,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      <Plus size={12} />
                      {t.sources.form.addDocument}
                    </button>
                  </div>

                  {form.formState.errors.documents?.root?.message && (
                    <div style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>
                      {form.formState.errors.documents.root.message}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {documents.fields.map((document, index) => (
                      <div
                        key={document.id}
                        style={{
                          border: `1px solid ${BORDER}`,
                          borderRadius: 10,
                          padding: "14px 16px",
                          background: SURFACE,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                            {t.sources.form.documentLabel(index + 1)}
                          </span>
                          <button
                            type="button"
                            aria-label={t.sources.form.removeDocument}
                            disabled={documents.fields.length === 1}
                            onClick={() => documents.remove(index)}
                            style={{
                              all: "unset",
                              cursor: documents.fields.length === 1 ? "not-allowed" : "pointer",
                              opacity: documents.fields.length === 1 ? 0.3 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              color: "#f87171",
                              transition: "background 120ms",
                            }}
                            onMouseEnter={(e) => {
                              if (documents.fields.length > 1)
                                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                            }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <Label>{t.sources.fields.documentName}</Label>
                            <Input
                              {...form.register(`documents.${index}.documentName`)}
                              placeholder={t.sources.placeholders.documentName}
                              error={form.formState.errors.documents?.[index]?.documentName?.message}
                            />
                          </div>
                          <div>
                            <Label>{t.sources.fields.path}</Label>
                            <Input
                              {...form.register(`documents.${index}.path`)}
                              placeholder={t.sources.placeholders.path}
                              error={form.formState.errors.documents?.[index]?.path?.message}
                            />
                          </div>
                          <Controller
                            control={form.control}
                            name={`documents.${index}.isActive`}
                            render={({ field }) => (
                              <ToggleSwitch
                                checked={field.value}
                                onChange={field.onChange}
                                label={t.sources.fields.documentActive}
                              />
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </form>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            padding: "14px 22px 18px",
            borderTop: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "0 16px",
                height: 34,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 580,
                color: "rgba(255,255,255,0.45)",
                border: `1px solid ${BORDER}`,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {t.sources.form.cancel}
            </button>
            <button
              type="submit"
              form="source-form"
              disabled={activeMutation.isPending}
              style={{
                all: "unset",
                cursor: activeMutation.isPending ? "not-allowed" : "pointer",
                padding: "0 18px",
                height: 34,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: ACC,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                opacity: activeMutation.isPending ? 0.65 : 1,
                boxShadow: `0 2px 12px ${ACC}44`,
              }}
            >
              {activeMutation.isPending
                ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
                : <Save size={13} />}
              {t.sources.form.save}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
