import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: DURATION,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  }, [fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.backgroundSolidColor,
        {
          opacity: fadeAnim,
        },
      ]}
    />
  );
}

export function AnimatedIcon() {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.Image
        style={[
          styles.glow,
          {
            transform: [{ rotate: spin }],
          },
        ]}
        source={require('@/assets/images/logo-glow.png')}
      />

      <Animated.View
        style={[
          styles.background,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      
      <Animated.Image
        style={[
          styles.image,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
        source={require('@/assets/images/expo-logo.png')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    backgroundColor: '#0274DF',
    width: 128,
    height: 128,
    position: 'absolute',
  },
  backgroundSolidColor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#208AEF',
    zIndex: 1000,
  },
});
