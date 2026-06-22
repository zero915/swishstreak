import { StyleSheet, View } from 'react-native';
import {
  getLevelNodeOffset,
  MAP_NODE_SIZE,
  MAP_NODE_VERTICAL_GAP,
} from '../constants/campaignLevels';

interface CampaignMapPathProps {
  fromLevel: number;
  toLevel: number;
  mapWidth: number;
  color: string;
}

function nodeCenter(levelId: number, mapWidth: number) {
  const x = mapWidth / 2 + getLevelNodeOffset(levelId);
  const y = (levelId - 1) * MAP_NODE_VERTICAL_GAP + MAP_NODE_SIZE / 2;
  return { x, y };
}

export function CampaignMapPath({ fromLevel, toLevel, mapWidth, color }: CampaignMapPathProps) {
  const from = nodeCenter(fromLevel, mapWidth);
  const to = nodeCenter(toLevel, mapWidth);

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const curveOffset = getLevelNodeOffset(toLevel) === 0 ? 0 : dx > 0 ? 18 : -18;

  return (
    <>
      <View
        style={[
          styles.segment,
          {
            left: from.x,
            top: from.y,
            width: length * 0.52,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      />
      <View
        style={[
          styles.knot,
          {
            left: midX + curveOffset - 6,
            top: midY - 6,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.segment,
          {
            left: midX + curveOffset,
            top: midY,
            width: length * 0.52,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    opacity: 0.55,
    transformOrigin: 'left center',
  },
  knot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.7,
  },
});
