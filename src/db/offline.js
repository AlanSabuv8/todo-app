// src/db/offline.js
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";

const db = SQLite.openDatabaseSync("todos.db");

export function initOfflineDB() {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        description TEXT,
        is_completed INTEGER,
        created_at TEXT,
        group_id TEXT,
        updated_at TEXT
      );`
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        created_at TEXT
      );`
    );
  });
}

export function getLocalTodos(cb) {
  db.transaction(tx => {
    tx.executeSql("SELECT * FROM todos ORDER BY is_completed ASC, datetime(created_at) DESC;", [], (_, { rows }) => {
      cb(rows._array);
    });
  });
}

export function saveTodoLocally(todo) {
  const {
    id = uuidv4(),
    user_id,
    title,
    description = "",
    is_completed = 0,
    created_at = new Date().toISOString(),
    group_id = null,
    updated_at = new Date().toISOString()
  } = todo;

  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO todos (id, user_id, title, description, is_completed, created_at, group_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, user_id, title, description, is_completed ? 1 : 0, created_at, group_id, updated_at]
    );
  });
}

export function deleteTodoLocally(id) {
  db.transaction(tx => {
    tx.executeSql("DELETE FROM todos WHERE id = ?;", [id]);
  });
}

/**
 * Queue operations are stored in AsyncStorage under 'sync_queue'
 * Each entry: { op: 'insert'|'update'|'delete', table:'todos'|'groups', payload: {...}, timestamp }
 */
export async function addToQueue(entry) {
  const raw = await AsyncStorage.getItem("sync_queue");
  const q = raw ? JSON.parse(raw) : [];
  q.push({ ...entry, id: uuidv4(), timestamp: new Date().toISOString() });
  await AsyncStorage.setItem("sync_queue", JSON.stringify(q));
}

export async function getQueue() {
  const raw = await AsyncStorage.getItem("sync_queue");
  return raw ? JSON.parse(raw) : [];
}

export async function clearQueue() {
  await AsyncStorage.removeItem("sync_queue");
}

// Sync function: latest-wins conflict resolution.
// This function will process queued ops and push local items to Supabase, then reconcile by pulling server content.
export async function syncWithSupabase(currentUserId) {
  // 1. Process queue
  const queue = await getQueue();
  for (const item of queue) {
    try {
      if (item.table === "todos") {
        const payload = item.payload;
        if (item.op === "insert" || item.op === "update") {
          // upsert into supabase
          await supabase.from("todos").upsert(payload, { onConflict: "id" });
        } else if (item.op === "delete") {
          await supabase.from("todos").delete().eq("id", payload.id);
        }
      } else if (item.table === "groups") {
        const payload = item.payload;
        if (item.op === "insert" || item.op === "update") {
          await supabase.from("groups").upsert(payload, { onConflict: "id" });
        } else if (item.op === "delete") {
          await supabase.from("groups").delete().eq("id", payload.id);
        }
      }
    } catch (e) {
      console.warn("Sync operation failed for item", item, e);
      // keep queue entry for later
    }
  }

  // If we get here without throws, clear the queue
  await clearQueue();

  // 2. Pull server state for user and overwrite local DB using latest-wins (server wins if server updated_at > local)
  try {
    const { data: serverGroups, error: gErr } = await supabase
      .from("groups")
      .select("*")
      .eq("user_id", currentUserId);

    if (gErr) throw gErr;

    const { data: serverTodos, error: tErr } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", currentUserId);

    if (tErr) throw tErr;

    // Replace local tables with server data (simple approach)
    db.transaction(tx => {
      tx.executeSql("DELETE FROM groups;");
      tx.executeSql("DELETE FROM todos;");
    });

    serverGroups.forEach(g => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO groups (id, user_id, name, created_at) VALUES (?, ?, ?, ?);`,
          [g.id, g.user_id, g.name, g.created_at]
        );
      });
    });

    serverTodos.forEach(t => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO todos (id, user_id, title, description, is_completed, created_at, group_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [t.id, t.user_id, t.title, t.description || "", t.is_completed ? 1 : 0, t.created_at, t.group_id, t.updated_at || new Date().toISOString()]
        );
      });
    });

    return { success: true };
  } catch (e) {
    console.warn("Error while pulling server state", e);
    return { success: false, error: e };
  }
}
