export const DATE_FORMAT = "MMM dd, yyyy";

export const formatDisplayDate = (date: Date | string | number) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
};
