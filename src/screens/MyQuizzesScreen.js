// src/screens/MyQuizzesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator, Alert,
    TouchableOpacity, RefreshControl, Switch, Share, // Import Switch and Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Button, Card } from 'react-native-elements';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as Animatable from 'react-native-animatable';

// Theme Colors (align with your theme)
const THEME = {
    primary: '#025a5a',
    primaryLight: '#E0F7FA',
    textDark: '#111827',
    textSecondary: '#4B5563',
    accent: '#FFD700', // Gold for stars
    cardBackground: '#FFFFFF',
    separator: '#E5E7EB',
    logout: '#D32F2F',
    publishedGreen: '#10B981', // Green for "Public"
    privateGray: '#6B7280',   // Gray for "Private"
    actionBlue: '#3B82F6',   // Blue for Attempt button
    shareColor: '#4B5563',   // Color for share icon
    deleteColor: '#EF4444', // Red for delete
    reviewNeeded: '#F59E0B', // Amber/Yellow for review needed
    reviewedColor: '#10B981', // Green for reviewed
};

// Fetcher function for user's quizzes
const fetchMyQuizzes = async (userEmail) => {
    if (!userEmail) return []; // Return empty if no email provided

    console.log(`Fetching quizzes for user: ${userEmail}`);
    const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id, title, description, type, number_of_questions, total_attempts,
          average_rating, is_published, created_at, difficulty, category, reviewed
        `)
        .eq('created_by', userEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user quizzes:', error);
        throw error; // Re-throw error to be caught by component
    }
    console.log(`Fetched ${data?.length ?? 0} quizzes.`);
    return data || []; // Return data or empty array
};


export default function MyQuizzesScreen() {
    const navigation = useNavigation();
    const [userEmail, setUserEmail] = useState(null);
    const [myQuizzes, setMyQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Get user email on mount
    useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && isMounted) {
                setUserEmail(session.user.email);
            } else if (isMounted) {
                // Should not happen if route is protected, but handle anyway
                console.warn("No user session found in MyQuizzesScreen");
                setError("User session not found.");
                setLoading(false);
            }
        }).catch(err => {
             if (isMounted) {
                console.error("Error getting session:", err);
                setError("Failed to get user session.");
                setLoading(false);
             }
        });
        return () => { isMounted = false; };
    }, []);

    // Fetch Data Function
    const loadData = useCallback(async () => {
        if (!userEmail) {
            console.log("Cannot load data, userEmail not set yet.");
            setLoading(false); // Stop loading if no email
            // setError("Could not identify user."); // Optionally set error
            return;
        }
        setError(null);
        try {
            const data = await fetchMyQuizzes(userEmail);
            setMyQuizzes(data);
        } catch (e) {
            console.error("Caught error in loadData (MyQuizzes):", e);
            setError(e.message || 'Failed to load your quizzes.');
            Alert.alert("Error", "Could not load quizzes. Please try refreshing.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userEmail]); // Depend on userEmail

    // Initial load and refresh when email is available or screen focuses
    useFocusEffect(
        useCallback(() => {
            if (userEmail) { // Only load if email is available
                setLoading(true);
                loadData();
            } else {
                // Still waiting for email from initial useEffect
                setLoading(true); // Keep loading indicator
            }
        }, [loadData, userEmail]) // Rerun if loadData or userEmail changes
    );

    // Refresh Handler
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    // Toggle Publish Status
    const handleTogglePublish = async (quizId, currentStatus) => {
        if (!userEmail) return;
        const optimisticNewStatus = !currentStatus;

        // Optimistic UI update
        setMyQuizzes(prevQuizzes =>
            prevQuizzes.map(q => q.id === quizId ? { ...q, is_published: optimisticNewStatus } : q)
        );

        try {
            const { error: updateError } = await supabase
                .from('quizzes')
                .update({ is_published: optimisticNewStatus })
                .eq('id', quizId)
                .eq('created_by', userEmail); // Ensure ownership

            if (updateError) throw updateError;
            // Success - UI already updated

        } catch (err) {
            console.error('Toggle publish error:', err);
            Alert.alert('Error', 'Failed to update quiz status.');
            // Revert UI on error
            setMyQuizzes(prevQuizzes =>
                prevQuizzes.map(q => q.id === quizId ? { ...q, is_published: currentStatus } : q)
            );
        }
    };

    // Share Quiz (Simplified)
    const handleShareQuiz = async (quizId, quizTitle) => {
        // In a real app, you might call your API here to generate a code first
        // const accessCode = await generateAccessCode(quizId, /* expiration options */);
        // For now, just share a link or basic info
        const shareMessage = `Check out my quiz "${quizTitle}" on AI StudyGuru!`;
        // const shareUrl = `https://www.aistudyguru.com/join-quiz?quizId=${quizId}`; // Example URL
        try {
            await Share.share({
                message: shareMessage,
                // url: shareUrl, // Include if you have a web link
                title: `Share Quiz: ${quizTitle}`
            });
        } catch (error) {
            Alert.alert("Share Error", error.message);
        }
    };

    // Attempt Quiz Navigation
    const handleAttemptQuiz = (quizId) => {
         // Navigate within the MyQuizzesStack
        navigation.navigate('QuizAttempt', { quizId: quizId });
    };

    // Delete Quiz
    const handleDeleteQuiz = async (quizId) => {
        if (!userEmail) return;
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this quiz? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive",
                    onPress: async () => {
                        // Optimistic UI update
                        const originalQuizzes = [...myQuizzes];
                        setMyQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
                        try {
                            const { error: deleteError } = await supabase
                                .from('quizzes')
                                .delete()
                                .eq('id', quizId)
                                .eq('created_by', userEmail); // Ensure ownership

                            if (deleteError) throw deleteError;

                            Alert.alert('Deleted!', 'Your quiz has been deleted.', [{ text: 'OK' }]);
                            // Data is already removed optimistically

                        } catch (err) {
                            console.error('Delete quiz error:', err);
                            Alert.alert('Error', 'Failed to delete quiz.');
                            setMyQuizzes(originalQuizzes); // Revert UI on error
                        }
                    }
                }
            ]
        );
    };

    // Review Quiz Navigation
    const handleReviewClick = (quiz) => {
        const navigateToReview = () => {
            navigation.navigate('ReviewQuiz', { quizId: quiz.id });
        };

        if (quiz.reviewed) {
            Alert.alert(
                'Quiz Reviewed',
                'This quiz has already been reviewed. Review again?',
                [ { text: "Cancel", style: "cancel" }, { text: "Review Again", onPress: navigateToReview } ]
            );
        } else {
            navigateToReview();
        }
    };


    // Render Item for FlatList
    const renderQuizCard = ({ item: quiz }) => {
        const isReviewed = quiz.reviewed === true; // Simpler boolean check
        const createdDate = quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : "N/A";

        return (
             <Animatable.View animation="fadeIn" duration={500} delay={100} useNativeDriver={true}>
                 <Card containerStyle={styles.quizCard}>
                    {/* Review Badge */}
                     <TouchableOpacity
                        style={[styles.reviewBadge, isReviewed ? styles.reviewed : styles.notReviewed]}
                        onPress={() => handleReviewClick(quiz)}
                     >
                         <Text style={styles.reviewBadgeText}>
                            {isReviewed ? 'Reviewed' : 'Review Now'}
                         </Text>
                    </TouchableOpacity>

                    <Card.Title style={styles.quizTitle}>{quiz.title}</Card.Title>
                    {/* Removed Card.Divider for cleaner look */}
                    <Text style={styles.quizDescription} numberOfLines={2}>
                        {quiz.description || "No description available"}
                    </Text>

                    {/* Details Section */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailItem}><Icon name="tag" type="font-awesome" size={13} color={THEME.inactiveTint}/><Text style={styles.detailText}>{quiz.category || 'N/A'}</Text></View>
                        <View style={styles.detailItem}><Icon name="graduation-cap" type="font-awesome" size={13} color={THEME.inactiveTint}/><Text style={styles.detailText}>{quiz.difficulty || 'N/A'}</Text></View>
                        <View style={styles.detailItem}><Icon name="question-circle-o" type="font-awesome" size={13} color={THEME.inactiveTint}/><Text style={styles.detailText}>{quiz.number_of_questions || 0} Qs</Text></View>
                        <View style={styles.detailItem}><Icon name="calendar" type="font-awesome" size={13} color={THEME.inactiveTint}/><Text style={styles.detailText}>{createdDate}</Text></View>
                    </View>

                    {/* Stats Section */}
                    <View style={styles.statsContainer}>
                         <View style={styles.statItem}>
                            <Icon name="star" type="font-awesome" color={THEME.accent} size={15} />
                            <Text style={styles.statText}>{quiz.average_rating ? quiz.average_rating.toFixed(1) : "-"}</Text>
                         </View>
                         <View style={styles.statItem}>
                            <Icon name="eye" type="font-awesome" color={THEME.inactiveTint} size={15} />
                            <Text style={styles.statText}>{quiz.total_attempts || 0}</Text>
                         </View>
                         {/* Publish Toggle */}
                         <View style={[styles.statItem, styles.toggleContainer]}>
                            <Switch
                                trackColor={{ false: "#E5E7EB", true: THEME.primaryLight }}
                                thumbColor={quiz.is_published ? THEME.primary : "#f4f3f4"}
                                ios_backgroundColor="#E5E7EB"
                                onValueChange={() => handleTogglePublish(quiz.id, quiz.is_published)}
                                value={quiz.is_published}
                                style={styles.switch}
                            />
                            <Text style={[styles.toggleLabel, { color: quiz.is_published ? THEME.publishedGreen : THEME.privateGray }]}>
                                {quiz.is_published ? "Public" : "Private"}
                            </Text>
                         </View>
                    </View>

                    {/* Actions Section */}
                    <View style={styles.actionsContainer}>
                        <Button
                           title="Attempt"
                           onPress={() => handleAttemptQuiz(quiz.id)}
                           buttonStyle={[styles.actionButton, styles.attemptButton]}
                           titleStyle={styles.actionButtonText}
                           icon={<Icon name="play-circle-o" type="font-awesome" size={16} color={THEME.textLight} style={{marginRight: 5}}/>}
                        />
                         <View style={styles.iconActions}>
                              <TouchableOpacity onPress={() => handleShareQuiz(quiz.id, quiz.title)} style={styles.iconButton}>
                                 <Icon name="share-alt" type="font-awesome" size={20} color={THEME.shareColor} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteQuiz(quiz.id)} style={styles.iconButton}>
                                  <Icon name="trash-o" type="font-awesome" size={20} color={THEME.deleteColor} />
                              </TouchableOpacity>
                         </View>
                    </View>
                 </Card>
            </Animatable.View>
        );
    };


    // --- Render Loading/Error/Empty/List ---
     if (loading) {
        return <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" color={THEME.primary} /></View>;
     }

     if (error) {
        return <View style={styles.centeredMessageContainer}><Text style={styles.errorText}>{error}</Text><Button title="Retry" onPress={loadData} buttonStyle={{backgroundColor: THEME.primary}}/></View>;
     }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={myQuizzes}
                renderItem={renderQuizCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                    <View style={styles.centeredMessageContainer}>
                        <Icon name="list-alt" type="font-awesome" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>You haven't created any quizzes yet.</Text>
                        <Button
                            title="Create First Quiz"
                            onPress={() => navigation.navigate('UploadDrawer')} // Navigate to Upload screen via drawer name
                            buttonStyle={{backgroundColor: THEME.primary, marginTop: 15}}
                        />
                    </View>
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary}/>
                }
                 // Optional: Add header if needed, though AppNavigator provides one
                 // ListHeaderComponent={<Text style={styles.mainTitle}>My Quizzes</Text>}
            />
        </SafeAreaView>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    errorText: {
        marginTop: 15, fontSize: 16, color: THEME.logout, textAlign: 'center', marginBottom: 15,
    },
     emptyText: {
        marginTop: 15, fontSize: 16, color: THEME.textSecondary, textAlign: 'center',
    },
    listContainer: {
        paddingVertical: 15,
        paddingHorizontal: 10,
    },
    // mainTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.primary, margin: 15, textAlign: 'center'}, // Optional header title
    quizCard: {
        marginBottom: 15, borderRadius: 10, padding: 0, // Remove Card's default padding
        backgroundColor: THEME.cardBackground, elevation: 3, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 2.00,
        position: 'relative', // Needed for absolute positioning of badge
        overflow: 'hidden', // Clip badge corners if needed
    },
     reviewBadge: {
        position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 12, zIndex: 1,
    },
    reviewed: { backgroundColor: THEME.reviewedColor, },
    notReviewed: { backgroundColor: THEME.reviewNeeded, },
    reviewBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold', },
    quizTitle: {
        fontSize: 18, fontWeight: '600', color: THEME.primary, marginBottom: 8,
        paddingHorizontal: 15, paddingTop: 15, // Add padding back here
        textAlign: 'left',
    },
    quizDescription: {
        fontSize: 14, color: THEME.textSecondary, marginBottom: 12, lineHeight: 19,
        paddingHorizontal: 15,
    },
    detailsContainer: {
        flexDirection: 'row', flexWrap: 'wrap', // Allow wrapping
        borderTopWidth: 1, borderTopColor: THEME.separator,
        paddingTop: 10, paddingHorizontal: 15, marginBottom: 10,
    },
    detailItem: {
        flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5,
    },
    detailText: { marginLeft: 5, fontSize: 13, color: THEME.textSecondary, },
    statsContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 15, marginBottom: 12,
    },
    statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, },
    statText: { marginLeft: 5, fontSize: 14, color: THEME.textSecondary, fontWeight: '500'},
    toggleContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }, // Push toggle right
    switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }, // Make switch slightly smaller
    toggleLabel: { marginLeft: 5, fontSize: 13, fontWeight: '500' },
    actionsContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 15, paddingBottom: 15, paddingTop: 10,
        borderTopWidth: 1, borderTopColor: THEME.separator,
    },
    actionButton: {
        borderRadius: 8, paddingVertical: 8, paddingHorizontal: 15,
    },
    attemptButton: { backgroundColor: THEME.actionBlue, },
    actionButtonText: { fontWeight: 'bold', fontSize: 14, color: '#FFF' },
    iconActions: { flexDirection: 'row', alignItems: 'center', },
    iconButton: { padding: 8, marginLeft: 10, }, // Add padding around icons for easier tapping
});