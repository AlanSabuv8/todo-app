// src/components/TaskItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function TaskItem({ item, onToggle, onDelete }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => onToggle(item)} style={styles.check}>
        <View style={[styles.circle, item.is_completed ? styles.checked : null]}>
          {item.is_completed && <Text style={styles.checkIcon}>✓</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={[styles.title, item.is_completed ? styles.completedText : null]} numberOfLines={1}>{item.title}</Text>
        {item.description ? <Text style={styles.desc} numberOfLines={1}>{item.description}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.delBtn}>
        <Text style={styles.delText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#1f1f1f", borderRadius: 12, marginVertical: 6 },
  check: { paddingRight: 12 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#777", alignItems: "center", justifyContent: "center" },
  checked: { backgroundColor: "#F2A700", borderColor: "#F2A700" },
  checkIcon: { color: "#000" },
  body: { flex: 1 },
  title: { color: "#eee", fontSize: 16, fontWeight: "600" },
  desc: { color: "#aaa", fontSize: 12, marginTop: 2 },
  completedText: { textDecorationLine: "line-through", color: "#999" },
  delBtn: { paddingLeft: 12 },
  delText: { color: "#ff6b6b" }
});
