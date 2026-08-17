import { ContractExplorerView } from "@/features/sources";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ document?: string; snapshot?: string; source?: string }>;
}) {
  const query = await searchParams;
  return (
    <ContractExplorerView
      initialDocumentId={query.document}
      initialSnapshotId={query.snapshot}
      initialSourceId={query.source}
    />
  );
}
