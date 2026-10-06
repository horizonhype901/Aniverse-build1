import React, { useEffect, useId, useRef, useState } from 'react';
import Svg, {
  Circle, Ellipse, Path, Polygon, Rect, Defs, LinearGradient, Stop,
} from 'react-native-svg';
import { AvatarConfig } from '../types';
import { SKINS, FACE_DIMS, EYE_COLORS, HAIR_COLORS, BGS } from './options';

function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const INK = '#1F1B24';
const LASH = '#2A2430';

const CAP = 'M46,104 C44,40 70,34 100,34 C130,34 156,40 154,104 L150,98 C138,76 120,70 100,70 C80,70 62,76 50,98 Z';
const FRINGE = 'M50,104 C54,66 70,58 84,66 C90,56 104,56 110,66 C124,58 142,66 150,104 C140,92 132,96 128,88 C122,98 114,98 110,90 C104,98 96,98 92,90 C86,98 78,98 72,88 C66,96 58,94 50,104 Z';

function sparkleEye(cx: number, cy: number, ec: string) {
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={11} ry={13} fill="#fff" />
      <Circle cx={cx} cy={cy - 1} r={7.5} fill={ec} />
      <Circle cx={cx} cy={cy - 1} r={3.5} fill={INK} />
      <Circle cx={cx - 2.5} cy={cy - 4.5} r={2.4} fill="#fff" />
      <Circle cx={cx + 3} cy={cy + 2.5} r={1.2} fill="#fff" opacity={0.8} />
      <Path d={`M${cx - 11},${cy - 4} Q${cx},${cy - 14} ${cx + 11},${cy - 4}`} stroke={LASH} strokeWidth={3.5} fill="none" strokeLinecap="round" />
    </>
  );
}

function happyEye(cx: number, cy: number) {
  return (
    <>
      <Path d={`M${cx - 11},${cy + 2} Q${cx - 5},${cy - 8} ${cx + 1},${cy + 2}`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <Path d={`M${cx - 1},${cy + 2} Q${cx + 5},${cy - 8} ${cx + 11},${cy + 2}`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
    </>
  );
}

function renderEyes(style: number, ec: string, skin: string) {
  const cy = 114;
  const L = 76, R = 124;
  switch (style) {
    case 1: // sharp
      return (
        <>
          {[L, R].map((cx) => (
            <React.Fragment key={cx}>
              <Polygon points={`${cx - 13},${cy + 2} ${cx + 13},${cy - 2} ${cx + 9},${cy + 6} ${cx - 9},${cy + 8}`} fill="#fff" />
              <Circle cx={cx + 1} cy={cy + 1} r={6} fill={ec} />
              <Circle cx={cx + 1} cy={cy + 1} r={2.8} fill={INK} />
              <Path d={`M${cx - 13},${cy + 2} L${cx + 13},${cy - 2}`} stroke={LASH} strokeWidth={4} strokeLinecap="round" />
            </React.Fragment>
          ))}
        </>
      );
    case 2: // happy
      return <>{happyEye(L, cy)}{happyEye(R, cy)}</>;
    case 3: // sleepy
      return (
        <>
          {[L, R].map((cx) => (
            <React.Fragment key={cx}>
              <Ellipse cx={cx} cy={cy} rx={11} ry={9} fill="#fff" />
              <Circle cx={cx} cy={cy + 2} r={5} fill={ec} />
              <Rect x={cx - 11} y={cy - 12} width={22} height={11} fill={skin} />
              <Path d={`M${cx - 11},${cy - 1} L${cx + 11},${cy - 1}`} stroke={LASH} strokeWidth={3.5} strokeLinecap="round" />
            </React.Fragment>
          ))}
        </>
      );
    case 4: // wink
      return <>{sparkleEye(L, cy, ec)}{happyEye(R, cy)}</>;
    case 5: // starry
      return (
        <>
          {[L, R].map((cx) => (
            <React.Fragment key={cx}>
              <Ellipse cx={cx} cy={cy} rx={11} ry={13} fill="#fff" />
              <Polygon points={starPoints(cx, cy - 1, 8)} fill={ec} />
              <Circle cx={cx} cy={cy - 1} r={2} fill={INK} />
              <Circle cx={cx - 3} cy={cy - 5} r={1.6} fill="#fff" />
            </React.Fragment>
          ))}
        </>
      );
    default: // sparkle
      return <>{sparkleEye(L, cy, ec)}{sparkleEye(R, cy, ec)}</>;
  }
}

function renderBrows(style: number) {
  const y = 90;
  const sw = '#3A2E2A';
  const pair = (d: (cx: number) => React.ReactNode) => <>{d(76)}{d(124)}</>;
  switch (style) {
    case 1:
      return pair((cx) => <Path key={cx} d={`M${cx - 10},${y} L${cx + 10},${y}`} stroke={sw} strokeWidth={5} strokeLinecap="round" />);
    case 2:
      return pair((cx) => <Path key={cx} d={`M${cx - 10},${y + 2} Q${cx},${y - 4} ${cx + 10},${y + 2}`} stroke={sw} strokeWidth={7} fill="none" strokeLinecap="round" />);
    case 3:
      return pair((cx) => <Path key={cx} d={`M${cx - 11},${y + 4} Q${cx},${y - 8} ${cx + 11},${y}`} stroke={sw} strokeWidth={4} fill="none" strokeLinecap="round" />);
    default:
      return pair((cx) => <Path key={cx} d={`M${cx - 10},${y + 2} Q${cx},${y - 4} ${cx + 10},${y + 2}`} stroke={sw} strokeWidth={4} fill="none" strokeLinecap="round" />);
  }
}

function renderMouth(style: number) {
  const blush = (
    <>
      <Ellipse cx={70} cy={142} rx={8} ry={5} fill="#F49FB6" opacity={0.65} />
      <Ellipse cx={130} cy={142} rx={8} ry={5} fill="#F49FB6" opacity={0.65} />
    </>
  );
  switch (style) {
    case 1: // grin
      return (
        <>
          <Path d="M86,148 Q100,146 114,148 Q112,162 100,162 Q88,162 86,148 Z" fill="#8E3B3B" />
          <Path d="M88,149 L112,149 L111,153 L89,153 Z" fill="#fff" opacity={0.9} />
        </>
      );
    case 2: // smirk
      return <Path d="M90,152 Q102,158 112,148" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
    case 3: // open
      return (
        <>
          <Ellipse cx={100} cy={153} rx={9} ry={11} fill="#8E3B3B" />
          <Ellipse cx={100} cy={158} rx={5} ry={4.5} fill="#E88B8B" />
        </>
      );
    case 4: // chill
      return <Path d="M93,152 L107,152" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    case 5: // cat
      return (
        <>
          {blush}
          <Path d="M90,150 Q95,155 100,150 Q105,155 110,150" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </>
      );
    default: // smile
      return (
        <>
          {blush}
          <Path d="M88,150 Q100,160 112,150" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        </>
      );
  }
}

function renderHairBack(style: number, hc: string) {
  switch (style) {
    case 2: // long
      return (
        <>
          <Path d="M46,100 C34,160 40,196 58,200 L72,200 C58,160 60,120 62,100 Z" fill={hc} />
          <Path d="M154,100 C166,160 160,196 142,200 L128,200 C142,160 140,120 138,100 Z" fill={hc} />
        </>
      );
    case 7: // twintails
      return (
        <>
          <Path d="M54,58 C20,80 12,130 22,168 C24,178 36,176 34,164 C30,130 38,96 58,74 Z" fill={hc} />
          <Path d="M146,58 C180,80 188,130 178,168 C176,178 164,176 166,164 C170,130 162,96 142,74 Z" fill={hc} />
        </>
      );
    case 3: // ponytail
      return <Path d="M146,58 C180,80 188,130 178,168 C176,178 164,176 166,164 C170,130 162,96 142,74 Z" fill={hc} />;
    default:
      return null;
  }
}

function renderHairFront(style: number, hc: string) {
  const tie = '#F15BB5';
  switch (style) {
    case 0: // spiky
      return (
        <>
          <Path d={CAP} fill={hc} />
          <Path d="M46,100 L58,62 L70,92 L82,58 L94,90 L106,56 L118,90 L130,58 L142,92 L154,100 L154,110 L46,110 Z" fill={hc} />
        </>
      );
    case 1: // bob
      return (
        <>
          <Path d={CAP} fill={hc} />
          <Path d={FRINGE} fill={hc} />
          <Path d="M44,96 L58,96 L56,152 Q50,156 44,152 Z" fill={hc} />
          <Path d="M156,96 L142,96 L144,152 Q150,156 156,152 Z" fill={hc} />
        </>
      );
    case 5: // messy
      return (
        <>
          <Path d={CAP} fill={hc} />
          <Path d="M44,106 L50,48 L64,80 L74,44 L90,78 L100,42 L114,80 L126,46 L140,82 L154,52 L160,106 L150,112 Q100,90 50,112 Z" fill={hc} />
        </>
      );
    case 6: // buzz
      return <Path d="M54,92 C62,56 80,50 100,50 C120,50 138,56 146,92 C138,70 120,64 100,64 C80,64 62,70 54,92 Z" fill={hc} />;
    case 4: // buns
      return (
        <>
          <Circle cx={60} cy={40} r={15} fill={hc} />
          <Circle cx={140} cy={40} r={15} fill={hc} />
          <Path d={CAP} fill={hc} />
          <Path d={FRINGE} fill={hc} />
        </>
      );
    default: // long, ponytail, twintails
      return (
        <>
          <Path d={CAP} fill={hc} />
          <Path d={FRINGE} fill={hc} />
          {style === 3 && <Circle cx={148} cy={66} r={6} fill={tie} />}
          {style === 7 && (
            <>
              <Circle cx={56} cy={66} r={5} fill={tie} />
              <Circle cx={144} cy={66} r={5} fill={tie} />
            </>
          )}
        </>
      );
  }
}

function renderAccessory(style: number, hc: string) {
  switch (style) {
    case 1: // star headphones (mascot tie-in)
      return (
        <>
          <Path d="M46,98 C48,34 70,26 100,26 C130,26 152,34 154,98" stroke="#F15BB5" strokeWidth={11} fill="none" strokeLinecap="round" />
          <Rect x={36} y={88} width={22} height={36} rx={11} fill="#F15BB5" />
          <Rect x={142} y={88} width={22} height={36} rx={11} fill="#F15BB5" />
          <Polygon points={starPoints(100, 24, 9)} fill="#FFC94D" />
        </>
      );
    case 2: // glasses
      return (
        <>
          <Circle cx={76} cy={114} r={17} stroke="#23232B" strokeWidth={4.5} fill="none" />
          <Circle cx={124} cy={114} r={17} stroke="#23232B" strokeWidth={4.5} fill="none" />
          <Path d="M93,114 Q100,108 107,114" stroke="#23232B" strokeWidth={4.5} fill="none" />
        </>
      );
    case 3: // star pin
      return <Polygon points={starPoints(140, 64, 11)} fill="#FFC94D" />;
    case 4: // headband
      return <Path d="M54,86 Q100,60 146,86" stroke="#22D3EE" strokeWidth={10} fill="none" strokeLinecap="round" />;
    case 5: // cat ears (drawn before front hair by caller)
      return null;
    case 6: // beanie
      return (
        <>
          <Path d="M50,80 C54,38 74,30 100,30 C126,30 146,38 150,80 C130,66 70,66 50,80 Z" fill="#22D3EE" />
          <Rect x={48} y={70} width={104} height={16} rx={8} fill="#1B9CC4" />
          <Circle cx={100} cy={28} r={9} fill="#E8F6FF" />
        </>
      );
    case 7: // santa hat
      return (
        <>
          <Path d="M58,62 C80,18 120,14 156,40 C130,36 108,44 92,62 Z" fill="#E63946" />
          <Ellipse cx={100} cy={64} rx={52} ry={11} fill="#F1FAEE" />
          <Circle cx={158} cy={42} r={10} fill="#F1FAEE" />
        </>
      );
    case 8: // flower crown
      return (
        <>
          {[62, 81, 100, 119, 138].map((x, i) => (
            <React.Fragment key={x}>
              <Circle cx={x} cy={58 + (i % 2) * 6} r={8} fill={['#F15BB5', '#FFC94D', '#F472B6', '#FF8FA3', '#E8B93C'][i]} />
              <Circle cx={x} cy={58 + (i % 2) * 6} r={3} fill="#FFF3D6" />
            </React.Fragment>
          ))}
        </>
      );
    default:
      return null;
  }
}

function renderCatEars(hc: string) {
  return (
    <>
      <Polygon points="56,58 66,12 86,50" fill={hc} />
      <Polygon points="144,58 134,12 114,50" fill={hc} />
      <Polygon points="64,48 68,26 78,44" fill="#F49FB6" />
      <Polygon points="136,48 132,26 122,44" fill="#F49FB6" />
    </>
  );
}

function renderClosedEyes() {
  return (
    <>
      {[76, 124].map((cx) => (
        <Path key={cx} d={`M${cx - 10},114 Q${cx},119 ${cx + 10},114`} stroke={LASH} strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
    </>
  );
}

export default function AvatarRenderer({ config, size = 96, animated = false }: {
  config: AvatarConfig; size?: number; animated?: boolean;
}) {
  const gid = useId().replace(/:/g, '');
  const skin = SKINS[config.skin] ?? SKINS[0];
  const face = FACE_DIMS[config.face] ?? FACE_DIMS[0];
  const ec = EYE_COLORS[config.eyeColor] ?? EYE_COLORS[0];
  const hc = HAIR_COLORS[config.hairColor] ?? HAIR_COLORS[0];
  const [bg0, bg1] = BGS[config.bg] ?? BGS[0];

  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!animated) return;
    let close: ReturnType<typeof setTimeout>;
    const t = setInterval(() => {
      setBlink(true);
      close = setTimeout(() => setBlink(false), 150);
    }, 3800);
    return () => { clearInterval(t); clearTimeout(close); };
  }, [animated]);

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={bg0} />
          <Stop offset="1" stopColor={bg1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={200} height={200} fill={`url(#${gid})`} />
      {renderHairBack(config.hair, hc)}
      {/* body */}
      <Path d="M42,200 Q48,168 100,168 Q152,168 158,200 Z" fill="#4A3B8C" />
      <Rect x={90} y={146} width={20} height={26} fill={skin} />
      {/* ears */}
      <Circle cx={48} cy={114} r={9} fill={skin} />
      <Circle cx={152} cy={114} r={9} fill={skin} />
      {/* face */}
      <Ellipse cx={100} cy={108} rx={face.rx} ry={face.ry} fill={skin} />
      {config.accessory === 5 && renderCatEars(hc)}
      {renderBrows(config.brows)}
      {blink ? renderClosedEyes() : renderEyes(config.eyes, ec, skin)}
      <Circle cx={100} cy={134} r={2} fill="#000" opacity={0.12} />
      {renderMouth(config.mouth)}
      {renderHairFront(config.hair, hc)}
      {renderAccessory(config.accessory, hc)}
    </Svg>
  );
}
