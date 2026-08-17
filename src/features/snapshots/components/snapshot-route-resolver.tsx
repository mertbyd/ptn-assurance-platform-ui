"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { queryKeys } from "@/api/query-keys";
import { sourcesApi } from "@/api/sources.api";
import { LoadingState } from "@/components/ui/screen-state";
import { useSnapshotQuery } from "../hooks/use-snapshot-query";
import { SnapshotDetailView } from "./snapshot-detail-view";

export function SnapshotRouteResolver({ id }: { id: string }) {
  const router = useRouter();
  const snapshotQuery = useSnapshotQuery(id);
  const sourcesQuery = useQuery({ queryFn: () => sourcesApi.list(0, 1000), queryKey: queryKeys.sources.list(0, 1000) });
  const documentId = snapshotQuery.data?.specDocumentId;
  const source = sourcesQuery.data?.items?.find((item) => item.documents?.some((document) => document.id === documentId));

  useEffect(() => {
    if (!source?.id || !documentId) return;
    router.replace(`/api-contract/contracts?source=${source.id}&document=${documentId}&snapshot=${id}`);
  }, [documentId, id, router, source?.id]);

  if (snapshotQuery.isPending || sourcesQuery.isPending || source?.id) {
    return <LoadingState />;
  }

  return <SnapshotDetailView id={id} />;
}
