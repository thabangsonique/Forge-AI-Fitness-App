import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MonthCalendar from "@/components/ui/calendar/monthCalendar";
import {
  getGridRange,
  toDateKey,
  type CalendarEvent,
  type CalendarFilter,
} from "@/components/ui/calendar/calendarUtils";
import {
  useGetAllWorkoutsQuery,
  useGetScheduledWorkoutsInRangeQuery,
  useGetWorkoutSessionHistoryQuery,
} from "@/features/api";
import { useSession } from "@/lib/auth-client";
import { formatDate, formatMinutes } from "@/utils/formatDuration";

const fallbackProfileImage = require("../../../assets/images/app-images/user-profile.png");

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export default function Calendar() {
  const router = useRouter();
  const { data: session } = useSession();

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [filter, setFilter] = useState<CalendarFilter>("all");

  const range = useMemo(() => getGridRange(visibleMonth), [visibleMonth]);

  const {
    data: scheduledWorkouts,
    isLoading: scheduledLoading,
    isError: scheduledError,
  } = useGetScheduledWorkoutsInRangeQuery(range);

  const {
    data: sessionHistory,
    isLoading: historyLoading,
    isError: historyError,
  } = useGetWorkoutSessionHistoryQuery();

  const { data: allWorkouts } = useGetAllWorkoutsQuery();

  const profileImage = session?.user?.image
    ? { uri: session.user.image }
    : fallbackProfileImage;

  const displayName = session?.user?.name?.trim()
    ? session.user.name.trim().split(" ")[0]
    : "Athlete";

  const events = useMemo<CalendarEvent[]>(() => {
    const scheduledEvents: CalendarEvent[] = (scheduledWorkouts ?? []).map(
      (scheduled) => {
        const workout = allWorkouts?.find(
          (item) => item.id === scheduled.workoutId
        );
        const dateKey = toDateKey(new Date(scheduled.scheduledDate));

        return {
          id: `scheduled-${scheduled.workoutId}-${dateKey}`,
          workoutId: scheduled.workoutId,
          workoutName: workout?.name ?? "Workout",
          category: workout?.workoutCategory ?? null,
          dateKey,
          kind: "scheduled",
        };
      }
    );

    const completedEvents: CalendarEvent[] = (sessionHistory ?? []).map(
      (historyItem) => {
        const workout = allWorkouts?.find(
          (item) => item.id === historyItem.workoutId
        );
        const dateKey = toDateKey(new Date(historyItem.completedAt));

        return {
          id: `completed-${historyItem.id}`,
          workoutId: historyItem.workoutId,
          workoutName: historyItem.workoutName,
          category: workout?.workoutCategory ?? null,
          dateKey,
          kind: "completed",
          durationSeconds: historyItem.durationSeconds,
        };
      }
    );

    return [...scheduledEvents, ...completedEvents];
  }, [scheduledWorkouts, sessionHistory, allWorkouts]);

  const selectedEvents = useMemo(
    () =>
      events
        .filter((event) => event.dateKey === selectedDate)
        .filter((event) => filter === "all" || event.kind === filter)
        .sort((a, b) =>
          a.kind === b.kind ? 0 : a.kind === "scheduled" ? -1 : 1
        ),
    [events, selectedDate, filter]
  );

  const handleChangeMonth = (next: Date) => {
    const month = startOfMonth(next);
    const now = new Date();

    setVisibleMonth(month);
    setSelectedDate(toDateKey(sameMonth(month, now) ? now : month));
  };

  const handleToday = () => {
    const now = new Date();
    setVisibleMonth(startOfMonth(now));
    setSelectedDate(toDateKey(now));
  };

  const isLoading = scheduledLoading || historyLoading;
  const hasError = scheduledError || historyError;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}
      >
        {/* header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="h-14 w-14 overflow-hidden rounded-full border-2 border-primary/40 bg-muted/10">
              <Image
                source={profileImage}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm text-muted-2">Welcome back</Text>
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          </View>
        </View>

        <Text className="mt-5 text-2xl font-bold text-white">My Calendar</Text>

        {hasError ? (
          <View className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3">
            <Text className="text-sm text-red-400">
              We could not load your calendar. Please try again.
            </Text>
          </View>
        ) : null}

        <View className="mt-5">
          <MonthCalendar
            events={events}
            month={visibleMonth}
            selectedDate={selectedDate}
            filter={filter}
            onChangeMonth={handleChangeMonth}
            onSelectDate={setSelectedDate}
            onChangeFilter={setFilter}
            onToday={handleToday}
          />
        </View>

        {/* selected day */}
        <View className="mt-6">
          <Text className="text-base font-semibold text-white">
            {formatDate(new Date(`${selectedDate}T12:00:00`))}
          </Text>

          {isLoading ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color="#dae86aff" />
            </View>
          ) : selectedEvents.length === 0 ? (
            <View className="mt-3 rounded-3xl bg-muted/10 px-4 py-6">
              <Text className="text-center text-sm text-muted-2">
                Nothing scheduled or completed on this day.
              </Text>
            </View>
          ) : (
            selectedEvents.map((event) => (
              <Pressable
                key={event.id}
                onPress={() =>
                  router.push({
                    pathname: "/workout/[id]",
                    params: { id: event.workoutId },
                  })
                }
                className="mt-3 flex-row items-center rounded-3xl bg-muted/10 px-4 py-4"
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    event.kind === "completed"
                      ? "bg-emerald-400/10"
                      : "bg-primary/10"
                  }`}
                >
                  <Feather
                    name={
                      event.kind === "completed" ? "check-circle" : "calendar"
                    }
                    size={18}
                    color={event.kind === "completed" ? "#34D399" : "#dae86aff"}
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-white" numberOfLines={1}>
                    {event.workoutName}
                  </Text>
                  <Text
                    className="mt-0.5 text-xs text-muted-2"
                    numberOfLines={1}
                  >
                    {event.kind === "completed"
                      ? `Completed${
                          event.durationSeconds != null
                            ? ` · ${formatMinutes(event.durationSeconds)}`
                            : ""
                        }`
                      : "Scheduled"}
                    {event.category ? ` · ${event.category}` : ""}
                  </Text>
                </View>

                <Feather name="chevron-right" size={18} color="#C7C8BF" />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
