import { AlertCircle } from "lucide-react";
import { Skeleton } from "@chakra-ui/react";

export function LoadingRows() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 12,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: 20
    }}>
      <Skeleton style={{ height: 56, width: "100%", borderRadius: 12, opacity: 0.1 }} />
      <Skeleton style={{ height: 56, width: "100%", borderRadius: 12, opacity: 0.1 }} />
      <Skeleton style={{ height: 56, width: "100%", borderRadius: 12, opacity: 0.1 }} />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      background: "rgba(232,64,64,0.07)",
      border: "1px solid rgba(232,64,64,0.15)",
      borderRadius: 14,
      padding: 16,
      fontSize: 14,
      color: "#f87171"
    }}>
      <AlertCircle size={18} style={{ marginTop: 2 }} />
      <span>{message}</span>
    </div>
  );
}
