export type CalendarEventKind = "scheduled" | "completed";
export type CalendarFilter = "all" | CalendarEventKind;

export type CalendarEvent = {
  id: string;
  workoutId: string;
  workoutName: string;
  category?: string | null;
  dateKey: string; // "YYYY-MM-DD" in the device's local time
  kind: CalendarEventKind;
  durationSeconds?: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getMonthGrid = (month: Date) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  return Array.from(
    { length: totalCells },
    (_, index) => new Date(year, monthIndex, index - offset + 1)
  );
};

// Covers every visible cell, including leading/trailing days.
export const getGridRange = (month: Date) => {
  const cells = getMonthGrid(month);
  const first = cells[0] ?? month;
  const last = cells[cells.length - 1] ?? first;

  const from = new Date(first);
  from.setHours(0, 0, 0, 0);

  const to = new Date(last);
  to.setHours(23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
};
