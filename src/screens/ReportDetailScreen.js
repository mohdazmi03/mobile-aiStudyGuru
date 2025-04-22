// src/screens/ReportDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator, Alert,
    TouchableOpacity, RefreshControl, ScrollView, Platform // Added ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Card, Divider } from 'react-native-elements'; // Using Card, Divider
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as Animatable from 'react-native-animatable';

// Theme Colors
const THEME = {
    primary: '#025a5a',
    primaryLight: '#E0F7FA',
    textDark: '#111827',
    textSecondary: '#4B5563',
    accent: '#FFD700',
    cardBackground: '#FFFFFF',
    separator: '#E5E7EB',
    correct: '#10B981', // Green
    incorrect: '#EF4444', // Red
    loadingColor: '#6B7280', // Gray
};

// --- Helper Functions ---
const formatDate = (dateString) => { /* Same as in ReportScreen */
    if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return 'Invalid Date'; } };
const formatTime = (totalSeconds) => { /* Same as in web version */
    if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return 'N/A'; const minutes = Math.floor(totalSeconds / 60); const seconds = Math.round(totalSeconds % 60); return `${minutes}:${seconds.toString().padStart(2, '0')}`; };
const getStatus = (start, end) => { /* Same as in ReportScreen */
    const now = new Date(); const startDate = start ? new Date(start) : null; const endDate = end ? new Date(end) : null; if (endDate && now > endDate) return { text: 'Expired', style: styles.statusExpired }; if (startDate && now < startDate) return { text: 'Scheduled', style: styles.statusScheduled }; return { text: 'Active', style: styles.statusActive }; };
// --- End Helpers ---


// --- Data Fetchers ---
// Fetch initial shared quiz data and participant attempts list
const fetchInitialReportData = async (sharedQuizId, userEmail) => {
    if (!sharedQuizId || !userEmail) throw new Error('Missing report ID or user.');

    console.log(`[ReportDetail] Fetching initial data for ${sharedQuizId}`);
    // 1. Verify ownership & get Shared Quiz + Quiz Title
    const { data: sharedQuizData, error: sharedQuizError } = await supabase
        .from('shared_quizzes')
        .select(`access_code, created_at, expires_at, start_at, quiz_id, quizzes ( title, number_of_questions )`)
        .eq('id', sharedQuizId)
        .eq('created_by', userEmail)
        .single();
    if (sharedQuizError || !sharedQuizData) throw new Error('Report not found or permission denied.');

    // 2. Get Attempts list (summary)
    const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`id, created_at, full_name, score, correct_count, wrong_count, percentage, total_time`)
        .eq('shared_quiz_id', sharedQuizId)
        .order('score', { ascending: false }); // Order by score (highest first)
    if (attemptsError) throw new Error('Failed to fetch participant attempts.');

    return {
        sharedQuiz: {
             ...sharedQuizData,
             quizTitle: sharedQuizData.quizzes?.title || 'Deleted Quiz',
             totalQuestions: sharedQuizData.quizzes?.number_of_questions || 0,
             quizzes: undefined // Clean up nested object
        },
        attempts: attemptsData || [],
    };
};

// Fetch detailed question attempts for a specific participant
const fetchParticipantDetails = async (attemptId) => {
    if (!attemptId) return null;
    console.log(`[ReportDetail] Fetching details for attemptId: ${attemptId}`);

    // Fetch question attempts, joining with questions table for text
    const { data: qaData, error: qaError } = await supabase
      .from('question_attempts')
      .select(`
          id, is_correct, time_taken, question_id,
          questions ( id, question_text ),
          answers ( id, answer_text )
      `) // Select related question text and selected answer text
      .eq('quiz_attempt_id', attemptId)
      .order('created_at', { ascending: true }); // Order questions as they were answered

    if (qaError) throw new Error('Failed to load participant question details.');
    if (!qaData || qaData.length === 0) return [];

    // Fetch the correct answers for these questions separately
    const questionIds = qaData.map(qa => qa.question_id).filter(id => id);
    let correctAnswersMap = {};
    if (questionIds.length > 0) {
        const { data: correctAnswersData, error: caError } = await supabase
            .from('answers')
            .select('question_id, answer_text')
            .in('question_id', questionIds)
            .eq('is_correct', true);
        if (caError) console.error("Error fetching correct answers:", caError); // Log but continue
        else {
            correctAnswersMap = (correctAnswersData || []).reduce((acc, ans) => {
                acc[ans.question_id] = ans.answer_text; return acc;
            }, {});
        }
    }

    // Map to the desired structure
    return qaData.map(qa => ({
      questionAttemptId: qa.id,
      questionText: qa.questions?.question_text || 'N/A: Question text missing',
      selectedAnswerText: qa.answers?.answer_text || 'N/A: No answer selected/found', // Use joined answer text
      correctAnswerText: correctAnswersMap[qa.question_id] || 'N/A: Correct answer not found',
      isCorrect: qa.is_correct,
      timeTaken: qa.time_taken,
    }));
};
// --- End Data Fetchers ---


export default function ReportDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const sharedQuizId = route.params?.sharedQuizId;

    // --- State ---
    const [userEmail, setUserEmail] = useState(null);
    const [reportData, setReportData] = useState(null); // Holds { sharedQuiz, attempts }
    const [expandedAttemptId, setExpandedAttemptId] = useState(null);
    const [detailsData, setDetailsData] = useState({}); // Store details per attemptId
    const [detailsLoading, setDetailsLoading] = useState({}); // Loading state per attemptId
    const [detailsError, setDetailsError] = useState({}); // Error state per attemptId
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    // --- End State ---

     // Get user email on mount
    useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && isMounted) setUserEmail(session.user.email);
            else if (isMounted) { setLoading(false); setError("User session not found."); }
        }).catch(err => { if (isMounted) { setError("Failed to get session."); setLoading(false); } });
        return () => { isMounted = false; };
    }, []);

    // Fetch Initial Data Logic
    const loadInitialData = useCallback(async () => {
        if (!userEmail || !sharedQuizId) {
            setLoading(false);
            if (!sharedQuizId) setError("Report ID missing.");
            return;
        }
        setError(null);
        try {
            const data = await fetchInitialReportData(sharedQuizId, userEmail);
            setReportData(data);
        } catch (e) { setError(e.message || 'Failed to load report data.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [userEmail, sharedQuizId]);

    // Initial load & refresh on focus/param change
    useFocusEffect(
        useCallback(() => {
            if (userEmail && sharedQuizId) { setLoading(true); loadInitialData(); }
            else { setLoading(true); } // Keep loading if prerequisites not met
        }, [loadInitialData, userEmail, sharedQuizId])
    );

    // Refresh Handler
    const onRefresh = useCallback(() => { setRefreshing(true); loadInitialData(); }, [loadInitialData]);

     // Toggle details view and fetch data
     const handleToggleDetails = async (attemptId) => {
        if (expandedAttemptId === attemptId) {
            setExpandedAttemptId(null); // Collapse
        } else {
            setExpandedAttemptId(attemptId); // Expand
            // Only fetch if details aren't already loaded or errored for this attempt
            if (!detailsData[attemptId] && !detailsError[attemptId]) {
                setDetailsLoading(prev => ({ ...prev, [attemptId]: true }));
                setDetailsError(prev => ({ ...prev, [attemptId]: null }));
                try {
                    const details = await fetchParticipantDetails(attemptId);
                    setDetailsData(prev => ({ ...prev, [attemptId]: details }));
                } catch (error) {
                    console.error("[ToggleDetails] Error fetching details:", error);
                    setDetailsError(prev => ({ ...prev, [attemptId]: error.message || 'Failed to load.' }));
                } finally {
                    setDetailsLoading(prev => ({ ...prev, [attemptId]: false }));
                }
            }
        }
    };


    // --- Render Participant Attempt Item ---
    const renderAttemptItem = ({ item: attempt }) => {
         const isExpanded = expandedAttemptId === attempt.id;
         const isLoadingDetails = detailsLoading[attempt.id];
         const errorLoadingDetails = detailsError[attempt.id];
         const attemptDetails = detailsData[attempt.id];
         const totalQuizQuestions = reportData?.sharedQuiz?.totalQuestions ?? 'N/A';

        return (
             <Animatable.View animation="fadeIn" duration={400} useNativeDriver={true}>
                 <Card containerStyle={styles.attemptCard}>
                     <TouchableOpacity onPress={() => handleToggleDetails(attempt.id)} activeOpacity={0.7}>
                         <View style={styles.attemptSummaryRow}>
                             <View style={styles.participantInfo}>
                                 <Icon name="user" type="font-awesome" size={16} color={THEME.textSecondary}/>
                                 <Text style={styles.participantName} numberOfLines={1}>
                                     {attempt.full_name || `Attempt ${attempt.id.substring(0, 6)}`}
                                 </Text>
                             </View>
                             <View style={styles.scoreInfo}>
                                 <Text style={styles.scoreText}>
                                     {attempt.score ?? '-'} / {totalQuizQuestions}
                                 </Text>
                                 <Text style={styles.percentageText}>
                                    ({(attempt.percentage ?? 0).toFixed(0)}%)
                                 </Text>
                             </View>
                             <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} type="font-awesome" size={16} color={THEME.inactiveTint}/>
                         </View>
                         <View style={styles.attemptMetaRow}>
                              <View style={styles.metaItem}><Icon name="check" type="font-awesome" size={12} color={THEME.correct}/><Text style={styles.metaText}>{attempt.correct_count ?? '-'}</Text></View>
                              <View style={styles.metaItem}><Icon name="times" type="font-awesome" size={12} color={THEME.incorrect}/><Text style={styles.metaText}>{attempt.wrong_count ?? '-'}</Text></View>
                              <View style={styles.metaItem}><Icon name="clock-o" type="font-awesome" size={12} color={THEME.textSecondary}/><Text style={styles.metaText}>{formatTime(attempt.total_time)}</Text></View>
                              <View style={styles.metaItem}><Icon name="calendar" type="font-awesome" size={12} color={THEME.textSecondary}/><Text style={styles.metaText}>{formatDate(attempt.created_at)}</Text></View>
                         </View>
                    </TouchableOpacity>

                     {/* Expanded Details Section */}
                     {isExpanded && (
                         <Animatable.View animation="fadeIn" duration={300} style={styles.detailsContainer}>
                             <Divider style={styles.detailsDivider} />
                             {isLoadingDetails && <ActivityIndicator color={THEME.primary} style={{ marginVertical: 15 }}/> }
                             {errorLoadingDetails && <Text style={styles.detailsErrorText}>Error loading details: {errorLoadingDetails}</Text>}
                             {attemptDetails && attemptDetails.length > 0 && (
                                 <View>
                                     {attemptDetails.map((qa, index) => (
                                        <View key={qa.questionAttemptId} style={styles.questionDetailItem}>
                                            <View style={styles.questionDetailHeader}>
                                                <Text style={styles.questionDetailNumber}>Q{index + 1}.</Text>
                                                <Icon name={qa.isCorrect ? 'check-circle' : 'times-circle'} type="font-awesome" color={qa.isCorrect ? THEME.correct : THEME.incorrect} size={18}/>
                                            </View>
                                            <Text style={styles.questionDetailText}>{qa.questionText}</Text>
                                            <Text style={[styles.answerText, !qa.isCorrect && styles.incorrectAnswer]}>
                                                Your Answer: {qa.selectedAnswerText}
                                            </Text>
                                            {!qa.isCorrect && (
                                                 <Text style={[styles.answerText, styles.correctAnswer]}>
                                                     Correct Answer: {qa.correctAnswerText}
                                                 </Text>
                                            )}
                                            {/* Optional: Show time per question */}
                                            {/* <Text style={styles.timeText}>Time: {formatTime(qa.timeTaken)}</Text> */}
                                             {index < attemptDetails.length - 1 && <Divider style={styles.questionDivider} />}
                                        </View>
                                     ))}
                                </View>
                             )}
                              {attemptDetails && attemptDetails.length === 0 && !isLoadingDetails && !errorLoadingDetails && (
                                   <Text style={styles.noDetailsText}>No question breakdown available for this attempt.</Text>
                              )}
                         </Animatable.View>
                     )}
                 </Card>
            </Animatable.View>
         );
    };


    // --- Render Loading/Error/Empty/List ---
    if (loading) {
        return <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" color={THEME.primary} /></View>;
    }

    if (error) {
        return <View style={styles.centeredMessageContainer}><Text style={styles.errorText}>{error}</Text><Button title="Retry" onPress={loadInitialData} buttonStyle={{backgroundColor: THEME.primary}}/></View>;
    }

    if (!reportData) {
         return <View style={styles.centeredMessageContainer}><Text style={styles.errorText}>Could not load report data.</Text></View>;
    }


    return (
        <SafeAreaView style={styles.safeArea}>
             {/* Optional: Header Info Summary */}
            <View style={styles.summaryHeader}>
                 <View style={styles.summaryItem}>
                    <Icon name="link" type="font-awesome" size={15} color={THEME.primary}/>
                    <Text style={styles.summaryText}>Code: {reportData.sharedQuiz.access_code}</Text>
                 </View>
                  <View style={styles.summaryItem}>
                    <Icon name="users" type="font-awesome" size={15} color={THEME.primary}/>
                    <Text style={styles.summaryText}>{reportData.attempts?.length ?? 0} Participants</Text>
                  </View>
                  <View style={[styles.statusBadge, getStatus(reportData.sharedQuiz.start_at, reportData.sharedQuiz.expires_at).style]}>
                    <Text style={styles.statusBadgeText}>{getStatus(reportData.sharedQuiz.start_at, reportData.sharedQuiz.expires_at).text}</Text>
                  </View>
            </View>

            <FlatList
                data={reportData.attempts}
                renderItem={renderAttemptItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                    <View style={styles.centeredMessageContainer}>
                        <Icon name="users" type="font-awesome" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>No participants yet for this shared quiz.</Text>
                    </View>
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary}/>
                }
            />
        </SafeAreaView>
    );
}


// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7F9', },
    centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, },
    errorText: { marginTop: 15, fontSize: 16, color: THEME.logout, textAlign: 'center', marginBottom: 15, },
    emptyText: { marginTop: 15, fontSize: 16, color: THEME.textSecondary, textAlign: 'center', },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: THEME.separator,
        flexWrap: 'wrap', // Allow wrapping on smaller screens if needed
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 5, // Add some horizontal spacing
    },
    summaryText: {
        marginLeft: 6,
        fontSize: 13,
        color: THEME.textSecondary,
        fontWeight: '500',
    },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginHorizontal: 5, },
    statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold', },
    statusActive: { backgroundColor: THEME.statusActive, },
    statusScheduled: { backgroundColor: THEME.statusScheduled, },
    statusExpired: { backgroundColor: THEME.statusExpired, },
    listContainer: { paddingVertical: 10, paddingHorizontal: 10, },
    attemptCard: {
        marginBottom: 12, borderRadius: 8, padding: 0, // Let internal views handle padding
        backgroundColor: THEME.cardBackground, elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.5,
    },
    attemptSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    participantInfo: {
        flex: 1, // Take available space
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    participantName: {
        marginLeft: 8, fontSize: 15, fontWeight: '600', color: THEME.textDark, flexShrink: 1,
    },
    scoreInfo: {
        flexDirection: 'row',
        alignItems: 'baseline', // Align score and percentage
        marginRight: 15,
    },
    scoreText: {
        fontSize: 15, fontWeight: 'bold', color: THEME.primary,
    },
    percentageText: {
        fontSize: 13, color: THEME.textSecondary, marginLeft: 4,
    },
    attemptMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        paddingHorizontal: 15,
        paddingBottom: 12,
        marginTop: -5, // Pull up slightly
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0', // Lighter separator inside card
        paddingTop: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        marginTop: 5, // Ensure wrapping looks okay
    },
    metaText: {
        marginLeft: 5, fontSize: 12, color: THEME.textSecondary,
    },
    detailsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        // backgroundColor: '#f9f9f9', // Optional slightly different background
    },
    detailsDivider: {
        backgroundColor: THEME.separator,
        marginVertical: 10,
    },
     detailsErrorText: {
        color: THEME.logout,
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 14,
     },
     questionDetailItem: {
        marginBottom: 12,
     },
     questionDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
     },
     questionDetailNumber: {
         fontWeight: 'bold',
         color: THEME.textDark,
         marginRight: 8,
         fontSize: 14,
     },
     questionDetailText: {
         fontSize: 15,
         color: THEME.textDark,
         lineHeight: 20,
         marginBottom: 6,
         marginLeft: 20, // Indent question text
     },
     answerText: {
        fontSize: 14,
        marginLeft: 25, // Indent answers
        color: THEME.textSecondary,
        marginBottom: 3,
        lineHeight: 19,
     },
     incorrectAnswer: {
        color: THEME.incorrect,
        // textDecorationLine: 'line-through', // Optional style for wrong answer
     },
     correctAnswer: {
        color: THEME.correct,
        fontWeight: '500',
     },
     questionDivider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 8,
        marginLeft: 20, // Indent divider
     },
     noDetailsText: {
        textAlign: 'center',
        color: THEME.textSecondary,
        fontStyle: 'italic',
        marginVertical: 10,
     }
});