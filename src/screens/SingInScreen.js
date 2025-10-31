// src/screens/SignInScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SignIn } from "@clerk/clerk-expo/web";
import { CLERK_PUBLISHABLE_KEY } from "../lib/clerkConfig";

export default function SignInScreen({ navigation }) {
  // We'll show the Clerk SignIn UI inside the app using their React Native flow.
  // The wrapper must be in App.js (ClerkProvider).
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to To-dos</Text>
      <Text style={styles.subtitle}>Simple, fast & offline-ready</Text>
      <View style={{ flex: 1, width: "100%", marginTop: 20 }}>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, alignItems: "center" },
  title: { fontSize: 36, color: "#fff", fontWeight: "700", marginTop: 40 },
  subtitle: { color: "#ddd", marginTop: 8 }
});
