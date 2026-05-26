import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { and, isNull, like } from "drizzle-orm";
import { db } from "../db/client";
import { exercises, type LocalExercise } from "../db/schema";
import { tokens } from "../theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: LocalExercise) => void;
};

export function ExercisePicker({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const rows = useMemo<LocalExercise[]>(() => {
    if (!visible) return [];
    const q = query.trim();
    const where = q
      ? and(isNull(exercises.deletedAt), like(exercises.name, `%${q}%`))
      : isNull(exercises.deletedAt);
    return db.select().from(exercises).where(where).all().slice(0, 100);
  }, [visible, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Pick exercise</Text>
          <View style={{ width: 60 }} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises…"
          style={styles.search}
          autoFocus
        />
        <FlatList
          data={rows}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowSub}>
                {item.primaryMuscle} · {item.equipment}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  cancel: {
    fontFamily: tokens.font.sansRegular,
    color: tokens.color.fgMuted,
    fontSize: 14,
    width: 60,
  },
  title: {
    fontFamily: tokens.font.sansBold,
    fontSize: 16,
    color: tokens.color.fg,
  },
  search: {
    margin: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    fontSize: 14,
    fontFamily: tokens.font.sansRegular,
    backgroundColor: tokens.color.bg,
    color: tokens.color.fg,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.borderFaint,
  },
  rowName: {
    fontFamily: tokens.font.sansSemibold,
    fontSize: 14,
    color: tokens.color.fg,
  },
  rowSub: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 2,
  },
});
