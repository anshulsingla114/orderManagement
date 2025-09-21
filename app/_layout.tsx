// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{ headerShown: false }} // 👈 disables header everywhere
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="waiter" />
      <Stack.Screen name="kitchen" />
      <Stack.Screen name="testfirestore" />
    </Stack>
  );
}
