import { Field, Input, Textarea } from "@chakra-ui/react";
import type { UseFormRegisterReturn } from "react-hook-form";

const surfaceProps = {
  bg: "app.muted",
  borderColor: "transparent",
  borderRadius: "control",
  _focusVisible: { bg: "app.surface", borderColor: "accent.focus" },
} as const;

export function FormTextField({
  error,
  helperText,
  label,
  multiline = false,
  placeholder,
  registration,
  autoComplete,
  type = "text",
}: {
  autoComplete?: string;
  error?: string;
  helperText?: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  type?: "email" | "number" | "password" | "text" | "url";
}) {
  return (
    <Field.Root invalid={Boolean(error)}>
      <Field.Label color="ink.body" fontSize="sm" fontWeight="650">{label}</Field.Label>
      {multiline ? (
        <Textarea fontFamily="mono" fontSize="xs" minH="180px" placeholder={placeholder} {...surfaceProps} {...registration} />
      ) : (
        <Input autoComplete={autoComplete} placeholder={placeholder} type={type} {...surfaceProps} {...registration} />
      )}
      {helperText && !error && <Field.HelperText>{helperText}</Field.HelperText>}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
}
