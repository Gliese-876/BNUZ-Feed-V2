const dateFormatter = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: string | undefined, includeTime = false): string {
  if (!value) return includeTime ? "暂无更新记录" : "未标注日期";
  const monthDay = /^(?:--)?(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])$/.exec(value.trim());
  if (monthDay) return `${Number(monthDay[1])}月${Number(monthDay[2])}日（年份未标注）`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return (includeTime ? dateTimeFormatter : dateFormatter).format(date);
}
