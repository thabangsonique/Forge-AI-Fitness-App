import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import "../global.css";
import { store } from "../store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: "#0B0C0A",
            },
          }}
        >
          <Stack.Screen name="(public)" />
        </Stack>
      </GestureHandlerRootView>
    </Provider>
  );
}
