import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

/** GitHub-style check-in heatmap: last `weeks` columns × 7 rows. */
export default function Heatmap({ days, weeks = 12, accent }: {
  days: string[]; weeks?: number; accent?: string;
}) {
  const set = new Set(days);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // align to the most recent Sunday grid
  const end = new Date(today);
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const cols: { date: Date; on: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { date: Date; on: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + w * 7 + d);
      const iso = dt.toISOString().slice(0, 10);
      col.push({ date: dt, on: set.has(iso) });
    }
    cols.push(col);
  }

  const color = accent ?? C.primary;
  return (
    <View>
      <View style={s.grid}>
        {cols.map((col, wi) => (
          <View key={wi} style={s.col}>
            {col.map(({ date, on }, di) => (
              <View
                key={di}
                style={[
                  s.cell,
                  { backgroundColor: on ? color : C.surface, opacity: on ? 0.55 + (di % 3) * 0.2 : 1 },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={s.caption}>
        {days.length} active {days.length === 1 ? 'day' : 'days'} in the last {weeks} weeks
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row' },
  col: { marginRight: 3 },
  cell: { width: 13, height: 13, borderRadius: 3, marginBottom: 3 },
  caption: { color: C.faint, fontSize: 11, marginTop: 6 },
});
