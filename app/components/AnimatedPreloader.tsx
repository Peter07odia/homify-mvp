import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Easing, 
  Dimensions, 
  Text 
} from 'react-native';

const { width } = Dimensions.get('window');

interface AnimatedPreloaderProps {
  progress: number;
  status: string;
}

const AnimatedPreloader: React.FC<AnimatedPreloaderProps> = ({ 
  progress, 
  status 
}) => {
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinValueReverse = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const floatValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacities = useRef(
    Array(12).fill(0).map(() => new Animated.Value(0.3))
  ).current;
  
  // Update progress animation when the progress prop changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  // Start animations when component mounts
  useEffect(() => {
    // Continuous rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Reverse rotation for additional effect
    Animated.loop(
      Animated.timing(spinValueReverse, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Pulsating scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.95,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Glow pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.2,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Animate each dot with a different timing
    dotOpacities.forEach((opacity, index) => {
      const animateDot = () => {
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800 + Math.random() * 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800 + Math.random() * 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Add slight delay before restarting
          setTimeout(animateDot, Math.random() * 200);
        });
      };
      
      // Start each dot's animation with a staggered delay
      setTimeout(() => {
        animateDot();
      }, index * 100);
    });
  }, []);
  
  // Interpolate the spin animation to rotate
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Interpolate the reverse spin
  const spinReverse = spinValueReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  
  // Interpolate the float animation
  const translateY = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });
  
  // Progress bar width interpolation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  // Progress color transition from yellow-orange to green
  const progressColor = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#E3A75B', '#B08F5C', '#7C5C3E']
  });
  
  // Animated progress percentage text
  const progressText = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });
  
  return (
    <View style={styles.container}>
      {/* Glow background */}
      <Animated.View 
        style={[
          styles.glowContainer, 
          { 
            opacity: glowOpacity,
            transform: [{ scale: scaleValue }] 
          }
        ]}
      />
      
      {/* Main animation container */}
      <Animated.View
        style={[
          styles.animationContainer,
          {
            transform: [
              { translateY },
              { scale: scaleValue },
            ]
          }
        ]}
      >
        {/* Outer spinning circle */}
        <Animated.View
          style={[
            styles.outerCircle,
            {
              transform: [{ rotate: spin }]
            }
          ]}
        >
          {/* Dots around the circle */}
          {[...Array(12)].map((_, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.dot, 
                { 
                  opacity: dotOpacities[i],
                  transform: [
                    { rotate: `${i * 30}deg` },
                    { translateX: width * 0.14 }
                  ]
                }
              ]} 
            />
          ))}
        </Animated.View>
        
        {/* Middle spinning circle with opposite rotation */}
        <Animated.View
          style={[
            styles.middleCircle,
            {
              transform: [{ rotate: spinReverse }]
            }
          ]}
        >
          {/* Inner "spokes" */}
          {[...Array(6)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.spoke, 
                { 
                  transform: [
                    { rotate: `${i * 30}deg` },
                  ]
                }
              ]} 
            />
          ))}
        </Animated.View>
        
        {/* Inner fixed circle with design icon */}
        <View style={styles.innerCircle}>
          <View style={styles.designIcon} />
          <View style={[styles.designIcon, { transform: [{ rotate: '90deg' }] }]} />
        </View>
      </Animated.View>
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressWidth,
                backgroundColor: progressColor
              }
            ]} 
          />
        </View>
        <View style={styles.progressTextContainer}>
          <Animated.Text style={styles.progressText}>
            {progressText.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            })}
          </Animated.Text>
        </View>
      </View>
      
      {/* Status text */}
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  glowContainer: {
    position: 'absolute',
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.225,
    backgroundColor: 'rgba(124, 92, 62, 0.12)',
    shadowColor: '#7C5C3E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  animationContainer: {
    width: width * 0.4,
    height: width * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  outerCircle: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 62, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  middleCircle: {
    position: 'absolute',
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 62, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    position: 'absolute',
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7C5C3E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C5C3E',
  },
  spoke: {
    position: 'absolute',
    width: width * 0.18,
    height: 2,
    backgroundColor: 'rgba(124, 92, 62, 0.2)',
    borderRadius: 1,
  },
  designIcon: {
    position: 'absolute',
    width: width * 0.1,
    height: 3,
    backgroundColor: '#7C5C3E',
    borderRadius: 1.5,
  },
  progressContainer: {
    width: '80%',
    marginBottom: 25,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(124, 92, 62, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C5C3E',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default AnimatedPreloader; 