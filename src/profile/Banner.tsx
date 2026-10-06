import React, { useId } from 'react';
import { Image, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BANNERS } from './options';

function Gradient({ index, width, height, radius = 0 }: { index: number; width: number; height: number; radius?: number }) {
  const gid = useId().replace(/:/g, '');
  const [c0, c1] = BANNERS[index] ?? BANNERS[0];
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c0} />
          <Stop offset="1" stopColor={c1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={radius} fill={`url(#${gid})`} />
    </Svg>
  );
}

/** Full-width profile banner. */
export function BannerView({ banner, bannerPhoto, height = 110 }: {
  banner: number; bannerPhoto?: string | null; height?: number;
}) {
  if (bannerPhoto) {
    return (
      <Image source={{ uri: bannerPhoto }} style={{ width: '100%', height, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
    );
  }
  return (
    <View style={{ height, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
      <Gradient index={banner} width={400} height={height} />
    </View>
  );
}

/** Small preset thumbnail for the studio picker. */
export function BannerThumb({ index, size = 64 }: { index: number; size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.55, borderRadius: 8, overflow: 'hidden' }}>
      <Gradient index={index} width={size} height={size * 0.55} radius={8} />
    </View>
  );
}
