import { redirect } from "next/navigation";

export default async function SourceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ document?: string; snapshot?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const target = new URLSearchParams({ source: id });
  if (query.document) target.set("document", query.document);
  if (query.snapshot) target.set("snapshot", query.snapshot);
  redirect(`/contracts?${target.toString()}`);
}
