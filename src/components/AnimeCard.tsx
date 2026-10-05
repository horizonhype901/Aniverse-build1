import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, R } from '../theme';
import { AnimeItem } from '../types';

export default function AnimeCard({
  anime, onPress, width = 120,
}: { anime: AnimeItem; onPress: () => void; width?: number }) {
  return (
    <Pressable style={[s.wrap, { width }]} onPress={onPress}>
      {anime.image ? (
        <Image source={{ uri: anime.image }} style={[s.img, { width, height: width * 1.45 }]} />
      ) : (
        <View style={[s.img, s.noImg, { width, height: width * 1.45 }]}>
          <Text style={s.noImgText}>🎌</Text>
        </View>
      )}
      <Text style={s.title} numberOfLines={2}>{anime.title}</Text>
      <Text style={s.score}>
        {anime.score ? `⭐ ${anime.score.toFixed(2)}` : '⭐ --'}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { marginRight: 12 },
  img: { borderRadius: R.md, backgroundColor: C.card2 },
  noImg: { alignItems: 'center', justifyContent: 'center' },
  noImgText: { fontSize: 32 },
  title: { color: C.text, fontSize: 12, fontWeight: '700', marginTop: 6 },
  score: { color: C.gold, fontSize: 11, fontWeight: '600', marginTop: 2 },
});
