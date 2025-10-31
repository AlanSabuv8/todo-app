// src/screens/TodoScreen.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { supabase } from "../lib/supabase";
import { initOfflineDB, getLocalTodos, saveTodoLocally, deleteTodoLocally, addToQueue, syncWithSupabase } from "../db/offline";
import { v4 as uuidv4 } from "uuid";
import NetInfo from "@react-native-community/netinfo";
import TaskItem from "../components/TaskItem";
import FloatingButton from "../components/FloatingButton";
import GroupPicker from "../components/GroupPicker";

export default function TodoScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [todos, setTodos] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    initOfflineDB();
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    loadLocalData();
    return () => unsub();
  }, []);

  useEffect(() => {
    // When online, try to sync and fetch fresh server data
    if (isOnline && userId) {
      (async () => {
        setLoading(true);
        await syncWithSupabase(userId);
        await loadLocalData();
        setLoading(false);
      })();
    }
  }, [isOnline, userId]);

  async function loadLocalData() {
    getLocalTodos(rows => {
      // convert is_completed to boolean
      const cleaned = rows.map(r => ({ ...r, is_completed: !!r.is_completed }));
      setTodos(cleaned);
      setLoading(false);
    });
    // Load local groups from DB
    // simple query using SQLite (re-run a small query)
    // For brevity, will fetch from supabase when online and otherwise use server-fallback
    if (isOnline && userId) {
      try {
        const { data: serverGroups } = await supabase.from("groups").select("*").eq("user_id", userId);
        setGroups(serverGroups || []);
        if (!selectedGroup && (serverGroups?.length > 0)) setSelectedGroup(serverGroups[0].id);
      } catch (e) {
        console.warn(e);
      }
    } else {
      // fetch groups from local DB
      // simple approach: read via SQL
      const db = require("expo-sqlite").openDatabase("todos.db");
      db.transaction(tx => {
        tx.executeSql("SELECT * FROM groups ORDER BY datetime(created_at) DESC;", [], (_, { rows }) => {
          setGroups(rows._array || []);
          if (!selectedGroup && rows._array?.length) setSelectedGroup(rows._array[0].id);
        });
      });
    }
  }

  async function createGroup() {
    if (!groupName.trim()) return Alert.alert("Name required");
    const id = uuidv4();
    const payload = { id, user_id: userId, name: groupName, created_at: new Date().toISOString() };
    // save locally
    const db = require("expo-sqlite").openDatabase("todos.db");
    db.transaction(tx => {
      tx.executeSql("INSERT OR REPLACE INTO groups (id, user_id, name, created_at) VALUES (?, ?, ?, ?);",
        [payload.id, payload.user_id, payload.name, payload.created_at]);
    });
    setGroups(prev => [payload, ...prev]);
    setGroupModalVisible(false);
    setGroupName("");
    // queue for sync
    await addToQueue({ op: "insert", table: "groups", payload });
    if (isOnline) await syncWithSupabase(userId);
  }

  async function addTodo() {
    if (!title.trim()) return Alert.alert("Title required");
    if (!selectedGroup) return Alert.alert("Select a group first");
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const todo = {
      id,
      user_id: userId,
      title,
      description,
      is_completed: false,
      created_at,
      group_id: selectedGroup,
      updated_at: created_at
    };
    // save locally
    saveTodoLocally(todo);
    setTitle("");
    setDescription("");
    // queue
    await addToQueue({ op: "insert", table: "todos", payload: todo });
    await loadLocalData();
    if (isOnline) await syncWithSupabase(userId);
  }

  async function toggleComplete(item) {
    const updated = { ...item, is_completed: !item.is_completed, updated_at: new Date().toISOString() };
    saveTodoLocally(updated);
    await addToQueue({ op: "update", table: "todos", payload: updated });
    await loadLocalData();
    if (isOnline) await syncWithSupabase(userId);
  }

  async function deleteTodo(id) {
    deleteTodoLocally(id);
    await addToQueue({ op: "delete", table: "todos", payload: { id } });
    await loadLocalData();
    if (isOnline) await syncWithSupabase(userId);
  }

  function renderItem({ item }) {
    return <TaskItem item={item} onToggle={toggleComplete} onDelete={deleteTodo} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h}>To-dos</Text>
        <TouchableOpacity onPress={async () => { await signOut(); }} style={styles.logout}>
          <Text style={{ color: "#fff" }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sub}>{todos.length} to-dos</Text>

      <View style={{ marginVertical: 12 }}>
        <GroupPicker groups={groups} selectedGroupId={selectedGroup} onSelect={setSelectedGroup} />
        <TouchableOpacity onPress={() => setGroupModalVisible(true)} style={styles.addGroup}>
          <Text style={{ color: "#F2A700" }}>+ Create group</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TextInput placeholder="title" placeholderTextColor="#888" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput placeholder="description" placeholderTextColor="#888" value={description} onChangeText={setDescription} style={[styles.input, { marginTop: 8 }]} />
        <TouchableOpacity onPress={addTodo} style={styles.addBtn}><Text style={{ color: "#fff" }}>Add</Text></TouchableOpacity>
      </View>

      <View style={{ marginTop: 12, flex: 1 }}>
        {loading ? <ActivityIndicator color="#F2A700" /> : (
          <FlatList
            data={todos.filter(t => t.group_id === selectedGroup).sort((a,b) => {
              if (a.is_completed === b.is_completed) return new Date(b.created_at) - new Date(a.created_at);
              return a.is_completed - b.is_completed;
            })}
            renderItem={renderItem}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingBottom: 140 }}
          />
        )}
      </View>

      {!isOnline && (
        <View style={styles.offline}>
          <Text style={{ color: "#fff" }}>Offline — changes will sync when online</Text>
        </View>
      )}

      <FloatingButton onPress={() => {
        // quick-add focused: open group modal if no groups
        if (!groups.length) {
          setGroupModalVisible(true);
          return;
        }
        // focus title input; on mobile this would require refs; keep simple
        Alert.alert("Quick tip", "Type title and press Add. Make sure a group is selected.");
      }} />

      <Modal visible={groupModalVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={{ color: "#fff", fontSize: 18 }}>Create Group</Text>
            <TextInput placeholder="Group name" value={groupName} onChangeText={setGroupName} style={styles.modalInput} placeholderTextColor="#aaa" />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
              <TouchableOpacity onPress={() => setGroupModalVisible(false)} style={styles.modalBtn}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={createGroup} style={[styles.modalBtn, { backgroundColor: "#F2A700" }]}><Text>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  h: { fontSize: 36, color: "#fff", fontWeight: "700" },
  sub: { color: "#888", marginTop: 6 },
  inputRow: { marginTop: 12 },
  input: { backgroundColor: "#111", padding: 12, borderRadius: 12, color: "#fff" },
  addBtn: { marginTop: 8, backgroundColor: "#F2A700", padding: 12, borderRadius: 10, alignItems: "center" },
  offline: { position: "absolute", left: 12, right: 12, bottom: 100, backgroundColor: "#444", padding: 10, borderRadius: 8, alignItems: "center" },
  addGroup: { marginTop: 6 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modal: { width: "90%", backgroundColor: "#111", padding: 16, borderRadius: 12 },
  modalInput: { marginTop: 12, backgroundColor: "#222", padding: 10, borderRadius: 8, color: "#fff" },
  modalBtn: { padding: 10, borderRadius: 8 }
});
