// src/screens/QuizAttemptScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { Button } from 'react-native-elements';
import { supabase } from '../lib/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function QuizAttemptScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState(null);
    const { quizId, sharedQuizId, guestName } = route.params || {};

    useEffect(() => {
        loadQuiz();
    }, []);

    const loadQuiz = async () => {
        if (!quizId) {
            setError('Quiz ID is missing');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('quizzes')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    difficulty,
                    type,
                    number_of_questions
                `)
                .eq('id', quizId)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Quiz not found');

            setQuiz(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = () => {
        Alert.alert(
            'Start Quiz',
            'Are you ready to begin? The timer will start once you click Start.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Start',
                    onPress: () => {
                        // Navigate to the actual quiz questions screen
                        // This will be implemented in the next step
                        Alert.alert('Quiz Started', 'Quiz functionality coming soon!');
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#025a5a" />
                <Text style={styles.loadingText}>Loading quiz...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
                <Button
                    title="Go Back"
                    onPress={() => navigation.goBack()}
                    buttonStyle={styles.button}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.title}>{quiz?.title}</Text>
                <Text style={styles.description}>{quiz?.description}</Text>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>Category: {quiz?.category || 'N/A'}</Text>
                    <Text style={styles.infoText}>Difficulty: {quiz?.difficulty || 'N/A'}</Text>
                    <Text style={styles.infoText}>Questions: {quiz?.number_of_questions || 0}</Text>
                    <Text style={styles.infoText}>Type: {quiz?.type || 'N/A'}</Text>
                    {guestName && <Text style={styles.infoText}>Attempting as: {guestName}</Text>}
                </View>

                <View style={styles.rulesContainer}>
                    <Text style={styles.rulesTitle}>Quiz Rules:</Text>
                    <Text style={styles.ruleText}>• Answer all questions to complete the quiz</Text>
                    <Text style={styles.ruleText}>• Each question has a time limit</Text>
                    <Text style={styles.ruleText}>• You cannot go back to previous questions</Text>
                    <Text style={styles.ruleText}>• Results will be shown after completion</Text>
                </View>

                <Button
                    title="Start Quiz"
                    onPress={startQuiz}
                    buttonStyle={styles.button}
                    titleStyle={styles.buttonTitle}
                    containerStyle={styles.buttonContainer}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#025a5a',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        lineHeight: 24,
    },
    infoContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoText: {
        fontSize: 15,
        color: '#444',
        marginBottom: 8,
    },
    rulesContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    rulesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#025a5a',
        marginBottom: 10,
    },
    ruleText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#025a5a',
        paddingVertical: 12,
        borderRadius: 25,
    },
    buttonTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    buttonContainer: {
        marginTop: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#025a5a',
        fontSize: 16,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
});