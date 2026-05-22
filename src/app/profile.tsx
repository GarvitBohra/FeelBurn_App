import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FitnessService, UserProfile } from '../services/fitnessService';
import { isFirebaseConfigured, auth, mockAuth } from '../config/firebase';
import GlassCard, { BurnColors } from '../components/GlassCard';
import { User, LogOut, Settings, ShieldCheck, HelpCircle, Save } from 'lucide-react-native';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [targetSteps, setTargetSteps] = useState('');
  const [targetWater, setTargetWater] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  const loadProfileData = async () => {
    try {
      const prof = await FitnessService.getProfile();
      setProfile(prof);
      setDisplayName(prof.displayName);
      setTargetSteps(prof.targets.steps.toString());
      setTargetWater(prof.targets.water.toString());
      setTargetCalories(prof.targets.calories.toString());
      setTargetWeight(prof.targets.weight.toString());
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    const steps = parseInt(targetSteps);
    const water = parseInt(targetWater);
    const calories = parseInt(targetCalories);
    const weight = parseFloat(targetWeight);

    if (isNaN(steps) || isNaN(water) || isNaN(calories) || isNaN(weight)) {
      Alert.alert("Invalid Targets", "Please enter numerical values for all target settings.");
      return;
    }

    setLoading(true);

    const updatedProfile: UserProfile = {
      ...profile,
      displayName: displayName || profile.displayName,
      targets: {
        steps,
        water,
        calories,
        weight
      }
    };

    try {
      await FitnessService.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      Alert.alert("Success", "Your fitness goals and profile details have been saved successfully!");
    } catch (err) {
      console.error("Error saving profile details:", err);
      Alert.alert("Error", "Could not save your goals to the cloud. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "End Session",
      "Are you sure you want to log out of FeelBurn?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              if (isFirebaseConfigured && auth) {
                await auth.signOut();
              } else {
                await mockAuth.logout();
              }
            } catch (err) {
              console.error("Error logging out:", err);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "⚠️ Permanently Delete Account?",
      "Are you absolutely sure? This will permanently wipe your profile records, daily logs, steps, calorie logs, and active session history from our database and local caches. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete My Data", 
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Irreversible Action",
              "To confirm, click 'Confirm Permanent Deletion' below. Your session will end immediately and all your data will be scrubbed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm Permanent Deletion",
                  style: "destructive",
                  onPress: async () => {
                    setLoading(true);
                    try {
                      await FitnessService.deleteAccount();
                      Alert.alert("Account Deleted", "Your account and data have been successfully deleted.");
                    } catch (err: any) {
                      console.error("Error during account deletion:", err);
                      Alert.alert(
                        "Deletion Error",
                        err.message || "Could not delete account. If you signed in a long time ago, please log out, log in again, and retry."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BurnColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Banner Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE SETTINGS</Text>
          <Text style={styles.headerDesc}>Configure daily targets and database syncing</Text>
        </View>

        {/* 1. Database Connection HUD Status */}
        <GlassCard style={[styles.hudCard, isFirebaseConfigured ? styles.hudOnline : styles.hudSandbox]}>
          <View style={styles.hudRow}>
            {isFirebaseConfigured ? (
              <ShieldCheck size={24} color={BurnColors.steps} />
            ) : (
              <HelpCircle size={24} color="#F5A623" />
            )}
            <View style={styles.hudDetails}>
              <Text style={[styles.hudStatusText, { color: isFirebaseConfigured ? BurnColors.steps : '#F5A623' }]}>
                {isFirebaseConfigured ? "SECURE CLOUD SYNC ACTIVE" : "OFFLINE SANDBOX INSTANCE"}
              </Text>
              <Text style={styles.hudDescText}>
                {isFirebaseConfigured 
                  ? "Real-time synchronization with Firebase Auth and Google Firestore active."
                  : "All workouts and daily logs are secured locally inside AsyncStorage."}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* 2. Profile Details Form */}
        <GlassCard style={styles.card}>
          <View style={styles.rowHeader}>
            <User size={20} color={BurnColors.primary} />
            <Text style={styles.sectionTitleText}>PERSONAL DETAILS</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your Champion Name..."
              placeholderTextColor={BurnColors.textMuted}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Registered Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={profile?.email || "champ@feelburn.com"}
              editable={false}
            />
          </View>
        </GlassCard>

        {/* 3. Goal configuration Forms */}
        <GlassCard style={styles.card}>
          <View style={styles.rowHeader}>
            <Settings size={20} color={BurnColors.water} />
            <Text style={styles.sectionTitleText}>DAILY TARGET GOALS</Text>
          </View>

          {/* Steps */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Daily Steps Target</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={targetSteps}
              onChangeText={setTargetSteps}
            />
          </View>

          {/* Water */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Daily Water Target (ml)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={targetWater}
              onChangeText={setTargetWater}
            />
          </View>

          {/* Calories */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Daily Calories Burn Goal (kcal)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={targetCalories}
              onChangeText={setTargetCalories}
            />
          </View>

          {/* Weight */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Target Body Weight (kg)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="decimal-pad"
              value={targetWeight}
              onChangeText={setTargetWeight}
            />
          </View>

          {/* CTA Button to commit profile */}
          <TouchableOpacity 
            style={styles.saveBtn}
            onPress={handleSaveProfile}
          >
            <Save size={16} color="#000000" />
            <Text style={styles.saveBtnText}>COMMIT DAILY GOALS</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 4. Danger Zone (Google Play Compliance) */}
        <GlassCard style={[styles.card, styles.dangerCard]}>
          <View style={styles.rowHeader}>
            <LogOut size={20} color="#FF3B30" />
            <Text style={[styles.sectionTitleText, { color: '#FF3B30' }]}>DANGER ZONE</Text>
          </View>
          
          <Text style={styles.sectionDescText}>
            Wipe all personal targets, calorie tallies, and active training history permanently.
          </Text>

          <View style={styles.dangerActionsRow}>
            {/* Logout */}
            <TouchableOpacity 
              style={styles.actionLogoutBtn}
              onPress={handleLogout}
            >
              <Text style={styles.actionLogoutText}>LOG OUT</Text>
            </TouchableOpacity>

            {/* Permanent Deletion */}
            <TouchableOpacity 
              style={styles.actionDeleteBtn}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.actionDeleteText}>DELETE ACCOUNT</Text>
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
    paddingBottom: 40,
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
  hudCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  hudOnline: {
    backgroundColor: 'rgba(57, 255, 20, 0.04)',
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  hudSandbox: {
    backgroundColor: 'rgba(245, 166, 35, 0.04)',
    borderColor: 'rgba(245, 166, 35, 0.2)',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hudDetails: {
    flex: 1,
    gap: 2,
  },
  hudStatusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  hudDescText: {
    color: BurnColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    gap: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    color: BurnColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    height: 44,
    paddingHorizontal: 12,
  },
  disabledInput: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  dangerCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.02)',
    borderColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1.5,
  },
  dangerActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  actionLogoutBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLogoutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionDeleteText: {
    color: '#FF4D4D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
