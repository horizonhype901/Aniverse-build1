// 🌱 BreakNudge — the doomscroll-guard interstitial.
//
// Shown by FeedScreen when the user's daily focused feed time crosses their
// screen-time threshold. Two taps: "Keep scrolling" snoozes for 10 minutes,
// "Take a break" records a break (feeds the 🌱 streak) and shows a calm
// rest screen. Everything stays on-device.
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, R } from '../theme';

export default function BreakNudge({
  visible,
  minutes,
  onKeepScrolling,
  onTakeBreak,
  onDismiss,
}: {
  visible: boolean;
  minutes: number;
  onKeepScrolling: () => void;
  onTakeBreak: () => void;
  onDismiss: () => void;
}) {
  const [resting, setResting] = useState(false);

  const close = () => {
    setResting(false);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepScrolling}
    >
      <View
        style={s.overlay}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`You've been scrolling for ${minutes} minutes. Take a break?`}
      >
        <View style={s.card}>
          {!resting ? (
            <>
              <Text style={s.emoji}>🌱</Text>
              <Text style={s.title}>Take a breather?</Text>
              <Text style={s.body}>
                You've been scrolling the feed for {minutes} min today. The anime
                isn't going anywhere — stretch, hydrate, touch grass.
              </Text>
              <Text style={s.privacy}>
                🔒 This timer lives only on your phone. Nobody knows but you.
              </Text>
              <Pressable
                style={s.breakBtn}
                accessibilityRole="button"
                accessibilityLabel="Take a break"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setResting(true);
                  onTakeBreak();
                }}
              >
                <Text style={s.breakText}>✨ Take a break</Text>
              </Pressable>
              <Pressable
                style={s.keepBtn}
                accessibilityRole="button"
                accessibilityLabel="Keep scrolling"
                onPress={onKeepScrolling}
              >
                <Text style={s.keepText}>Keep scrolling</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.emoji}>🌿</Text>
              <Text style={s.title}>Nice.</Text>
              <Text style={s.body}>
                Break logged. Go look at something far away for a bit — your
                eyes will thank you.
              </Text>
              <Pressable
                style={s.breakBtn}
                accessibilityRole="button"
                accessibilityLabel="Back to feed"
                onPress={close}
              >
                <Text style={s.breakText}>Back to the feed</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,3,12,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: 26,
    alignItems: 'center',
    width: '100%',
  },
  emoji: { fontSize: 52, marginBottom: 10 },
  title: { color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  body: { color: C.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  privacy: { color: C.faint, fontSize: 12, textAlign: 'center', marginTop: 12 },
  breakBtn: {
    backgroundColor: C.green,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 18,
  },
  breakText: { color: '#06210F', fontWeight: '900', fontSize: 16 },
  keepBtn: { marginTop: 12, padding: 8 },
  keepText: { color: C.muted, fontWeight: '700', fontSize: 14 },
});
