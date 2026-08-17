import { Flex, Text } from "@chakra-ui/react";

type Variant = "success" | "danger" | "warning" | "info" | "neutral" | "accent";

const variantStyles: Record<Variant, { bg: string; color: string }> = {
  success: { bg: "state.successSoft", color: "state.success" },
  danger:  { bg: "state.dangerSoft",  color: "state.danger"  },
  warning: { bg: "state.warningSoft", color: "state.warning" },
  info:    { bg: "state.infoSoft",    color: "state.info"    },
  neutral: { bg: "app.muted",         color: "ink.muted"     },
  accent:  { bg: "accent.soft",       color: "accent.solid"  },
};

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  dot?: boolean;
}

export function StatusBadge({ label, variant = "neutral", dot = false }: StatusBadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <Flex
      align="center"
      bg={bg}
      borderRadius="full"
      color={color}
      display="inline-flex"
      fontSize="11px"
      fontWeight="650"
      gap="1.5"
      h="6"
      letterSpacing="0.01em"
      px="2.5"
    >
      {dot && (
        <Flex
          bg={color}
          borderRadius="full"
          flexShrink={0}
          h="5px"
          w="5px"
        />
      )}
      <Text>{label}</Text>
    </Flex>
  );
}

// Önceden tanımlı severity badge'leri
export function SeverityBadge({ code }: { code: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    Breaking:    { label: "Kırıcı",    variant: "danger"  },
    NonBreaking: { label: "Değişim",   variant: "warning" },
    Warning:     { label: "Uyarı",     variant: "info"    },
    DocsOnly:    { label: "Docs",      variant: "neutral" },
  };
  const cfg = map[code] ?? { label: code, variant: "neutral" as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} />;
}

export function ChangeStateBadge({ code }: { code: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    New:      { label: "Yeni",     variant: "accent"  },
    Known:    { label: "Bilinen",  variant: "neutral" },
    Resolved: { label: "Çözüldü", variant: "success" },
  };
  const cfg = map[code] ?? { label: code, variant: "neutral" as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} />;
}

export function RunStatusBadge({ code }: { code: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    Pending:   { label: "Bekliyor",  variant: "neutral" },
    Running:   { label: "Çalışıyor", variant: "accent"  },
    Completed: { label: "Tamamlandı",variant: "success" },
    Cancelled: { label: "İptal",     variant: "neutral" },
    Aborted:   { label: "Durduruldu",variant: "danger"  },
    TimedOut:  { label: "Zaman Aşımı",variant:"danger"  },
  };
  const cfg = map[code] ?? { label: code, variant: "neutral" as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} dot={code === "Running"} />;
}

export function OutcomeBadge({ code }: { code: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    Passed:      { label: "Geçti",    variant: "success" },
    Failed:      { label: "Kaldı",    variant: "danger"  },
    Broken:      { label: "Bozuk",    variant: "danger"  },
    Skipped:     { label: "Atlandı",  variant: "neutral" },
    Inconclusive:{ label: "Belirsiz", variant: "warning" },
  };
  const cfg = map[code] ?? { label: code, variant: "neutral" as Variant };
  return <StatusBadge label={cfg.label} variant={cfg.variant} />;
}
