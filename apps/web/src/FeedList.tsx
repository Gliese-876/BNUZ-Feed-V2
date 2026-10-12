import { memo } from "react";
import type { FeedItem } from "@bnuz-feed/contracts";

import { formatDate } from "./formatDate";
import { defaultChannelLabel, sourceCatalogById } from "./sourceCatalog";

export const FeedList = memo(function FeedList({ items }: { items: FeedItem[] }) {
  return (
    <div className="feed-list">
      {items.map((item) => {
        const source = sourceCatalogById[item.sourceId] ?? item.sourceIds.map((id) => sourceCatalogById[id]).find(Boolean);
        return (
          <article className="feed-card" key={item.id}>
            <a className="feed-card__link" href={item.url} rel="noopener noreferrer" target="_blank">
              <div className="feed-card__meta">
                <span className="feed-chip feed-chip--source">{source?.name ?? item.sourceId}</span>
                <span className="feed-chip">{item.channel?.trim() || defaultChannelLabel}</span>
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
