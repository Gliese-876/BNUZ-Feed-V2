import { AggregationError, type AggregationErrorCode, type SourceHealthStatus } from "@bnuz-feed/contracts";

export interface ClassifiedSourceError {
  errorCode: AggregationErrorCode;
  message: string;
  status: SourceHealthStatus;
}

export function classifySourceError(error: unknown): ClassifiedSourceError {
  if (error instanceof AggregationError) {
    switch (error.code) {
      case "FETCH_TIMEOUT":
        return { errorCode: error.code, message: error.message, status: "timeout" };
      case "CORS_BLOCKED":
        return { errorCode: error.code, message: error.message, status: "cors" };
      case "PARSER_NOT_IMPLEMENTED":
        return { errorCode: error.code, message: error.message, status: "parser_not_implemented" };
      case "PARSER_FAILED":
        return { errorCode: error.code, message: error.message, status: "parser_error" };
      case "EMPTY_RESULT":
        return { errorCode: error.code, message: error.message, status: "empty" };
      default:
        return { errorCode: error.code, message: error.message, status: "network_error" };
    }
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      errorCode: "FETCH_TIMEOUT",
      message: error.message || "The request timed out.",
      status: "timeout",
    };
  }

  if (error instanceof Error) {
    return {
      errorCode: "FETCH_FAILED",
      message: error.message,
      status: "network_error",
    };
  }

  return {
    errorCode: "FETCH_FAILED",
    message: "Unknown refresh failure.",
    status: "network_error",
  };
}
