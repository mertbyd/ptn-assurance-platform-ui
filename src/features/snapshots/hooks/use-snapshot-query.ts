"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/api/query-keys";
import { snapshotsApi } from "@/api/snapshots.api";

export function useSnapshotQuery(id: string) {
  return useQuery({ enabled: Boolean(id), queryFn: () => snapshotsApi.get(id), queryKey: queryKeys.snapshots.detail(id) });
}
