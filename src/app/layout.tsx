import type { Metadata } from "next";
import { Provider } from "@/components/ui/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PTN Assurance", template: "%s — PTN Assurance" },
  description: "API contracts, database state and scenario validation for modern development teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
