"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { checksApi, type ExecuteContractCheckDto, type GetContractCheckFindingsParams } from "@/api/checks.api";
import { queryKeys } from "@/api/query-keys";

const terminalStatuses = new Set(["completed", "failed", "partial"]);

export function isTerminalCheckStatus(status?: string | null) {
  return Boolean(status && terminalStatuses.has(status));
}

export function useChecksQuery(skipCount = 0, maxResultCount = 50) {
  return useQuery({
    queryFn: () => checksApi.list(skipCount, maxResultCount),
    queryKey: queryKeys.checks.list(skipCount, maxResultCount),
    refetchInterval: 5_000,
  });
}

export function useCheckStatusQuery(id?: string) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => checksApi.status(id ?? ""),
    queryKey: queryKeys.checks.status(id ?? ""),
    refetchInterval: (query) => isTerminalCheckStatus(query.state.data?.statusCode) ? false : 1_500,
  });
}

export function useCheckDetailQuery(id: string, enabled = true) {
  return useQuery({ enabled, queryFn: () => checksApi.detail(id), queryKey: queryKeys.checks.detail(id) });
}

export function useCheckReportQuery(id: string, enabled = true) {
  return useQuery({ enabled, queryFn: () => checksApi.report(id), queryKey: queryKeys.checks.report(id) });
}

export function useCheckFindingsQuery(id: string, params: GetContractCheckFindingsParams) {
  const filters = JSON.stringify(params);
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => checksApi.findings(id, params),
    queryKey: queryKeys.checks.findings(id, filters),
  });
}

export function useExecuteCheckMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExecuteContractCheckDto) => checksApi.execute(input),
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.checks.all });
      if (run.id) queryClient.setQueryData(queryKeys.checks.status(run.id), run);
    },
  });
}
