import type { AxiosError } from "axios";

import type { ApiError, ErrorParser } from "./types";

// =====================================================================
// BUILT-IN PARSERS (core — extensible via addErrorParser)
// =====================================================================

/**
 * Django Ninja / Pydantic (422 Unprocessable Entity)
 * Format: { detail: [{ loc: ["body", "field"], msg: "...", type: "..." }] }
 */
const djangoNinjaParser: ErrorParser = (status, data: any) => {
  if (status !== 422) return null;

  const source = data?.errors || data?.detail;
  if (!Array.isArray(source)) return null;

  const fieldErrors: Record<string, string> = {};
  const messages = source.map((err: any) => {
    const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : "";
    const msg = err.msg || err.message || "";

    if (field && field !== "body" && field !== "data") {
      fieldErrors[field] = msg;
      return `${field}: ${msg}`;
    }
    return msg;
  });

  return {
    message: messages.join("; "),
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    status,
  };
};

/**
 * Django REST Framework (400 Bad Request)
 * Format: { field_name: ["error1", "error2"], non_field_errors: ["..."] }
 */
const djangoRestParser: ErrorParser = (status, data: any) => {
  if (status !== 400 || typeof data !== "object" || data === null) return null;
  if (data.message || data.detail || data.error) return null;

  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      const msg = value.join(", ");
      if (key === "non_field_errors") {
        messages.push(msg);
      } else {
        fieldErrors[key] = msg;
        messages.push(`${key}: ${msg}`);
      }
    }
  }

  if (messages.length === 0) return null;

  return {
    message: messages.join("; "),
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    status,
  };
};

/**
 * Generic REST fallback
 * Format: { message: "..." } or { detail: "..." } or { error: "..." }
 */
const genericRestParser: ErrorParser = (_status, data: any) => {
  const msg =
    data?.errors?.message || data?.message || data?.detail || data?.error;
  if (typeof msg === "string") {
    return { message: msg, status: _status };
  }
  return null;
};

// =====================================================================
// PARSER CHAIN
// =====================================================================

const parsers: ErrorParser[] = [
  djangoNinjaParser,
  djangoRestParser,
  genericRestParser,
];

/**
 * Add a custom error parser to the chain.
 * Custom parsers are added to the FRONT of the chain (highest priority).
 *
 * @example
 * // In your project-specific setup:
 * addErrorParser((status, data: any) => {
 *   if (data?.code === "STRIPE_ERROR") {
 *     return { message: data.decline_message, status };
 *   }
 *   return null;
 * });
 */
export function addErrorParser(parser: ErrorParser) {
  parsers.unshift(parser);
}

// =====================================================================
// MAIN HANDLER
// =====================================================================

const DEFAULT_MESSAGES = {
  network: "Could not connect to the server. Please check your connection.",
  unknown: "An unexpected error occurred.",
  fallback: "An error occurred while processing the request.",
};

/**
 * Processes any error (typically Axios) into a standardized ApiError.
 * Runs through the parser chain — first match wins.
 */
export function handleApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<unknown>;

  // No response at all (network error)
  if (!axiosError.response) {
    if (axiosError.request) {
      return { message: DEFAULT_MESSAGES.network, raw: error };
    }
    return {
      message: (axiosError as any)?.message || DEFAULT_MESSAGES.unknown,
      raw: error,
    };
  }

  const { status, data } = axiosError.response;

  // Run parser chain
  for (const parser of parsers) {
    const result = parser(status, data);
    if (result) {
      return { ...result, raw: error };
    }
  }

  // Nothing matched
  return {
    message: DEFAULT_MESSAGES.fallback,
    status,
    raw: error,
  };
}

/**
 * Convenience: always returns a string message.
 */
export function getErrorMessage(error: unknown): string {
  return handleApiError(error).message;
}
