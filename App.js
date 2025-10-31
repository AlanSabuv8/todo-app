// App.js
import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClerkProvider } from "@clerk/clerk-expo";
import SignInScreen from "./src/screens/SingInScreen";
import TodoScreen from "./src/screens/TodoScreen";
import { CLERK_PUBLISHABLE_KEY } from "./src/lib/clerkConfig";

const Stack = createNativeStackNavigator();

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error("❌ Clerk publishable key missing. Check your .env and app.config.js setup.");
    return null;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Todos" component={TodoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ClerkProvider>
  );
}
