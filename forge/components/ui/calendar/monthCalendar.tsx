import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import {
  getMonthGrid,
  toDateKey,
  type CalendarEvent,
  type CalendarFilter,
} from "./calendarUtils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const FILTERS: { label: string; value: CalendarFilter }[] = [
  { label: "All", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
];

type Props = {
  events: CalendarEvent[];
  month: Date;
  selectedDate: string;
  filter: CalendarFilter;
  onChangeMonth: (next: Date) => void;
  onSelectDate: (dateKey: string) => void;
  onChangeFilter: (filter: CalendarFilter) => void;
  onToday: () => void;
};

export default function MonthCalendar({
  events,
  month,
  selectedDate,
  filter,
  onChangeMonth,
  onSelectDate,
  onChangeFilter,
  onToday,
}: Props) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const todayKey = toDateKey(new Date());

  const weeks = useMemo(() => {
    const cells = getMonthGrid(month);
    const rows: Date[][] = [];

    for (let index = 0; index < cells.length; index += 7) {
      rows.push(cells.slice(index, index + 7));
    }

    return rows;
  }, [month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};

    for (const event of events) {
      const list = map[event.dateKey] ?? [];
      list.push(event);
      map[event.dateKey] = list;
    }

    return map;
  }, [events]);

  return (
    <View>
      {/* month navigation */}
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => onChangeMonth(new Date(year, monthIndex - 1, 1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="h-9 w-9 items-center justify-center rounded-full bg-muted/10"
        >
          <Feather name="chevron-left" size={18} color="#C7C8BF" />
        </Pressable>

        <Pressable
          onPress={onToday}
          accessibilityRole="button"
          accessibilityLabel="Go to today"
          className="items-center"
        >
          <Text className="text-base font-semibold text-white">
            {MONTHS[monthIndex] ?? ""} {year}
          </Text>
          <Text className="text-[11px] text-muted-2">Tap for today</Text>
        </Pressable>

        <Pressable
          onPress={() => onChangeMonth(new Date(year, monthIndex + 1, 1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="h-9 w-9 items-center justify-center rounded-full bg-muted/10"
        >
          <Feather name="chevron-right" size={18} color="#C7C8BF" />
        </Pressable>
      </View>

      {/* filters */}
      <View className="mb-4 flex-row gap-2">
        {FILTERS.map((option) => {
          const active = filter === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChangeFilter(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`flex-1 items-center justify-center rounded-full py-2 ${
                active ? "bg-primary" : "bg-muted/10"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-black" : "text-muted-2"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* weekday header */}
      <View className="mb-2 flex-row gap-1.5">
        {WEEKDAYS.map((day) => (
          <Text key={day} className="flex-1 text-center text-xs text-muted-2">
            {day}
          </Text>
        ))}
      </View>

      {/* day grid */}
      {weeks.map((week) => (
        <View
          key={toDateKey(week[0] ?? new Date())}
          className="mb-1.5 flex-row gap-1.5"
        >
          {week.map((date) => {
            const key = toDateKey(date);
            const isOutside = date.getMonth() !== monthIndex;
            const isSelected = key === selectedDate;
            const isToday = key === todayKey;

            const dayEvents = (eventsByDate[key] ?? []).filter(
              (event) => filter === "all" || event.kind === filter
            );
            const kinds = Array.from(
              new Set(dayEvents.map((event) => event.kind))
            );

            return (
              <Pressable
                key={key}
                disabled={isOutside}
                onPress={() => onSelectDate(key)}
                accessibilityRole="button"
                accessibilityLabel={`${date.getDate()} ${
                  MONTHS[date.getMonth()] ?? ""
                }, ${dayEvents.length} event${
                  dayEvents.length === 1 ? "" : "s"
                }`}
                accessibilityState={{ selected: isSelected }}
                className={`aspect-square flex-1 items-center justify-center gap-1 rounded-lg ${
                  isSelected
                    ? "bg-primary"
                    : isToday
                      ? "border border-primary/50 bg-primary/10"
                      : "bg-muted/10"
                } ${isOutside ? "opacity-30" : ""}`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? "text-black" : "text-white"
                  }`}
                >
                  {date.getDate()}
                </Text>

                {/* fixed height so rows do not jump */}
                <View className="h-1 flex-row gap-[3px]">
                  {!isOutside &&
                    kinds.map((kind) => (
                      <View
                        key={kind}
                        className={`h-1 w-1 rounded-full ${
                          isSelected
                            ? "bg-black"
                            : kind === "completed"
                              ? "bg-emerald-400"
                              : "bg-primary"
                        }`}
                      />
                    ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
