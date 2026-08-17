export interface ApiValidationError {
  code: string;
  field?: string;
}

interface ApiRequestErrorOptions {
  code: string;
  status: number;
  validationErrors?: ApiValidationError[];
  correlationId?: string;
}

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly validationErrors: ApiValidationError[];
  readonly correlationId?: string;

  constructor({ code, status, validationErrors = [], correlationId }: ApiRequestErrorOptions) {
    super(code);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.validationErrors = validationErrors;
    this.correlationId = correlationId;
  }
}
