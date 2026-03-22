import { AggregationError, type Parser, type RawPage, type SourceRecord } from "@bnuz-feed/contracts";

export class PlaceholderParser implements Parser {
  readonly parserKey: string;

  constructor(parserKey: string) {
    this.parserKey = parserKey;
  }

  async parse(_page: RawPage): Promise<SourceRecord[]> {
    throw new AggregationError(
      "PARSER_NOT_IMPLEMENTED",
      `Parser "${this.parserKey}" has not been implemented.`,
      { parserKey: this.parserKey },
    );
  }
}
