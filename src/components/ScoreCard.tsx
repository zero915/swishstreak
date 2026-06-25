import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScoreCardProps {
  displayName: string;
  score: number;
  streak: number;
  inviteCode?: string;
}

/**
 * A styled, shareable score card. Rendered off-screen and captured to a PNG by
 * react-native-view-shot (see services/scoreCardShare.ts). Keep it a fixed size so
 * the exported image looks consistent.
 */
export const ScoreCard = forwardRef<View, ScoreCardProps>(({ displayName, score, streak, inviteCode }, ref) => {
  return (
    <View ref={ref} collapsable={false} style={styles.wrap}>
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.card}>
        <Text style={styles.app}>SWISH STREAK</Text>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.streak}>🔥 Best streak {streak}</Text>
        {inviteCode ? <Text style={styles.invite}>Beat me — code {inviteCode}</Text> : null}
      </LinearGradient>
    </View>
  );
});
ScoreCard.displayName = 'ScoreCard';

const styles = StyleSheet.create({
  wrap: { width: 360, height: 480 },
  card: { flex: 1, borderRadius: 24, padding: 28, alignItems: 'center', justifyContent: 'center' },
  app: { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '800', letterSpacing: 3, marginBottom: 24 },
  name: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', marginBottom: 28 },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  score: { color: '#FFFFFF', fontSize: 92, fontWeight: '900', marginVertical: 4 },
  streak: { color: '#FFE082', fontSize: 22, fontWeight: '800', marginTop: 16 },
  invite: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', marginTop: 28 },
});
