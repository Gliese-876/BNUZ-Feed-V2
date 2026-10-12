import { memo } from "react";
import type { FeedItem } from "@bnuz-feed/contracts";
import { getRawOccurrences } from "@bnuz-feed/core";

import { formatDate } from "./formatDate";
import { buildChannelKey, defaultChannelLabel, sourceCatalogById } from "./sourceCatalog";

export const FeedList = memo(function FeedList({ items, selectedChannelSet }: {
  items: FeedItem[];
  selectedChannelSet: ReadonlySet<string>;
}) {
  return (
    <div className="feed-list">
      {items.map((item) => {
        const occurrences = getRawOccurrences(item);
        const selected = (occurrence: typeof occurrences[number]) =>
          selectedChannelSet.has(buildChannelKey(occurrence.sourceId, occurrence.channel ?? defaultChannelLabel));
        const occurrence = occurrences.find((entry) => entry.sourceId === item.sourceId && selected(entry))
          ?? occurrences.find(selected);
        const sourceId = occurrence?.sourceId ?? item.sourceId;
        const source = sourceCatalogById[sourceId] ?? item.sourceIds.map((id) => sourceCatalogById[id]).find(Boolean);
        const channel = (occurrence ? occurrence.channel : item.channel)?.trim() || defaultChannelLabel;
        return (
          <article className="feed-card" key={item.id}>
            <a className="feed-card__link" href={item.url} rel="noopener noreferrer" target="_blank">
              <div className="feed-card__meta">
                <span className="feed-chip feed-chip--source">{source?.name ?? sourceId}</span>
                <span className="feed-chip">{channel}</span>
                <time className="feed-card__date" dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
              </div>
              <h3>{item.title}</h3>
              {item.summary ? <p>{item.summary}</p> : null}
              <div className="feed-card__footer"><span>更新于 {formatDate(item.fetchedAt, true)}</span><span className="feed-card__read">阅读原文 <span aria-hidden="true">↗</span></span></div>
            </a>
          </article>
        );
      })}
    </div>
  );
});
