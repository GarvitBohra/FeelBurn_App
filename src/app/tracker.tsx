import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { FitnessService, UserProfile, DailyLog } from '../services/fitnessService';
import GlassCard, { BurnColors } from '../components/GlassCard';
import { Plus, Minus, Scale, Flame, Calendar, ChevronRight } from 'lucide-react-native';

export default function TrackerScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [history, setHistory] = useState<{ date: string; log: DailyLog }[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [weightInput, setWeightInput] = useState('');
  const [calorieInput, setCalorieInput] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const prof = await FitnessService.getProfile();
      const log = await FitnessService.getDailyLog(todayStr);
      const hist = await FitnessService.getRecentHistory(7);
      
      setProfile(prof);
      setDailyLog(log);
      setHistory(hist);
      
      if (log.weight) {
        setWeightInput(log.weight.toString());
      } else {
        setWeightInput(prof.targets.weight.toString());
      }
    } catch (err) {
      console.error("Error loading tracker data:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSaveWeight = async () => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    
    setLoading(true);
    await FitnessService.updateDailyLog(todayStr, { weight: val });
    // Also save in user profile as current benchmark weight
    if (profile) {
      const updatedProfile = { ...profile };
      updatedProfile.targets.weight = val;
      await FitnessService.saveProfile(updatedProfile);
    }
    await loadData();
  };

  const handleAddCalories = async (cals: number) => {
    if (!dailyLog) return;
    const newConsumed = dailyLog.caloriesConsumed + cals;
    setLoading(true);
    await FitnessService.updateDailyLog(todayStr, { caloriesConsumed: newConsumed });
    await loadData();
  };

  const handleCustomCalories = async () => {
    const val = parseInt(calorieInput);
    if (isNaN(val) || val <= 0) return;
    await handleAddCalories(val);
    setCalorieInput('');
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BurnColors.primary} />
      </View>
    );
  }

  // -------------------------------------------------------------
  // CUSTOM 100% SECURE SVG LINE CHART GENERATION (7 Days History)
  // -------------------------------------------------------------
  const chartHeight = 120;
  const chartWidth = 320;
  const paddingX = 25;
  const paddingY = 20;

  // Extract weights. If a day has no weight, fall back to target weight.
  const chartPoints = history.map((item, idx) => {
    const weightVal = item.log.weight || profile?.targets.weight || 75;
    return {
      x: paddingX + (idx * (chartWidth - paddingX * 2)) / 6,
      weight: weightVal,
      dateLabel: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    };
  });

  const weightsList = chartPoints.map(p => p.weight);
  const maxW = Math.max(...weightsList, (profile?.targets.weight || 75) + 2) + 0.5;
  const minW = Math.min(...weightsList, (profile?.targets.weight || 75) - 2) - 0.5;
  const range = maxW - minW || 1;

  // Map weights to Y coordinates
  const pointsWithY = chartPoints.map(p => {
    const relativeY = (p.weight - minW) / range;
    // Y inverted in SVG: 0 at top, chartHeight at bottom
    const y = chartHeight - paddingY - relativeY * (chartHeight - paddingY * 2);
    return { ...p, y };
  });

  // Assemble path string
  let pathD = '';
  if (pointsWithY.length > 0) {
    pathD = `M ${pointsWithY[0].x} ${pointsWithY[0].y}`;
    for (let i = 1; i < pointsWithY.length; i++) {
      pathD += ` L ${pointsWithY[i].x} ${pointsWithY[i].y}`;
    }
  }

  // Path closure for fill gradient
  const fillD = pathD 
    ? `${pathD} L ${pointsWithY[pointsWithY.length - 1].x} ${chartHeight - paddingY} L ${pointsWithY[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Banner Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROGRESS TRACKER</Text>
          <Text style={styles.headerDesc}>Log weight entries & calorie intake</Text>
        </View>

        {/* 1. Custom weight history line graph */}
        <GlassCard style={styles.chartCard}>
          <Text style={styles.cardHeader}>WEIGHT LOG HISTORY (7 DAYS)</Text>
          
          <View style={styles.chartWrapper}>
            {pointsWithY.length > 0 ? (
              <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <Defs>
                  {/* Fill Under Gradient */}
                  <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={BurnColors.water} stopOpacity={0.35} />
                    <Stop offset="100%" stopColor={BurnColors.water} stopOpacity={0.0} />
                  </LinearGradient>
                </Defs>

                {/* Grid Lines */}
                <Path
                  d={`M ${paddingX} ${chartHeight - paddingY} L ${chartWidth - paddingX} ${chartHeight - paddingY}`}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <Path
                  d={`M ${paddingX} ${paddingY} L ${chartWidth - paddingX} ${paddingY}`}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />

                {/* Closed Gradient Area */}
                {fillD !== '' && (
                  <Path d={fillD} fill="url(#chartGradient)" />
                )}

                {/* Main Curve Line */}
                {pathD !== '' && (
                  <Path d={pathD} fill="none" stroke={BurnColors.water} strokeWidth="2.5" />
                )}

                {/* Active Glowing Milestone Points */}
                {pointsWithY.map((pt, idx) => (
                  <Circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill={BurnColors.water}
                    stroke="#09090E"
                    strokeWidth="1.5"
                  />
                ))}

                {/* X Axis Labels */}
                {pointsWithY.map((pt, idx) => (
                  <SvgText
                    key={`label-${idx}`}
                    x={pt.x}
                    y={chartHeight - 4}
                    fill="#52546D"
                    fontSize="8"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {pt.dateLabel}
                  </SvgText>
                ))}

                {/* Current Values tags over points */}
                {pointsWithY.map((pt, idx) => (
                  <SvgText
                    key={`val-${idx}`}
                    x={pt.x}
                    y={pt.y - 8}
                    fill="#FFFFFF"
                    fontSize="7"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {pt.weight.toFixed(1)}
                  </SvgText>
                ))}
              </Svg>
            ) : (
              <ActivityIndicator color={BurnColors.primary} />
            )}
          </View>
        </GlassCard>

        {/* 2. Log weight dialog card */}
        <GlassCard style={styles.card}>
          <View style={styles.rowHeader}>
            <Scale size={20} color={BurnColors.water} />
            <Text style={styles.sectionTitleText}>WEIGHT DIARY</Text>
          </View>
          
          <Text style={styles.sectionDescText}>
            Current benchmark: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{profile?.targets.weight} kg</Text>
          </Text>

          <View style={styles.inputRow}>
            {/* Decrement */}
            <TouchableOpacity 
              style={styles.stepBtn}
              onPress={() => {
                const cur = parseFloat(weightInput) || 75;
                setWeightInput((cur - 0.1).toFixed(1));
              }}
            >
              <Minus size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              textAlign="center"
            />
            <Text style={styles.unitText}>kg</Text>

            {/* Increment */}
            <TouchableOpacity 
              style={styles.stepBtn}
              onPress={() => {
                const cur = parseFloat(weightInput) || 75;
                setWeightInput((cur + 0.1).toFixed(1));
              }}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: BurnColors.water }]}
            onPress={handleSaveWeight}
          >
            <Text style={styles.saveBtnText}>LOG CURRENT WEIGHT</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 3. Log food calories card */}
        <GlassCard style={styles.card}>
          <View style={styles.rowHeader}>
            <Flame size={20} color={BurnColors.primary} />
            <Text style={styles.sectionTitleText}>CALORIE COUNTER</Text>
          </View>

          <Text style={styles.sectionDescText}>
            Logged today: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{dailyLog?.caloriesConsumed} kcal</Text>
          </Text>

          {/* Quick Logs */}
          <View style={styles.quickFoodRow}>
            <TouchableOpacity 
              style={[styles.foodChip, { borderColor: 'rgba(255,255,255,0.06)' }]}
              onPress={() => handleAddCalories(150)}
            >
              <Text style={styles.foodChipText}>+150 kcal Snacked</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.foodChip, { borderColor: 'rgba(255,255,255,0.06)' }]}
              onPress={() => handleAddCalories(500)}
            >
              <Text style={styles.foodChipText}>+500 kcal Lean Meal</Text>
            </TouchableOpacity>
          </View>

          {/* Custom calorie logger */}
          <View style={styles.customCalorieRow}>
            <TextInput
              style={[styles.textInput, styles.calTextInput]}
              placeholder="Custom Calorie Amount..."
              placeholderTextColor={BurnColors.textMuted}
              keyboardType="number-pad"
              value={calorieInput}
              onChangeText={setCalorieInput}
            />
            <TouchableOpacity 
              style={styles.logCalBtn}
              onPress={handleCustomCalories}
            >
              <Text style={styles.logCalText}>LOG MEAL</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: BurnColors.background,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginTop: 10,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerDesc: {
    color: BurnColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  chartCard: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cardHeader: {
    color: '#52546D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
  },
  chartWrapper: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    gap: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionDescText: {
    color: BurnColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: -4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 4,
  },
  stepBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 14,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    width: 100,
    height: 48,
  },
  unitText: {
    color: BurnColors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: -4,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BurnColors.water,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  quickFoodRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 2,
  },
  foodChip: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  customCalorieRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    height: 48,
  },
  calTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    width: undefined,
    height: '100%',
  },
  logCalBtn: {
    backgroundColor: BurnColors.primary,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BurnColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logCalText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
