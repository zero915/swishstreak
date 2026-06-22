import { StyleSheet, Text, View } from 'react-native';
import { CampaignZone } from '../constants/campaignLevels';

interface CampaignZoneHeaderProps {
  zone: CampaignZone;
  levelStart: number;
}

export function CampaignZoneHeader({ zone, levelStart }: CampaignZoneHeaderProps) {
  const levelEnd = levelStart + 9;
  return (
    <View style={[styles.banner, { backgroundColor: zone.color }]}>
      <View style={[styles.accent, { backgroundColor: zone.secondaryColor }]} />
      <View style={styles.textWrap}>
        <Text style={styles.chapter}>Chapter {zone.id + 1}</Text>
        <Text style={styles.title}>{zone.name}</Text>
        <Text style={styles.range}>
          Levels {levelStart}–{levelEnd}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginVertical: 20,
    marginHorizontal: 8,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  accent: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.35,
  },
  textWrap: {
    gap: 2,
  },
  chapter: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  range: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
