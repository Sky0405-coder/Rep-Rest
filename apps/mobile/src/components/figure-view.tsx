import { poseAt, type Figure, type Pose } from '@workout/core';
import { useEffect, useState } from 'react';
import Svg, { Circle, G, Line } from 'react-native-svg';

const SEGMENTS: [keyof Pose, keyof Pose][] = [
  ['neck', 'hip'],
  ['neck', 'lElbow'],
  ['lElbow', 'lHand'],
  ['neck', 'rElbow'],
  ['rElbow', 'rHand'],
  ['hip', 'lKnee'],
  ['lKnee', 'lFoot'],
  ['hip', 'rKnee'],
  ['rKnee', 'rFoot'],
];

type Props = {
  figure: Figure | undefined;
  size: number;
  color: string;
  /** Linienfarbe für Boden und Hilfsobjekte. */
  mutedColor: string;
  animate?: boolean;
};

/** Zeichnet die Strichfigur einer Übung, auf Wunsch animiert. */
export function FigureView({ figure, size, color, mutedColor, animate = false }: Props) {
  const [time, setTime] = useState(0);
  const moving = animate && !!figure && figure.frames.length > 1;

  useEffect(() => {
    if (!moving) return;
    let frame = 0;
    const start = Date.now();
    const loop = () => {
      setTime((Date.now() - start) / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [moving]);

  if (!figure) return null;
  const pose = moving ? poseAt(figure, time) : figure.frames[0]!;

  return (
    <Svg width={size} height={size} viewBox="-5 -8 110 108">
      <Line x1={0} y1={95} x2={100} y2={95} stroke={mutedColor} strokeWidth={1.5} strokeLinecap="round" />
      {figure.props.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={mutedColor} strokeWidth={2.5} strokeLinecap="round" />
      ))}
      <G stroke={color} strokeWidth={5} strokeLinecap="round">
        {SEGMENTS.map(([a, b]) => (
          <Line key={`${a}-${b}`} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]} />
        ))}
      </G>
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={7} fill={color} />
    </Svg>
  );
}
