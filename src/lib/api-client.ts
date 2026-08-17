import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

import type { components } from "@/api/generated/schema";

import { ApiRequestError, type ApiValidationError } from "./api-request-error";
import { notifyUnauthorized, readAuthSession, writeAuthSession } from "./auth-storage";

type ResultEnvelope<T> = components["schemas"]["SystemStandards.Results.Result"] & {
  value?: T;
};

type RemoteServiceErrorResponse = components["schemas"]["Volo.Abp.Http.RemoteServiceErrorResponse"];
type RemoteServiceValidationError = components["schemas"]["Volo.Abp.Http.RemoteServiceValidationErrorInfo"];

export const apiBaseUrl = process.env.NEXT_PUBLIC_TEST_MODULE_ORIGIN?.trim()
  || process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  || "https://localhost:44366";
export const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_ORIGIN?.trim() || "https://localhost:44323";
const fallbackErrorCode = "API_REQUEST_FAILED";
const networkErrorCode = "NETWORK_ERROR";
const resultErrorCode = "RESULT_ERROR";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isResultEnvelope<T>(value: unknown): value is ResultEnvelope<T> {
  return isRecord(value) && "isSuccess" in value;
}

function mapResultValidationErrors(
  errors: components["schemas"]["SystemStandards.Results.ValidationError"][] | null | undefined,
): ApiValidationError[] {
  return (errors ?? []).map((error) => ({
    code: error.errorCode || resultErrorCode,
    field: error.identifier || undefined,
  }));
}

function mapRemoteValidationErrors(errors: RemoteServiceValidationError[] | null | undefined): ApiValidationError[] {
  return (errors ?? []).map((error) => ({
    code: error.message || fallbackErrorCode,
    field: error.members?.[0] || undefined,
  }));
}

export function unwrapApiResult<T>(payload: ResultEnvelope<T> | T, status = 200): T {
  if (!isResultEnvelope<T>(payload)) {
    return payload;
  }

  if (payload.isSuccess) {
    return payload.value as T;
  }

  const validationErrors = mapResultValidationErrors(payload.validationErrors);
  const code = payload.errors?.[0] || validationErrors[0]?.code || resultErrorCode;

  throw new ApiRequestError({
    code,
    correlationId: payload.correlationId || undefined,
    status,
    validationErrors,
  });
}

export function mapRemoteServiceError(
  payload: RemoteServiceErrorResponse | unknown,
  status: number,
  correlationId?: string,
): ApiRequestError {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return new ApiRequestError({ code: fallbackErrorCode, correlationId, status });
  }

  const remoteError = payload.error as NonNullable<RemoteServiceErrorResponse["error"]>;
  const validationErrors = mapRemoteValidationErrors(remoteError.validationErrors);

  return new ApiRequestError({
    code: remoteError.code || validationErrors[0]?.code || fallbackErrorCode,
    correlationId,
    status,
    validationErrors,
  });
}

function getCorrelationId(headers: unknown): string | undefined {
  if (!isRecord(headers)) {
    return undefined;
  }

  const value = headers["x-correlation-id"] ?? headers["request-context"];
  return typeof value === "string" ? value : undefined;
}

function toApiRequestError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiRequestError({ code: fallbackErrorCode, status: 0 });
  }

  if (!error.response) {
    return new ApiRequestError({ code: networkErrorCode, status: 0 });
  }

  return mapRemoteServiceError(
    error.response.data,
    error.response.status,
    getCorrelationId(error.response.headers),
  );
}

const testModuleAxios = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
  timeout: 30_000,
});
const authAxios = axios.create({
  baseURL: authBaseUrl,
  headers: { Accept: "application/json" },
  timeout: 30_000,
});

function addSessionHeaders(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const session = readAuthSession();
  if (!session) {
    return config;
  }

  config.headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (session.tenantId) {
    config.headers.set("__tenant", session.tenantId);
  }

  return config;
}

testModuleAxios.interceptors.request.use(addSessionHeaders);
authAxios.interceptors.request.use(addSessionHeaders);

interface RefreshedToken {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn: number;
  userId: string;
  tenantId?: string | null;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const session = readAuthSession();
  if (!session?.refreshToken) return false;

  try {
    const response = await authAxios.post<ResultEnvelope<RefreshedToken>>(
      "/api/authenticator/auth/refresh",
      { refreshToken: session.refreshToken, tenantId: session.tenantId ?? null },
      { headers: { "x-skip-auth-refresh": "true" } },
    );
    const token = unwrapApiResult(response.data, response.status);
    writeAuthSession({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: Date.now() + token.expiresIn * 1_000,
      tenantId: token.tenantId ?? null,
      userId: token.userId,
    });
    return true;
  } catch {
    return false;
  }
}

async function request<T>(instance: AxiosInstance, config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await instance.request<ResultEnvelope<T> | T>(config);
    return unwrapApiResult(response.data, response.status);
  } catch (error) {
    const apiError = toApiRequestError(error);
    const mayRefresh = apiError.status === 401
      && config.headers?.["x-skip-auth-refresh"] !== "true"
      && Boolean(readAuthSession()?.refreshToken);
    if (mayRefresh) {
      refreshPromise ??= refreshSession().finally(() => { refreshPromise = null; });
      if (await refreshPromise) {
        return request<T>(instance, {
          ...config,
          headers: { ...config.headers, "x-skip-auth-refresh": "true" },
        });
      }
    }
    if (apiError.status === 401 && readAuthSession()) {
      notifyUnauthorized();
    }

    throw apiError;
  }
}

function createClient(instance: AxiosInstance) {
  return {
  delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>(instance, { ...config, method: "DELETE", url }),
  get: <T>(url: string, config?: AxiosRequestConfig) => request<T>(instance, { ...config, method: "GET", url }),
  post: <T, TBody = unknown>(url: string, data?: TBody, config?: AxiosRequestConfig) =>
    request<T>(instance, { ...config, data, method: "POST", url }),
  put: <T, TBody = unknown>(url: string, data: TBody, config?: AxiosRequestConfig) =>
    request<T>(instance, { ...config, data, method: "PUT", url }),
  };
}

export const apiClient = createClient(testModuleAxios);
export const authClient = createClient(authAxios);
export default apiClient;
