import { AuthGuard } from "@/components/auth/auth-guard";

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthGuard>{children}</AuthGuard>;
}
