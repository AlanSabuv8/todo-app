// src/components/FloatingButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function FloatingButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.plus}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#F2A700",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  plus: {
    fontSize: 36,
    color: "white",
    lineHeight: 36
  }
});
