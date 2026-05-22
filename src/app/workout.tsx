import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import GlassCard, { BurnColors } from '../components/GlassCard';
import ActiveTimer, { WorkoutRoutine } from '../components/ActiveTimer';
import { FitnessService } from '../services/fitnessService';
import { Play, Flame, Clock, Award, Dumbbell } from 'lucide-react-native';

const GYM_WORKOUTS: WorkoutRoutine[] = [
  {
    id: 'db_power',
    title: 'Dumbbell Power Burn',
    category: 'Full Body Sculpt',
    level: 'Intermediate',
    durationMin: 20,
    estCalories: 250,
    exercises: [
      { name: 'Goblet Squats', reps: '10 reps', sets: 3 },
      { name: 'Shoulder Press', reps: '12 reps', sets: 3 },
      { name: 'Dumbbell Bent-Over Row', reps: '10 reps', sets: 3 },
      { name: 'Dumbbell Hammer Curls', reps: '12 reps', sets: 3 }
    ]
  },
  {
    id: 'bb_strength',
    title: 'Barbell Strength Sculpt',
    category: 'Heavy Compound Lift',
    level: 'Advanced',
    durationMin: 30,
    estCalories: 380,
    exercises: [
      { name: 'Barbell Deadlift', reps: '5 reps', sets: 4 },
      { name: 'Barbell Bench Press', reps: '8 reps', sets: 3 },
      { name: 'Barbell Back Squat', reps: '8 reps', sets: 3 },
      { name: 'Barbell Overhead Press', reps: '8 reps', sets: 3 }
    ]
  },
  {
    id: 'cable_isolate',
    title: 'Cable Muscle Isolation',
    category: 'Hypertrophy Focus',
    level: 'Beginner',
    durationMin: 15,
    estCalories: 160,
    exercises: [
      { name: 'Lat Pulldown', reps: '12 reps', sets: 3 },
      { name: 'Cable Chest Flyes', reps: '12 reps', sets: 3 },
      { name: 'Cable Face Pulls', reps: '15 reps', sets: 3 },
      { name: 'Tricep Pushdowns', reps: '15 reps', sets: 3 }
    ]
  }
];

export default function WorkoutScreen() {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRoutine | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [completedStats, setCompletedStats] = useState<{ active: boolean; title: string; cals: number } | null>(null);

  const startWorkout = (workout: WorkoutRoutine) => {
    setSelectedWorkout(workout);
    setTimerVisible(true);
    setCompletedStats(null);
  };

  const handleTimerClose = async (completed: boolean, caloriesBurned: number) => {
    setTimerVisible(false);
    
    if (completed && selectedWorkout) {
      // Sync results to database daily log
      const todayStr = new Date().toISOString().split('T')[0];
      try {
        const currentLog = await FitnessService.getDailyLog(todayStr);
        const updatedWorkouts = [...currentLog.workoutsCompleted, selectedWorkout.title];
        const updatedCalories = currentLog.caloriesBurned + caloriesBurned;
        
        await FitnessService.updateDailyLog(todayStr, {
          workoutsCompleted: updatedWorkouts,
          caloriesBurned: updatedCalories
        });

        // Trigger gorgeous custom congrats toast!
        setCompletedStats({
          active: true,
          title: selectedWorkout.title,
          cals: caloriesBurned
        });
      } catch (err) {
        console.error("Failed to save completed workout results:", err);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Banner Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WORKOUTS</Text>
          <Text style={styles.headerDesc}>Select a gym routine to start live tracking</Text>
        </View>

        {/* Completion Congratulations Toast Overlay */}
        {completedStats?.active && (
          <GlassCard style={[styles.congratsCard, { borderColor: BurnColors.steps }]}>
            <View style={styles.congratsIconWrapper}>
              <Award size={28} color={BurnColors.steps} />
            </View>
            <View style={styles.congratsDetails}>
              <Text style={styles.congratsTitle}>SESSION CRUSHED!</Text>
              <Text style={styles.congratsDesc}>
                Completed <Text style={styles.highlightText}>{completedStats.title}</Text>
              </Text>
              <Text style={styles.congratsCals}>
                Burned <Text style={{ color: BurnColors.primary, fontWeight: '800' }}>+{completedStats.cals} kcal</Text>
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeCongratsBtn}
              onPress={() => setCompletedStats(null)}
            >
              <Text style={styles.closeCongratsText}>Dismiss</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* List of Pre-loaded routines */}
        <View style={styles.workoutList}>
          {GYM_WORKOUTS.map((workout) => (
            <GlassCard key={workout.id} style={styles.workoutCard}>
              <View style={styles.cardInfo}>
                {/* Upper row details */}
                <View style={styles.upperStats}>
                  <View style={[styles.badge, styles.levelBadge]}>
                    <Text style={styles.badgeText}>{workout.level}</Text>
                  </View>
                  <View style={styles.chipRow}>
                    <View style={styles.chip}>
                      <Clock size={10} color={BurnColors.textSecondary} />
                      <Text style={styles.chipText}>{workout.durationMin} Min</Text>
                    </View>
                    <View style={styles.chip}>
                      <Flame size={10} color={BurnColors.primary} />
                      <Text style={styles.chipText}>{workout.estCalories} kcal</Text>
                    </View>
                  </View>
                </View>

                {/* Workout Title */}
                <Text style={styles.workoutTitle}>{workout.title}</Text>
                <Text style={styles.workoutCategory}>{workout.category}</Text>

                {/* Small preview of exercises */}
                <View style={styles.previewBox}>
                  <Dumbbell size={11} color="#52546D" />
                  <Text style={styles.previewText} numberOfLines={1}>
                    {workout.exercises.map(ex => ex.name).join('  •  ')}
                  </Text>
                </View>
              </View>

              {/* Start Button CTA */}
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => startWorkout(workout)}
              >
                <Play size={16} color="#000000" />
                <Text style={styles.startBtnText}>START ROUTINE</Text>
              </TouchableOpacity>
            </GlassCard>
          ))}
        </View>

        {/* Dynamic Timer overlay sheet */}
        <ActiveTimer
          visible={timerVisible}
          workout={selectedWorkout}
          onClose={handleTimerClose}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  congratsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(57, 255, 20, 0.04)',
    borderWidth: 1.5,
    marginVertical: 4,
  },
  congratsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  congratsDetails: {
    flex: 1,
  },
  congratsTitle: {
    color: BurnColors.steps,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  congratsDesc: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  highlightText: {
    color: BurnColors.water,
    fontWeight: '800',
  },
  congratsCals: {
    color: '#A0A2B5',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeCongratsBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  closeCongratsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  workoutList: {
    gap: 16,
  },
  workoutCard: {
    padding: 18,
    borderRadius: 22,
    gap: 14,
  },
  cardInfo: {
    gap: 6,
  },
  upperStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  workoutCategory: {
    color: BurnColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  previewText: {
    color: '#52546D',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  startBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  startBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
