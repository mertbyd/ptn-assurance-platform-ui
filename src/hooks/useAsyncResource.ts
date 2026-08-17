"use client";

import { useCallback, useEffect, useState } from "react";
import { extractUserMessage } from "@/lib/error-messages";

interface AsyncResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAsyncResource<T>(loader: () => Promise<T>, enabled = true): AsyncResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
    } catch (requestError) {
      setError(extractUserMessage(requestError, "Veri alınamadı."));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, loader]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    loader()
      .then((result) => {
        if (isActive) {
          setData(result);
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setError(extractUserMessage(requestError, "Veri alınamadı."));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [enabled, loader]);

  return { data, isLoading, error, reload };
}
