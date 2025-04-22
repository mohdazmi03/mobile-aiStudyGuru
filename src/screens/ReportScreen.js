// src/screens/ReportScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator, Alert,
    TouchableOpacity, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Button, Card } from 'react-native-elements';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
    statusActive: '#10B981', // Green
    statusScheduled: '#F59E0B', // Amber
    statusExpired: '#6B7280', // Gray
};

// --- Data Fetcher ---
const fetchSharedQuizzes = async (userEmail) => {
    if (!userEmail) return [];
    console.log(`[Reports] Fetching shared quizzes for user: ${userEmail}`);

    const { data, error } = await supabase
        .from('shared_quizzes')
        .select(`
          id, access_code, created_at, start_at, expires_at, quiz_id,
          quizzes ( title ),
          quiz_attempts ( count )
        `)
        .eq('created_by', userEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Reports] Error fetching shared quizzes:', error);
        throw new Error(error.message || 'Failed to fetch shared quizzes');
    }

    return data.map(item => ({
        ...item,
        quizTitle: item.quizzes?.title || 'Unknown Quiz',
        participantCount: item.quiz_attempts[0]?.count || 0,
        quizzes: undefined, // Remove nested data after processing
        quiz_attempts: undefined,
    }));
};

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Simplified format for potentially cleaner display on mobile
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch { return 'Invalid Date'; }
};

const formatTime = (dateString) => {
     if (!dateString) return null; // Return null if no time needed
     try {
        return new Date(dateString).toLocaleTimeString(undefined, {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
     } catch { return null; }
};


const getStatus = (start, end) => {
    const now = new Date();
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;

    if (endDate && now > endDate) return { text: 'Expired', style: styles.statusExpired };
    if (startDate && now < startDate) return { text: 'Scheduled', style: styles.statusScheduled };
    return { text: 'Active', style: styles.statusActive };
};
// --- End Helpers ---


export default function ReportScreen() {
    const navigation = useNavigation();
    const [userEmail, setUserEmail] = useState(null);
    const [sharedQuizzes, setSharedQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Get user email
    useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && isMounted) setUserEmail(session.user.email);
            else if (isMounted) { setLoading(false); setError("User session not found."); }
        }).catch(err => { if (isMounted) { setError("Failed to get session."); setLoading(false); } });
        return () => { isMounted = false; };
    }, []);

    // Fetch Data Logic
    const loadData = useCallback(async () => {
        if (!userEmail) { setLoading(false); return; }
        setError(null);
        try {
            const data = await fetchSharedQuizzes(userEmail);
            setSharedQuizzes(data);
        } catch (e) { setError(e.message || 'Failed to load reports.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [userEmail]);

    // Initial load & refresh on focus/email change
    useFocusEffect(
        useCallback(() => {
            if (userEmail) { setLoading(true); loadData(); }
            else { setLoading(true); } // Keep loading if email not yet set
        }, [loadData, userEmail])
    );

    // Refresh Handler
    const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

    // Navigate to Detail Screen
    const handleViewReport = (shareId) => {
        navigation.navigate('ReportDetail', { sharedQuizId: shareId });
    };

    // Render Item for FlatList
    const renderReportItem = ({ item: share }) => {
        const statusInfo = getStatus(share.start_at, share.expires_at);
        const startTime = formatTime(share.start_at);
        const endTime = formatTime(share.expires_at);

        return (
            <Animatable.View animation="fadeInUp" duration={500} delay={100} useNativeDriver={true}>
                <Card containerStyle={styles.reportCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.quizTitle} numberOfLines={1}>{share.quizTitle}</Text>
                        <View style={[styles.statusBadge, statusInfo.style]}>
                            <Text style={styles.statusBadgeText}>{statusInfo.text}</Text>
                        </View>
                    </View>
                    <Card.Divider style={styles.cardDivider}/>
                    <View style={styles.detailsRow}>
                        <Icon name="link" type="font-awesome" size={14} color={THEME.textSecondary} />
                        <Text style={styles.detailTextHighlight}>{share.access_code}</Text>
                    </View>
                    <View style={styles.detailsRow}>
                         <Icon name="users" type="font-awesome" size={14} color={THEME.textSecondary} />
                        <Text style={styles.detailText}>{share.participantCount} Participants</Text>
                    </View>
                    <View style={styles.detailsRow}>
                        <Icon name="calendar" type="font-awesome" size={14} color={THEME.textSecondary} />
                        <Text style={styles.detailText}>Shared: {formatDate(share.created_at)}</Text>
                    </View>
                    <View style={styles.detailsRow}>
                        <Icon name="clock-o" type="font-awesome" size={14} color={THEME.textSecondary} />
                        <Text style={styles.detailText}>
                            Expires: {formatDate(share.expires_at)} {endTime ? `at ${endTime}` : ''}
                        </Text>
                    </View>
                     {share.start_at && new Date(share.start_at) > new Date() && ( // Only show start time if it's in the future
                         <View style={styles.detailsRow}>
                            <Icon name="play" type="font-awesome" size={13} color={THEME.textSecondary} />
                            <Text style={styles.detailText}>
                                Starts: {formatDate(share.start_at)} {startTime ? `at ${startTime}` : ''}
                            </Text>
                         </View>
                     )}
                     <TouchableOpacity
                        style={styles.viewReportButton}
                        onPress={() => handleViewReport(share.id)}
                     >
                        <Icon name="line-chart" type="font-awesome" size={16} color={THEME.primary} style={styles.buttonIcon}/>
                        <Text style={styles.viewReportButtonText}>View Report</Text>
                     </TouchableOpacity>
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
                data={sharedQuizzes}
                renderItem={renderReportItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                    <View style={styles.centeredMessageContainer}>
                        <Icon name="bar-chart" type="font-awesome" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>No shared quiz reports found.</Text>
                        <Text style={styles.emptySubText}>Share quizzes from "My Quizzes" to see reports here.</Text>
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
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7F9', // Slightly different background
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        marginTop: 50,
    },
    errorText: {
        marginTop: 15, fontSize: 16, color: THEME.logout, textAlign: 'center', marginBottom: 15,
    },
    emptyText: {
        marginTop: 15, fontSize: 17, color: THEME.textSecondary, textAlign: 'center', fontWeight:'500'
    },
    emptySubText: {
        marginTop: 5, fontSize: 14, color: '#888', textAlign: 'center',
    },
    listContainer: {
        paddingVertical: 15,
        paddingHorizontal: 10,
    },
    reportCard: {
        marginBottom: 15, borderRadius: 8, padding: 0, // Card handles padding internally usually
        backgroundColor: THEME.cardBackground, elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align items top
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 10, // Space before divider
    },
    quizTitle: {
        fontSize: 17, fontWeight: '600', color: THEME.textDark, flexShrink: 1, // Allow title to shrink
        marginRight: 8, // Space between title and badge
    },
    statusBadge: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        marginTop: 2, // Align slightly lower than title if needed
    },
    statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold', },
    statusActive: { backgroundColor: THEME.statusActive, },
    statusScheduled: { backgroundColor: THEME.statusScheduled, },
    statusExpired: { backgroundColor: THEME.statusExpired, },
    cardDivider: {
         marginHorizontal: 0, // Make divider full width of card padding
         marginBottom: 10,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8, fontSize: 14, color: THEME.textSecondary, flexShrink: 1,
    },
    detailTextHighlight: { // For access code
        marginLeft: 8, fontSize: 14, color: THEME.primary, fontWeight: 'bold', flexShrink: 1,
    },
    viewReportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.primaryLight, // Light background for button
        paddingVertical: 12,
        marginTop: 10,
        marginHorizontal: 15, // Indent button slightly
        marginBottom: 15,
        borderRadius: 8,
    },
    viewReportButtonText: {
        color: THEME.primary,
        fontSize: 15,
        fontWeight: 'bold',
    },
    buttonIcon: {
        marginRight: 6,
    }
});