import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Spacing } from '../constants/theme';

export const BurnColors = {
  background: '#09090E',
  cardBg: 'rgba(20, 20, 32, 0.75)',
  cardBorder: 'rgba(255, 255, 255, 0.09)',
  primary: '#FF5E3A', // Fire Burn Orange
  primaryGlow: 'rgba(255, 94, 58, 0.25)',
  water: '#00F2FE', // Hydration Cyan
  waterGlow: 'rgba(0, 242, 254, 0.25)',
  steps: '#39FF14', // Energy Lime Green
  stepsGlow: 'rgba(57, 255, 20, 0.25)',
  accent: '#A020F0', // Calorie Consumption Violet
  accentGlow: 'rgba(160, 32, 240, 0.25)',
  text: '#FFFFFF',
  textSecondary: '#A0A2B5',
  textMuted: '#52546D',
  cardBgHeader: 'rgba(30, 30, 48, 0.95)',
};

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BurnColors.cardBg,
    borderColor: BurnColors.cardBorder,
    borderWidth: 1,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
});
