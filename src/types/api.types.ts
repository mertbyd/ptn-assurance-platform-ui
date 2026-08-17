export type Guid = string;

export interface ApiValidationError {
  identifier?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  severity?: number | null;
  message?: string | null;
  members?: string[] | null;
}

export interface ApiResult<T = unknown> {
  value?: T;
  isSuccess?: boolean;
  status?: number;
  errors?: string[] | null;
  validationErrors?: ApiValidationError[] | null;
  successMessage?: string | null;
  correlationId?: string | null;
  location?: string | null;
}

export interface AbpErrorEnvelope {
  error?: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    validationErrors?: ApiValidationError[] | null;
  };
}

export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export interface PagedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}
