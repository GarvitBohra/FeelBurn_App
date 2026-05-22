import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FitnessService, UserProfile, DailyLog } from '../services/fitnessService';
import CircularProgress from '../components/CircularProgress';
import GlassCard, { BurnColors } from '../components/GlassCard';
import { Plus, Flame, Footprints, Droplet, CheckCircle2, Circle } from 'lucide-react-native';

const MOTIVATIONAL_QUOTES = [
  "No shortcuts, only workouts. Feel the burn!",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "What hurts today makes you stronger tomorrow.",
  "Success isn't always about greatness. It's about consistency.",
  "Hydrate. Train. Sleep. Sync. Repeat!"
];

export default function DashboardScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Refresh data whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadData() {
        try {
          const prof = await FitnessService.getProfile();
          const log = await FitnessService.getDailyLog(todayStr);
          if (isMounted) {
            setProfile(prof);
            setDailyLog(log);
            // Pick a random quote
            const randQ = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
            setQuote(randQ);
          }
        } catch (err) {
          console.error("Error loading dashboard data:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      loadData();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Quick Action handlers
  const handleQuickWater = async (amount: number) => {
    if (!dailyLog) return;
    const newWater = dailyLog.water + amount;
    const updated = await FitnessService.updateDailyLog(todayStr, { water: newWater });
    setDailyLog(updated);
  };

  const handleQuickSteps = async (amount: number) => {
    if (!dailyLog) return;
    const newSteps = dailyLog.steps + amount;
    // Calculate extra calories burned (approx. 0.04 calories per step)
    const newBurned = dailyLog.caloriesBurned + Math.round(amount * 0.045);
    const updated = await FitnessService.updateDailyLog(todayStr, { 
      steps: newSteps,
      caloriesBurned: newBurned 
    });
    setDailyLog(updated);
  };

  if (loading || !profile || !dailyLog) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BurnColors.primary} />
      </View>
    );
  }

  // Percentage calculations
  const calPercent = dailyLog.caloriesBurned / (profile.targets.calories || 2500);
  const stepsPercent = dailyLog.steps / (profile.targets.steps || 10000);
  const waterPercent = dailyLog.water / (profile.targets.water || 3000);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>CHAMPION MODE</Text>
            <Text style={styles.username}>{profile.displayName || "Burner"}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Motivational Banner */}
        <GlassCard style={styles.quoteCard}>
          <Text style={styles.quoteText}>"{quote}"</Text>
        </GlassCard>

        {/* Concentric Progress Rings Card */}
        <GlassCard style={styles.ringsCard}>
          <Text style={styles.cardHeader}>ACTIVITY LOGS</Text>
          <CircularProgress
            caloriesPercent={calPercent}
            stepsPercent={stepsPercent}
            waterPercent={waterPercent}
            caloriesCount={dailyLog.caloriesBurned}
            stepsCount={dailyLog.steps}
            waterCount={dailyLog.water}
          />
        </GlassCard>

        {/* One-Tap Increments */}
        <Text style={styles.sectionTitle}>QUICK INCREMENTS</Text>
        <View style={styles.incrementsRow}>
          
          {/* Add Hydration */}
          <TouchableOpacity 
            style={[styles.incrementButton, { borderColor: BurnColors.water }]}
            onPress={() => handleQuickWater(250)}
          >
            <Droplet size={18} color={BurnColors.water} />
            <Text style={styles.incText}>+250ml Water</Text>
            <View style={[styles.plusIconBadge, { backgroundColor: BurnColors.water }]}>
              <Plus size={10} color="#000" />
            </View>
          </TouchableOpacity>

          {/* Add steps */}
          <TouchableOpacity 
            style={[styles.incrementButton, { borderColor: BurnColors.steps }]}
            onPress={() => handleQuickSteps(1000)}
          >
            <Footprints size={18} color={BurnColors.steps} />
            <Text style={styles.incText}>+1,000 Steps</Text>
            <View style={[styles.plusIconBadge, { backgroundColor: BurnColors.steps }]}>
              <Plus size={10} color="#000" />
            </View>
          </TouchableOpacity>

        </View>

        {/* Daily Checklist Checklist */}
        <GlassCard style={styles.checklistCard}>
          <Text style={styles.cardHeader}>DAILY MILESTONES</Text>
          
          <ChecklistItem
            title="Hydration Target Met"
            description={`Drink ${profile.targets.water / 1000}L water today`}
            completed={dailyLog.water >= profile.targets.water}
            color={BurnColors.water}
          />

          <ChecklistItem
            title="Daily Steps Target"
            description={`Hit ${profile.targets.steps.toLocaleString()} active steps`}
            completed={dailyLog.steps >= profile.targets.steps}
            color={BurnColors.steps}
          />

          <ChecklistItem
            title="Calorie Burning Goal"
            description={`Log ${profile.targets.calories} kcal of physical work`}
            completed={dailyLog.caloriesBurned >= profile.targets.calories}
            color={BurnColors.primary}
          />

          <ChecklistItem
            title="Active Session Completed"
            description="Complete any routine in the Workouts catalog"
            completed={dailyLog.workoutsCompleted.length > 0}
            color={BurnColors.accent}
          />
        </GlassCard>

      </ScrollView>
    </SafeAreaView>
  );
}

interface ChecklistItemProps {
  title: string;
  description: string;
  completed: boolean;
  color: string;
}

function ChecklistItem({ title, description, completed, color }: ChecklistItemProps) {
  return (
    <View style={styles.checkItem}>
      {completed ? (
        <CheckCircle2 size={20} color={color} style={styles.checkIcon} />
      ) : (
        <Circle size={20} color="#52546D" style={styles.checkIcon} />
      )}
      <View style={styles.checkDetails}>
        <Text style={[styles.checkTitle, completed && { color: '#FFFFFF', textDecorationLine: 'none' }]}>
          {title}
        </Text>
        <Text style={styles.checkDesc}>{description}</Text>
      </View>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  greeting: {
    color: BurnColors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quoteCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  quoteText: {
    color: '#A0A2B5',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  ringsCard: {
    alignItems: 'center',
  },
  cardHeader: {
    color: '#52546D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#8F90A6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: -4,
  },
  incrementsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  incrementButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: 'relative',
    height: 52,
  },
  incText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
  },
  plusIconBadge: {
    position: 'absolute',
    right: 12,
    top: 17,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistCard: {
    paddingBottom: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  checkIcon: {
    marginRight: 14,
  },
  checkDetails: {
    flex: 1,
  },
  checkTitle: {
    color: '#8F90A6',
    fontSize: 13,
    fontWeight: '700',
  },
  checkDesc: {
    color: '#52546D',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});
