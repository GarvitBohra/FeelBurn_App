import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { BurnColors } from './GlassCard';
import { LucideIcon, Flame, Footprints, Droplet } from 'lucide-react-native';

interface RingData {
  percentage: number; // 0 to 1
  color: string;
  radius: number;
  strokeWidth: number;
}

interface CircularProgressProps {
  caloriesPercent: number; // e.g., 0.65 for 65%
  stepsPercent: number;
  waterPercent: number;
  caloriesCount: number;
  stepsCount: number;
  waterCount: number;
}

export default function CircularProgress({
  caloriesPercent = 0,
  stepsPercent = 0,
  waterPercent = 0,
  caloriesCount = 0,
  stepsCount = 0,
  waterCount = 0
}: CircularProgressProps) {
  
  const size = 220;
  const center = size / 2;

  const rings: RingData[] = [
    {
      percentage: Math.min(Math.max(caloriesPercent, 0), 1),
      color: BurnColors.primary,
      radius: 85,
      strokeWidth: 12,
    },
    {
      percentage: Math.min(Math.max(stepsPercent, 0), 1),
      color: BurnColors.steps,
      radius: 65,
      strokeWidth: 12,
    },
    {
      percentage: Math.min(Math.max(waterPercent, 0), 1),
      color: BurnColors.water,
      radius: 45,
      strokeWidth: 12,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {rings.map((ring, index) => {
              const circumference = 2 * Math.PI * ring.radius;
              const strokeDashoffset = circumference - ring.percentage * circumference;

              return (
                <G key={index}>
                  {/* Track Ring (Background) */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    stroke={ring.color}
                    strokeWidth={ring.strokeWidth}
                    strokeOpacity={0.12}
                    fill="transparent"
                  />
                  {/* Progress Ring (Foreground) */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    stroke={ring.color}
                    strokeWidth={ring.strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </G>
              );
            })}
          </G>
        </Svg>

        {/* Center Icons overlay */}
        <View style={styles.centerTextContainer}>
          <Text style={styles.centerBrand}>FEEL</Text>
          <Text style={styles.centerBrandBurn}>BURN</Text>
          <Text style={styles.centerGoalText}>DAILY METRICS</Text>
        </View>
      </View>

      {/* Side Legend Indicator */}
      <View style={styles.legendContainer}>
        <LegendItem
          Icon={Flame}
          color={BurnColors.primary}
          label="Calories"
          value={`${caloriesCount} kcal`}
          percent={Math.round(caloriesPercent * 100)}
        />
        <LegendItem
          Icon={Footprints}
          color={BurnColors.steps}
          label="Steps"
          value={`${stepsCount} steps`}
          percent={Math.round(stepsPercent * 100)}
        />
        <LegendItem
          Icon={Droplet}
          color={BurnColors.water}
          label="Hydration"
          value={`${(waterCount / 1000).toFixed(1)} L`}
          percent={Math.round(waterPercent * 100)}
        />
      </View>
    </View>
  );
}

interface LegendItemProps {
  Icon: LucideIcon;
  color: string;
  label: string;
  value: string;
  percent: number;
}

function LegendItem({ Icon, color, label, value, percent }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Icon size={16} color={color} />
      </View>
      <View style={styles.legendInfo}>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendValue}>{value}</Text>
      </View>
      <Text style={[styles.legendPercent, { color }]}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
  },
  svgWrapper: {
    position: 'relative',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBrand: {
    color: '#8F90A6',
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '700',
  },
  centerBrandBurn: {
    color: BurnColors.primary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: -2,
    textShadowColor: BurnColors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  centerGoalText: {
    color: '#52546D',
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: '800',
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 5,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconBox: {
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  legendInfo: {
    flex: 1,
  },
  legendLabel: {
    color: '#8F90A6',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
});
