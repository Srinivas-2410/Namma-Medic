import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pedometer } from 'expo-sensors';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface StepCounterProps {
    steps: number;
    goal: number;
}

function StepCounter({ steps, goal }: StepCounterProps) {
    const progress = Math.min(steps / goal, 1);
    const size = width * 0.55;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressTextContainer}>
                <Text style={styles.stepsNumber}>{steps.toLocaleString()}</Text>
                <Text style={styles.stepsLabel}>Steps</Text>
                <Text style={styles.goalText}>Goal: {goal.toLocaleString()}</Text>
            </View>
            <Svg width={size} height={size} style={styles.progressRing}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="white"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
        </View>
    );
}

export default function StepsScreen() {
    const [currentSteps, setCurrentSteps] = useState(0);
    const [dailySteps, setDailySteps] = useState(0);
    const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
    const [stepGoal] = useState(10000); // Daily step goal
    const [sessionStartSteps, setSessionStartSteps] = useState(0);

    // Get today's date string for storage key
    const getTodayKey = () => {
        const today = new Date();
        return `steps_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
    };

    // Load saved steps for today
    const loadDailySteps = async () => {
        try {
            const todayKey = getTodayKey();
            const savedSteps = await AsyncStorage.getItem(todayKey);
            if (savedSteps) {
                setDailySteps(parseInt(savedSteps, 10));
            }
        } catch (error) {
            console.error('Error loading daily steps:', error);
        }
    };

    // Save daily steps
    const saveDailySteps = async (steps: number) => {
        try {
            const todayKey = getTodayKey();
            await AsyncStorage.setItem(todayKey, steps.toString());
        } catch (error) {
            console.error('Error saving daily steps:', error);
        }
    };

    useEffect(() => {
        const subscribe = async () => {
            // Load saved steps first
            await loadDailySteps();

            // Check if pedometer is available
            const isAvailable = await Pedometer.isAvailableAsync();
            setIsPedometerAvailable(isAvailable ? 'available' : 'unavailable');

            if (isAvailable) {
                try {
                    // Request permissions first
                    const { status } = await Pedometer.requestPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert(
                            'Permission Required',
                            'Please grant permission to access step counting in your device settings.'
                        );
                        return;
                    }

                    let subscription: any;

                    if (Platform.OS === 'ios') {
                        // iOS supports historical data
                        const start = new Date();
                        start.setHours(0, 0, 0, 0);
                        const end = new Date();

                        try {
                            const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
                            if (pastStepCountResult) {
                                const totalSteps = pastStepCountResult.steps;
                                setDailySteps(totalSteps);
                                setCurrentSteps(totalSteps);
                                await saveDailySteps(totalSteps);
                            }
                        } catch (error) {
                            console.log('Historical data not available, using real-time tracking');
                        }

                        // Subscribe to real-time updates
                        subscription = Pedometer.watchStepCount(result => {
                            setCurrentSteps(prev => {
                                const newTotal = prev + result.steps;
                                setDailySteps(newTotal);
                                saveDailySteps(newTotal);
                                return newTotal;
                            });
                        });
                    } else {
                        // Android - use real-time tracking only
                        subscription = Pedometer.watchStepCount(result => {
                            if (sessionStartSteps === 0) {
                                setSessionStartSteps(result.steps);
                            }

                            const sessionSteps = result.steps - sessionStartSteps;
                            const totalSteps = dailySteps + sessionSteps;
                            setCurrentSteps(totalSteps);

                            // Save periodically (every 10 steps to avoid too frequent saves)
                            if (sessionSteps % 10 === 0) {
                                setDailySteps(totalSteps);
                                saveDailySteps(totalSteps);
                            }
                        });
                    }

                    return () => subscription && subscription.remove();
                } catch (error) {
                    console.error('Error setting up pedometer:', error);
                    Alert.alert('Error', 'Failed to access step counter. Please check your device permissions.');
                }
            } else {
                Alert.alert(
                    'Pedometer Unavailable',
                    'Step counting is not available on this device'
                );
            }
        };

        subscribe();
    }, [sessionStartSteps, dailySteps]);

    // Update current steps when daily steps change
    useEffect(() => {
        if (Platform.OS === 'android') {
            setCurrentSteps(dailySteps);
        }
    }, [dailySteps]);

    const totalSteps = currentSteps;
    const progressPercentage = Math.min((totalSteps / stepGoal) * 100, 100);
    const remainingSteps = Math.max(stepGoal - totalSteps, 0);

    // Calculate distance (rough estimate: 2000 steps = 1 mile)
    const distanceMiles = (totalSteps / 2000).toFixed(1);
    const distanceKm = (totalSteps * 0.0008).toFixed(1); // Rough estimate

    // Calculate calories (rough estimate: 20 calories per 1000 steps)
    const caloriesBurned = Math.round((totalSteps / 1000) * 20);

    const getMotivationalMessage = () => {
        if (totalSteps >= stepGoal) {
            return "🎉 Goal achieved! Great job!";
        } else if (totalSteps >= stepGoal * 0.75) {
            return "💪 Almost there! Keep going!";
        } else if (totalSteps >= stepGoal * 0.5) {
            return "🚶 Halfway to your goal!";
        } else if (totalSteps > 0) {
            return "👟 Good start! Keep walking!";
        } else {
            return "🌟 Start your walking journey!";
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>Daily Steps</Text>
                    <StepCounter steps={totalSteps} goal={stepGoal} />
                    <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Today's Statistics</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={styles.statIcon}>
                                <Ionicons name="footsteps-outline" size={28} color="#4A90E2" />
                            </View>
                            <Text style={styles.statNumber}>{totalSteps.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Steps</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={styles.statIcon}>
                                <Ionicons name="map-outline" size={28} color="#52C41A" />
                            </View>
                            <Text style={styles.statNumber}>{distanceKm}</Text>
                            <Text style={styles.statLabel}>Kilometers</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={styles.statIcon}>
                                <Ionicons name="flame-outline" size={28} color="#FF6B35" />
                            </View>
                            <Text style={styles.statNumber}>{caloriesBurned}</Text>
                            <Text style={styles.statLabel}>Calories</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={styles.statIcon}>
                                <Ionicons name="trophy-outline" size={28} color="#9C27B0" />
                            </View>
                            <Text style={styles.statNumber}>{Math.round(progressPercentage)}</Text>
                            <Text style={styles.statLabel}>% Goal</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Progress Details</Text>

                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressTitle}>Steps Remaining</Text>
                            <Text style={styles.progressValue}>{remainingSteps.toLocaleString()}</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${progressPercentage}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {progressPercentage.toFixed(1)}% of daily goal completed
                        </Text>
                    </View>

                    <View style={styles.tipsCard}>
                        <Text style={styles.tipsTitle}>💡 Daily Tips</Text>
                        <Text style={styles.tipText}>• Take the stairs instead of elevators</Text>
                        <Text style={styles.tipText}>• Park farther away from entrances</Text>
                        <Text style={styles.tipText}>• Take walking breaks every hour</Text>
                        <Text style={styles.tipText}>• Walk while talking on the phone</Text>
                    </View>

                    {Platform.OS === 'android' && (
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>Android Step Tracking</Text>
                                <Text style={styles.infoText}>
                                    Steps are tracked in real-time while the app is open and in the foreground.
                                    Your daily total is saved locally. For continuous background tracking,
                                    consider using Google Fit or Samsung Health apps.
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {isPedometerAvailable === 'unavailable' && (
                    <View style={styles.errorCard}>
                        <Ionicons name="warning-outline" size={32} color="#FF6B35" />
                        <Text style={styles.errorText}>
                            Step counting is not available on this device
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        alignItems: "center",
        paddingHorizontal: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
        marginBottom: 20,
    },
    motivationalText: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
        marginTop: 15,
        textAlign: "center",
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    progressContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10,
    },
    progressTextContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    stepsNumber: {
        fontSize: 32,
        fontWeight: "bold",
        color: "white",
    },
    stepsLabel: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
        marginTop: 4,
    },
    goalText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        marginTop: 2,
    },
    progressRing: {
        transform: [{ rotate: "-90deg" }],
    },
    statsContainer: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#f0f9ff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
    section: {
        paddingHorizontal: 20,
    },
    progressCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    progressValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4A90E2",
    },
    progressBar: {
        height: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 4,
        marginBottom: 8,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#4A90E2",
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
    tipsCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    tipText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 6,
        lineHeight: 20,
    },
    errorCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 30,
        margin: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 10,
    },
    infoCard: {
        backgroundColor: "#E3F2FD",
        borderRadius: 16,
        padding: 15,
        marginTop: 15,
        flexDirection: "row",
        alignItems: "flex-start",
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1976D2",
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: "#424242",
        lineHeight: 20,
    },
});
