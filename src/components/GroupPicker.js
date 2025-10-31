// src/components/GroupPicker.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function GroupPicker({ groups, selectedGroupId, onSelect }) {
  return (
    <View style={styles.container}>
      {groups.map(g => (
        <TouchableOpacity
          key={g.id}
          onPress={() => onSelect(g.id)}
          style={[
            styles.chip,
            selectedGroupId === g.id ? styles.chipActive : null
          ]}
        >
          <Text style={selectedGroupId === g.id ? styles.activeText : styles.text}>{g.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 8, marginVertical: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#222",
    borderRadius: 20,
    marginRight: 8
  },
  chipActive: { backgroundColor: "#F2A700" },
  text: { color: "#eee" },
  activeText: { color: "#000" }
});
