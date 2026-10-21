import { useGetPersonalRecordsQuery } from "@/features/api";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_COLOR = "#dae86aff";
const BACKGROUND_COLOR = "#0B0C0A";
const MUTED_COLOR = "#a0a0a0";
//SCREEN FOR EACH EXERCISE'S PR
export default function ExercisePR() {
  const [selected, setSelected] = useState("");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  //find exercise data
  const {
    data: recordsData,
    isLoading,
    isError,
  } = useGetPersonalRecordsQuery();

  const records = recordsData?.records;
  const exerciseRecords = records?.find((r) => r.exerciseId === id);

  const chartData = exerciseRecords?.prHistory.map((pr) => {
    const date = new Date(pr.date).toISOString().slice(0, 10);
    return {
      value: pr.value,
      label: date,
    };
  });

  const getYAxisMax = (values: number[]) => {
    const highest = Math.max(...values, 0);

    if (highest <= 40) return 50;
    if (highest <= 80) return 100;
    if (highest <= 120) return 150;
    if (highest <= 160) return 200;
    if (highest <= 240) return 300;
    if (highest <= 320) return 400;

    return Math.ceil(highest / 100) * 100;
  };

  const values = (exerciseRecords?.prHistory ?? []).map((pr) => pr.value);

  const maxValue = getYAxisMax(values);
  const stepValue = maxValue / 6;

  const renderHeader = () => {
    return (
      <View>
        {/* // erxercise card */}
        <View className="mt-5 flex-row items-center rounded-2xl bg-[#1A1A1A] px-3 py-3">
          {/* Icon badge */}
          <View className="h-10 w-10 items-center justify-center rounded-full border border-primary">
            <FontAwesome5 name="dumbbell" size={16} color="#a0a0a0" />
          </View>

          {/* Name + subtitle */}
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-white">
              {exerciseRecords?.exerciseName}
            </Text>

            <Text className="mt-0.5 text-sm text-muted">
              {exerciseRecords?.muscle}{" "}
            </Text>
          </View>
        </View>

        {/* stats cards */}
        <View className="mt-5 flex-row justify-center gap-10">
          {/* card 1 */}
          <View className="gap-2 rounded-3xl border border-primary/10 bg-muted/5 px-4 py-3">
            <Text className="text-white">Estimated 1RM</Text>
            <Text className="text-xl text-primary">101.3 kg</Text>
            <View className="rounded-full bg-primary px-3 py-2">
              <Text>Current PR</Text>
            </View>
          </View>
          {/* card 2 */}
          <View className="gap-2 rounded-3xl border border-primary/10 bg-muted/5 px-4 py-3">
            <Text className="text-white">Estimated 1RM</Text>
            <Text className="text-xl text-primary">101.3 kg</Text>
            <View className="rounded-full bg-primary px-3 py-2">
              <Text>Current PR</Text>
            </View>
          </View>
        </View>
        {/* graph */}

        <View className="overflow-hidden rounded-2xl px-2 py-4">
          {/* Floating current value label, top right */}
          <View className="mb-2 items-end pr-4">
            <Text className="text-base font-bold text-white">
              current PR:{" "}
              <Text className="text-primary">
                {exerciseRecords?.currentPR} kg
              </Text>
            </Text>
          </View>

          <LineChart
            data={chartData ?? []}
            //LINE STYLING
            color={PRIMARY_COLOR}
            width={250}
            height={180}
            thickness={3}
            curved
            //AREA FILL BENEATH THE LINE
            areaChart
            startFillColor={PRIMARY_COLOR}
            endFillColor={BACKGROUND_COLOR}
            startOpacity={0.4}
            endOpacity={0.05}
            //DATA POINTS
            dataPointsColor={PRIMARY_COLOR}
            dataPointsRadius={5}
            //Y AXIS (RIGHT SIDE, LIKE REFERENCE IMAGE)
            yAxisSide={0}
            maxValue={maxValue}
            stepValue={stepValue}
            yAxisTextStyle={{ color: MUTED_COLOR, fontSize: 12 }}
            yAxisColor="transparent"
            //X AXIS
            xAxisColor="transparent"
            xAxisLabelTextStyle={{
              color: MUTED_COLOR,
              fontSize: 12,
              textAlign: "center",
            }}
            //GRID LINES (DASHED HORIZONTAL, LIKE REFERENCE)
            rulesType="dashed"
            rulesColor="rgba(255,255,255,0.1)"
            //GENERAL CANVAS
            backgroundColor={BACKGROUND_COLOR}
            noOfSections={6}
            initialSpacing={30}
            endSpacing={10}
            spacing={100}
            hideDataPoints={false}
          />

          <View className="mb-3 mt-6 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-white">
                PR Progression
              </Text>
              <Text className="mt-1 text-sm text-muted/50">
                Track your personal records over time
              </Text>
            </View>

            {/*TO DO- modal to dispaly all progression */}
            <Pressable>
              <Text className="text-primary">View All</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // footer
  const renderFooter = () => {
    return (
      <View className=" mt-5 flex-row items-center gap-5">
        <View className="h-[20px] w-[20px] items-center justify-center rounded-full border  border-muted">
          <FontAwesome5 name="info" size={10} color={MUTED_COLOR} />
        </View>

        <Text className="w-[250px] text-sm text-muted/70">
          Estimated 1RM calculated using the Epley formula (weight × (1 +
          reps/30)).
        </Text>
      </View>
    );
  };
  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-5">
      {/* header\ */}
      <View className="flex-row items-center gap-8 pb-3">
        {/* arrow back icon */}
        <Pressable
          onPress={() => router.back()}

          className="h-[40px] w-[40px] items-center justify-center rounded-full bg-muted/10 "
        >
          <Feather name="chevron-left" size={25} color="#dae86aff" />
        </Pressable>
        <Text className="text-lg text-white">PR History</Text>
      </View>
      <FlatList
        data={[...(exerciseRecords?.prHistory ?? [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        renderItem={({ item }) => {
          const date = new Date(item.date);

          return (
            <View className="mb-3 flex-row items-center justify-between rounded-3xl bg-muted/10 px-4 py-3">
              <Text className="text-muted/50">
                {date.toLocaleDateString("en-ZA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>

              <Text className="text-primary">{item.value} kg</Text>
            </View>
          );
        }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}
