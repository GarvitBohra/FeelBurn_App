import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BurnColors } from './GlassCard';
import { Play, Pause, Square, SkipForward, Award } from 'lucide-react-native';

export interface Exercise {
  name: string;
  reps: string;
  sets: number;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  category: string;
  level: string;
  durationMin: number;
  estCalories: number;
  exercises: Exercise[];
}

interface ActiveTimerProps {
  visible: boolean;
  workout: WorkoutRoutine | null;
  onClose: (completed: boolean, caloriesBurned: number) => void;
}

export default function ActiveTimer({ visible, workout, onClose }: ActiveTimerProps) {
  if (!workout) return null;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState(45); // 45 seconds work interval by default
  const [isActive, setIsActive] = useState(true);
  const [isResting, setIsResting] = useState(false);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  const durationLimit = 45; // seconds per set
  const restLimit = 15;     // rest time
  
  const timerRef = useRef<any>(null);

  const currentExercise = workout.exercises[currentIdx];

  // Timer loop
  useEffect(() => {
    if (visible) {
      setIsActive(true);
      setCurrentIdx(0);
      setCurrentSet(1);
      setSecondsRemaining(durationLimit);
      setIsResting(false);
      setTotalElapsedSeconds(0);
      setCaloriesBurned(0);
    }
  }, [visible, workout]);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setSecondsRemaining(prev => prev - 1);
        setTotalElapsedSeconds(prev => prev + 1);
        // Approximately 8 calories burned per minute of active workout (8 / 60 per second)
        setCaloriesBurned(prev => Math.round((totalElapsedSeconds + 1) * 0.15));
      }, 1000);
    } else if (secondsRemaining === 0) {
      if (!isResting) {
        // Switch to rest
        setIsResting(true);
        setSecondsRemaining(restLimit);
      } else {
        // Rest over, next set or next exercise
        setIsResting(false);
        if (currentSet < currentExercise.sets) {
          setCurrentSet(prev => prev + 1);
          setSecondsRemaining(durationLimit);
        } else {
          // Go to next exercise
          if (currentIdx < workout.exercises.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setCurrentSet(1);
            setSecondsRemaining(durationLimit);
          } else {
            // Workout finished!
            handleFinish(true);
          }
        }
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, secondsRemaining, isResting]);

  const togglePause = () => {
    setIsActive(!isActive);
  };

  const handleSkip = () => {
    if (currentIdx < workout.exercises.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setCurrentSet(1);
      setSecondsRemaining(durationLimit);
      setIsResting(false);
    } else {
      handleFinish(true);
    }
  };

  const handleFinish = (completed: boolean) => {
    setIsActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    // return calories burned
    const finalCals = caloriesBurned || Math.round(totalElapsedSeconds * 0.15);
    onClose(completed, finalCals);
  };

  // SVG dimensions
  const size = 180;
  const radius = 75;
  const strokeWidth = 10;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const currentLimit = isResting ? restLimit : durationLimit;
  const percentage = secondsRemaining / currentLimit;
  const strokeDashoffset = circumference - percentage * circumference;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.modalBg}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{workout.title.toUpperCase()}</Text>
          <Text style={styles.headerCategory}>{workout.category} • {workout.level}</Text>
        </View>

        {/* Dynamic State Banner */}
        <View style={[styles.stateBanner, { backgroundColor: isResting ? `${BurnColors.water}15` : `${BurnColors.primary}15` }]}>
          <Text style={[styles.stateText, { color: isResting ? BurnColors.water : BurnColors.primary }]}>
            {isResting ? "REST & HYDRATE" : "ACTIVE EXERCISE SET"}
          </Text>
        </View>

        {/* Circular Countdown Timer */}
        <View style={styles.timerWrapper}>
          <Svg width={size} height={size}>
            {/* Background Circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Circular Arc */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isResting ? BurnColors.water : BurnColors.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              rotation="-90"
              origin={`${center}, ${center}`}
            />
          </Svg>

          {/* Core countdown seconds overlay */}
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownNumber}>{secondsRemaining}</Text>
            <Text style={styles.countdownLabel}>seconds left</Text>
          </View>
        </View>

        {/* Exercise Details Card */}
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <Text style={styles.exerciseStats}>
            Set <Text style={styles.highlightText}>{currentSet}</Text> of {currentExercise.sets} • {currentExercise.reps}
          </Text>

          {/* Up Next Preview */}
          {currentIdx < workout.exercises.length - 1 ? (
            <View style={styles.nextUpBox}>
              <Text style={styles.nextUpLabel}>UP NEXT:</Text>
              <Text style={styles.nextUpName}>{workout.exercises[currentIdx + 1].name}</Text>
            </View>
          ) : (
            <View style={styles.nextUpBox}>
              <Text style={styles.nextUpLabel}>FINAL EXERCISE</Text>
            </View>
          )}
        </View>

        {/* Live Counters */}
        <View style={styles.countersRow}>
          <View style={styles.counterBox}>
            <Text style={styles.counterTitle}>TIME ELAPSED</Text>
            <Text style={styles.counterValue}>{formatTime(totalElapsedSeconds)}</Text>
          </View>
          <View style={styles.counterBox}>
            <Text style={styles.counterTitle}>ENERGY BURNED</Text>
            <Text style={[styles.counterValue, { color: BurnColors.primary }]}>
              {caloriesBurned} <Text style={styles.smallUnit}>kcal</Text>
            </Text>
          </View>
        </View>

        {/* Action Button Controls */}
        <View style={styles.controlsRow}>
          {/* Skip / Next */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <SkipForward size={24} color="#FFFFFF" />
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            onPress={togglePause}
            style={[
              styles.playButton,
              { backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : BurnColors.primary }
            ]}
          >
            {isActive ? (
              <Pause size={28} color="#FFFFFF" />
            ) : (
              <Play size={28} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Stop / Complete */}
          <TouchableOpacity onPress={() => handleFinish(false)} style={styles.quitButton}>
            <Square size={20} color="#FF3B30" />
            <Text style={[styles.skipText, { color: '#FF3B30' }]}>Quit</Text>
          </TouchableOpacity>
        </View>

        {/* Complete Immediately Trigger */}
        <TouchableOpacity
          onPress={() => handleFinish(true)}
          style={[styles.finishInstantBtn, { borderColor: BurnColors.steps }]}
        >
          <Award size={18} color={BurnColors.steps} />
          <Text style={[styles.finishInstantText, { color: BurnColors.steps }]}>
            FINISH & LOG NOW
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: BurnColors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerCategory: {
    color: BurnColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  stateBanner: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  stateText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  timerWrapper: {
    position: 'relative',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '900',
  },
  countdownLabel: {
    color: '#52546D',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -4,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  exerciseStats: {
    color: BurnColors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  highlightText: {
    color: BurnColors.primary,
    fontWeight: '800',
  },
  nextUpBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: 15,
    paddingTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  nextUpLabel: {
    color: '#52546D',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nextUpName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.7,
  },
  countersRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 15,
  },
  counterBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  counterTitle: {
    color: '#52546D',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  counterValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  smallUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: BurnColors.textSecondary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 10,
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BurnColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  quitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  skipText: {
    color: BurnColors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  finishInstantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(57, 255, 20, 0.06)',
    width: '100%',
    gap: 8,
  },
  finishInstantText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
