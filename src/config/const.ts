export const MONTHS_NUM: Record<string, string> = {
  JANUARY: "01",
  FEBRUARY: "02",
  MARCH: "03",
  APRIL: "04",
  MAY: "05",
  JUNE: "06",
  JULY: "07",
  AUGUST: "08",
  SEPTEMBER: "09",
  OCTOBER: "10",
  NOVEMBER: "11",
  DECEMBER: "12",
};

export const MONTHS_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(MONTHS_NUM).map(([name, number]) => [number, name]),
);
