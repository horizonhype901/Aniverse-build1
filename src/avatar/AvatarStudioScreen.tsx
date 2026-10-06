import React, { useState } from 'react';
import {
  Alert, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { C, R } from '../theme';
import { store } from '../lib/store';
import { AvatarConfig } from '../types';
import AvatarRenderer from './AvatarRenderer';
import {
  SKINS, SKIN_NAMES, FACES, EYES, EYE_COLORS, EYE_COLOR_NAMES, BROWS,
  MOUTHS, HAIRS, HAIR_COLORS, HAIR_COLOR_NAMES, ACCESSORIES, BG_NAMES,
  DEFAULT_AVATAR, MOODS, randomAvatar, randomizeCategory,
} from './options';
type CatKey = keyof AvatarConfig;

interface Cat {
  key: CatKey;
  label: string;
  type: 'color' | 'avatar';
  options: readonly string[];
  names?: readonly string[];
}

const CATS: Cat[] = [
  { key: 'skin', label: '🎨 Skin', type: 'color', options: SKINS, names: SKIN_NAMES },
  { key: 'face', label: '⭕ Face', type: 'avatar', options: FACES },
  { key: 'eyes', label: '👀 Eyes', type: 'avatar', options: EYES },
  { key: 'eyeColor', label: '👁️ Color', type: 'color', options: EYE_COLORS, names: EYE_COLOR_NAMES },
  { key: 'brows', label: '🤨 Brows', type: 'avatar', options: BROWS },
  { key: 'mouth', label: '👄 Mouth', type: 'avatar', options: MOUTHS },
  { key: 'hair', label: '💇 Hair', type: 'avatar', options: HAIRS },
  { key: 'hairColor', label: '🌈 Dye', type: 'color', options: HAIR_COLORS, names: HAIR_COLOR_NAMES },
  { key: 'accessory', label: '✨ Extras', type: 'avatar', options: ACCESSORIES },
  { key: 'bg', label: '🖼️ BG', type: 'avatar', options: BG_NAMES },
];

export default function AvatarStudioScreen() {
  const nav = useNavigation<any>();
  const [config, setConfig] = useState<AvatarConfig>({ ...DEFAULT_AVATAR });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cat, setCat] = useState<Cat>(CATS[0]);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    (async () => {
      const p = await store.profile();
      if (p.avatar) setConfig(p.avatar);
      if (p.photoUri) setPhotoUri(p.photoUri);
      const tab = await store.studioTab();
      const found = CATS.find((c) => c.key === tab);
      if (found) setCat(found);
      setLoaded(true);
    })();
  }, []);

  const selectCat = (c: Cat) => {
    setCat(c);
    store.saveStudioTab(c.key);
  };

  const pick = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfig((c) => ({ ...c, [cat.key]: i }));
  };

  const randomize = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfig(randomAvatar());
    setPhotoUri(null);
  };

  const diceCategory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfig((c) => randomizeCategory(c, cat.key));
  };

  const applyMood = (m: { eyes: number; mouth: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfig((c) => ({ ...c, eyes: m.eyes, mouth: m.mouth }));
  };

  const usePhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const save = async () => {
    const p = await store.profile();
    await store.saveProfile({ ...p, avatar: config, photoUri });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nav.goBack();
  };

  if (!loaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.back}>‹ Cancel</Text></Pressable>
        <Text style={s.headerTitle}>Avatar Studio</Text>
        <Pressable style={s.saveBtn} onPress={save}><Text style={s.saveText}>✓ Save</Text></Pressable>
      </View>

      <View style={s.previewWrap}>
        <View style={s.previewCircle}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: 168, height: 168 }} />
          ) : (
            <AvatarRenderer config={config} size={168} animated />
          )}
        </View>
        <View style={s.previewBtns}>
          <Pressable style={s.toolBtn} onPress={randomize}>
            <Text style={s.toolText}>🎲 Surprise me</Text>
          </Pressable>
          <Pressable style={s.toolBtn} onPress={usePhoto}>
            <Text style={s.toolText}>📷 {photoUri ? 'Change photo' : 'Use photo'}</Text>
          </Pressable>
          {photoUri && (
            <Pressable style={s.toolBtn} onPress={() => setPhotoUri(null)}>
              <Text style={s.toolText}>✕ Remove</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center' }} style={s.moodBar}>
        {MOODS.map((m) => (
          <Pressable key={m.name} onPress={() => applyMood(m)} style={s.moodChip}>
            <Text style={s.moodText}>{m.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.catRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 12 }} style={{ flex: 1, maxHeight: 48 }}>
          {CATS.map((c) => (
            <Pressable key={c.key} onPress={() => selectCat(c)}
              style={[s.catChip, cat.key === c.key && s.catActive]}>
              <Text style={[s.catText, cat.key === c.key && { color: '#fff' }]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={s.diceBtn} onPress={diceCategory}>
          <Text style={s.diceText}>🎲</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.grid}>
        {cat.type === 'color'
          ? cat.options.map((color, i) => (
              <Pressable key={i} onPress={() => pick(i)} style={s.swatchWrap}>
                <View style={[
                  s.swatch,
                  { backgroundColor: color as string },
                  config[cat.key] === i && s.swatchActive,
                ]} />
                {!!cat.names && <Text style={s.optName}>{cat.names[i]}</Text>}
              </Pressable>
            ))
          : cat.options.map((label, i) => (
              <Pressable key={i} onPress={() => pick(i)} style={s.cell}>
                <View style={[s.cellPrev, config[cat.key] === i && s.cellActive]}>
                  <AvatarRenderer config={{ ...config, [cat.key]: i }} size={64} />
                </View>
                <Text style={s.optName} numberOfLines={1}>{label}</Text>
              </Pressable>
            ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { color: C.primary, fontSize: 16, fontWeight: '700', width: 80 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  saveBtn: { backgroundColor: C.primary, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8, minWidth: 80, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800' },
  previewWrap: { alignItems: 'center', paddingVertical: 16 },
  previewCircle: { width: 168, height: 168, borderRadius: 84, overflow: 'hidden', borderWidth: 3, borderColor: C.primary },
  previewBtns: { flexDirection: 'row', marginTop: 12 },
  toolBtn: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 4, borderWidth: 1, borderColor: C.border },
  toolText: { color: C.text, fontWeight: '700', fontSize: 13 },
  catBar: { maxHeight: 48 },
  moodBar: { maxHeight: 44 },
  moodChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card2, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, alignSelf: 'center' },
  moodText: { color: C.text, fontWeight: '700', fontSize: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center' },
  diceBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  diceText: { fontSize: 20 },
  catChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, alignSelf: 'center' },
  catActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  catText: { color: C.muted, fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingBottom: 40, justifyContent: 'flex-start' },
  cell: { width: '25%', alignItems: 'center', marginBottom: 14 },
  cellPrev: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  cellActive: { borderColor: C.primary },
  optName: { color: C.muted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  swatchWrap: { width: '25%', alignItems: 'center', marginBottom: 16 },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: C.primary },
});
