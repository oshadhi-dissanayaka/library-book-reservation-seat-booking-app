export type PickupDateOption = {
  value: string;
  label: string;
  day: string;
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

export const getPickupDateOptions = (): PickupDateOption[] =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return {
      value: dateKey(date),
      label: index === 0 ? "Today" : index === 1 ? "Tomorrow" : date.toLocaleDateString("en", { weekday: "short" }),
      day: date.toLocaleDateString("en", { day: "numeric", month: "short" }),
    };
  });

export const formatPickupDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export const formatPickupDateTime = (dateValue: string, timeValue?: string) => {
  const dateText = formatPickupDate(dateValue);
  if (!timeValue) return dateText;
  return `${dateText} • ${timeValue}`;
};

export const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};