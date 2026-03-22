import { describe, expect, it } from "vitest";

import { AggregationError } from "@bnuz-feed/contracts";

import { classifySourceError } from "./classifySourceError";

describe("classifySourceError", () => {
  it("maps parser-not-implemented errors to parser_not_implemented", () => {
    const result = classifySourceError(
      new AggregationError("PARSER_NOT_IMPLEMENTED", "Parser missing."),
    );

    expect(result.status).toBe("parser_not_implemented");
  });

  it("maps timeout errors to timeout", () => {
    const result = classifySourceError(new AggregationError("FETCH_TIMEOUT", "Timeout."));

    expect(result.status).toBe("timeout");
  });
});
