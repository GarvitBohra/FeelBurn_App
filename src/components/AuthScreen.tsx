import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { isFirebaseConfigured, auth as realAuth, mockAuth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { BurnColors } from './GlassCard';
import { Flame, Mail, Lock, User, AlertCircle, Shield } from 'lucide-react-native';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (isSignUp && !name) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isFirebaseConfigured && realAuth) {
        // Real Firebase Auth
        if (isSignUp) {
          const userCred = await createUserWithEmailAndPassword(realAuth, email, password);
          await updateProfile(userCred.user, { displayName: name });
          onLoginSuccess(userCred.user);
        } else {
          const userCred = await signInWithEmailAndPassword(realAuth, email, password);
          onLoginSuccess(userCred.user);
        }
      } else {
        // Sandbox Mock Auth
        if (isSignUp) {
          const user = await mockAuth.signUp(email, password, name);
          onLoginSuccess(user);
        } else {
          const user = await mockAuth.login(email, password);
          onLoginSuccess(user);
        }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Glow Spheres in BG */}
        <View style={styles.glowSphere1} />
        <View style={styles.glowSphere2} />

        {/* Branding Hero */}
        <View style={styles.brandContainer}>
          <View style={styles.logoRing}>
            <Flame size={38} color={BurnColors.primary} />
          </View>
          <View style={styles.brandTextRow}>
            <Text style={styles.brandFeel}>FEEL</Text>
            <Text style={styles.brandBurn}>BURN</Text>
          </View>
          <Text style={styles.subtitle}>IGNITE YOUR FITNESS JOURNEY</Text>
        </View>

        {/* Glassmorphic Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>
          
          {errorMsg && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Name Field (Sign Up Only) */}
          {isSignUp && (
            <View style={styles.inputWrapper}>
              <User size={18} color={BurnColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={BurnColors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email Field */}
          <View style={styles.inputWrapper}>
            <Mail size={18} color={BurnColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={BurnColors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputWrapper}>
            <Lock size={18} color={BurnColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={BurnColors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {isSignUp ? "IGNITE SESSION" : "ENTER APP"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <TouchableOpacity
            onPress={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? (
                <>Already have a session? <Text style={styles.toggleHighlight}>Sign In</Text></>
              ) : (
                <>New to FeelBurn? <Text style={styles.toggleHighlight}>Create Session</Text></>
              )}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Database Sync Connection HUD */}
        <View style={styles.hudBadge}>
          <Shield size={12} color={isFirebaseConfigured ? BurnColors.steps : '#F5A623'} />
          <Text style={[styles.hudText, { color: isFirebaseConfigured ? BurnColors.steps : '#F5A623' }]}>
            {isFirebaseConfigured 
              ? "FIREBASE SECURE CONNECTION ACTIVE" 
              : "OFFLINE SANDBOX MODE ENABLED (Any Password Accepted)"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BurnColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    position: 'relative',
  },
  glowSphere1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 94, 58, 0.15)',
    filter: Platform.OS === 'web' ? 'blur(80px)' : undefined,
  },
  glowSphere2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(160, 32, 240, 0.12)',
    filter: Platform.OS === 'web' ? 'blur(100px)' : undefined,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 94, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BurnColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  brandTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandFeel: {
    color: '#8F90A6',
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 4,
  },
  brandBurn: {
    color: BurnColors.primary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: BurnColors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: BurnColors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 6,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: BurnColors.cardBg,
    borderColor: BurnColors.cardBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    gap: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: BurnColors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: BurnColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  toggleBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  toggleText: {
    color: BurnColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  toggleHighlight: {
    color: BurnColors.primary,
    fontWeight: '700',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 6,
  },
  hudText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
