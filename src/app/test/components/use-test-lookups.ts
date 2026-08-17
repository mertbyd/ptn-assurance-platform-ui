"use client";

import { useQuery } from "@tanstack/react-query";

import { testApi } from "@/api/test";

/* Kapalı sözlüklerin ekran dili TEK yerden gelir.
 *
 * Kural (CURRENT-0007 §4): "UI veritabanı satırlarını gösterir — yerelleştirilmiş
 * `name`/`description` oradadır — kod sabitlerini yalnız dallanma mantığında kullanır."
 * Ekranların ham kod ya da GUID basması bu kuralın ihlalidir; rozetin rengi koddan,
 * YAZISI lookup satırından gelir.
 *
 * Beş aile salt-okunurdur ve tenant ömrü boyunca değişmez; bu yüzden tek sorguda alınır
 * ve süresiz taze sayılır. */
export interface TestLookupLabels {
  isLoading: boolean;
  /** Kimlikten ada — `stateId` gibi GUID taşıyan alanlar için. */
  nameById: (id: string | null | undefined) => string | null;
  /** Koddan ada — `runStatusCode`, `triggerKindCode`, `outcomeCode` için. */
  nameByCode: (code: string | null | undefined) => string | null;
}

export function useTestLookups(): TestLookupLabels {
  const query = useQuery({
    queryKey: ["test-lookups", "all"],
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const [states, runStatuses, outcomes, triggers, failures] = await Promise.all([
        testApi.lookups.scenarioStates(),
        testApi.lookups.runStatuses(),
        testApi.lookups.outcomeStatuses(),
        testApi.lookups.triggerKinds(),
        testApi.lookups.failureCategories(),
      ]);
      const rows = [...states.items, ...runStatuses.items, ...outcomes.items, ...triggers.items, ...failures.items];
      return {
        byId: new Map(rows.map((row) => [row.id, row.name])),
        /* Kod ailesi genelinde benzersizdir; çakışma olursa ilk satır kazanır ve ekran
         * yine bir ad gösterir — ham kod göstermekten her hâlükârda iyidir. */
        byCode: new Map(rows.map((row) => [row.code, row.name] as const).reverse()),
      };
    },
  });

  return {
    isLoading: query.isLoading,
    nameById: (id) => (id ? query.data?.byId.get(id) ?? null : null),
    nameByCode: (code) => (code ? query.data?.byCode.get(code) ?? null : null),
  };
}
