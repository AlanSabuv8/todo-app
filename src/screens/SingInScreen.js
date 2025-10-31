// src/screens/SignInScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useOAuth } from "@clerk/clerk-expo";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen({ navigation }) {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow({
          redirectUrl: Linking.createURL("/home"),
        });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        navigation.replace("Todos");
      } else {
        Alert.alert("Login incomplete", "Try again or check network");
      }
    } catch (err) {
      console.error("Google Sign-In failed", err);
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to To-dos</Text>
      <Text style={styles.subtitle}>Simple, fast & offline-ready</Text>

      <TouchableOpacity style={styles.button} onPress={handleGoogleSignIn}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 36, color: "#fff", fontWeight: "700" },
  subtitle: { color: "#ddd", marginTop: 8, marginBottom: 40 },
  button: {
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
