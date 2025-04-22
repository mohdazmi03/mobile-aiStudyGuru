// src/screens/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput, ScrollView // Added ScrollView for filters
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Button, Card } from 'react-native-elements'; // Using RNE Card
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Added useFocusEffect
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';
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
};

// Fetcher function for quizzes
const fetchPublicQuizzes = async () => {
    console.log("Fetching public quizzes...");
    const { data: publicQuizzes, error } = await supabase
        .from('quizzes')
        .select(`
          id, title, description, difficulty, type, category, created_by,
          total_attempts, average_rating, number_of_questions, created_at
        `)
        .eq('is_published', true)
        // Add more robust ordering
        .order('average_rating', { ascending: false, nullsFirst: false })
        .order('total_attempts', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching public quizzes:', error);
        throw error; // Re-throw error to be caught by caller
    }

    // Enhance with creator names (simplified batch fetch)
    if (!publicQuizzes || publicQuizzes.length === 0) {
        return { enhancedQuizzes: [], categories: [], difficulties: [], types: [] };
    }

    const creatorEmails = [...new Set(publicQuizzes.map(quiz => quiz.created_by).filter(Boolean))];
    let creatorMap = {};

    if (creatorEmails.length > 0) {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .in('email', creatorEmails);

        if (profileError) {
            console.error("Error fetching creator profiles:", profileError);
            // Continue without names if profiles fail
        } else if (profiles) {
            profiles.forEach(profile => {
                creatorMap[profile.email] = profile.full_name;
            });
        }
    }

    const enhancedQuizzes = publicQuizzes.map(quiz => ({
        ...quiz,
        creator_name: creatorMap[quiz.created_by] || 'Anonymous'
    }));

    // Extract unique filter options
    const categories = [...new Set(enhancedQuizzes.map(q => q.category).filter(Boolean))].sort();
    const difficulties = [...new Set(enhancedQuizzes.map(q => q.difficulty).filter(Boolean))].sort();
    const types = [...new Set(enhancedQuizzes.map(q => q.type).filter(Boolean))].sort();

    return { enhancedQuizzes, categories, difficulties, types };
};


export default function DashboardScreen() {
    const navigation = useNavigation();
    const [allQuizzes, setAllQuizzes] = useState([]); // Store the original fetched data
    const [filteredQuizzes, setFilteredQuizzes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [difficulties, setDifficulties] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Filter/Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [selectedType, setSelectedType] = useState('All');
    const [sortBy, setSortBy] = useState('rating'); // Default sort
    const [showFilters, setShowFilters] = useState(false); // Toggle filter visibility

    // Fetch Data Function
    const loadData = useCallback(async () => {
        setError(null); // Clear previous errors
        try {
            const { enhancedQuizzes, categories, difficulties, types } = await fetchPublicQuizzes();
            setAllQuizzes(enhancedQuizzes);
            setFilteredQuizzes(enhancedQuizzes); // Initialize filtered list
            setCategories(['All', ...categories]); // Add 'All' option
            setDifficulties(['All', ...difficulties]);
            setTypes(['All', ...types]);
        } catch (e) {
            console.error("Caught error in loadData:", e);
            setError(e.message || 'Failed to load quizzes.');
            Alert.alert("Error", "Could not load quizzes. Please try refreshing.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load and refresh on focus
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadData();
        }, [loadData])
    );

    // Filtering and Sorting Logic
    useEffect(() => {
        let results = [...allQuizzes]; // Start with all quizzes

        // Apply Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(quiz =>
                quiz.title.toLowerCase().includes(term) ||
                (quiz.description && quiz.description.toLowerCase().includes(term)) ||
                (quiz.creator_name && quiz.creator_name.toLowerCase().includes(term)) ||
                (quiz.category && quiz.category.toLowerCase().includes(term))
            );
        }

        // Apply Filters
        if (selectedCategory !== 'All') results = results.filter(q => q.category === selectedCategory);
        if (selectedDifficulty !== 'All') results = results.filter(q => q.difficulty === selectedDifficulty);
        if (selectedType !== 'All') results = results.filter(q => q.type === selectedType);

        // Apply Sorting
        if (sortBy === 'rating') results.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        else if (sortBy === 'popularity') results.sort((a, b) => (b.total_attempts || 0) - (a.total_attempts || 0));
        else if (sortBy === 'newest') results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setFilteredQuizzes(results);
    }, [allQuizzes, searchTerm, selectedCategory, selectedDifficulty, selectedType, sortBy]);

    // Refresh Handler
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    // Navigation Handler
    const handleTryQuiz = async (quizId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Navigate logged-in user to attempt screen (adjust route name if needed)
                navigation.navigate('MyQuizzesStackDrawer', { // Navigate to the Stack first
                     screen: 'QuizAttempt', // Then to the screen within the stack
                     params: { quizId: quizId },
                });
            } else {
                 // Handle guest attempt (if implemented)
                 Alert.alert("Login Required", "Please log in or sign up to attempt quizzes.");
                 // Or navigate to login: navigation.navigate('Login');
            }
        } catch (e) {
             console.error("Error checking session for quiz attempt:", e);
             Alert.alert("Error", "Could not determine login status.");
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setSelectedDifficulty('All');
        setSelectedType('All');
        setSortBy('rating');
        setShowFilters(false); // Optionally close filters on reset
    };

    // Render Item for FlatList
    const renderQuizCard = ({ item }) => (
        <Animatable.View animation="fadeInUp" duration={600} delay={100} useNativeDriver={true}>
            <Card containerStyle={styles.quizCard}>
                <Card.Title style={styles.quizTitle}>{item.title}</Card.Title>
                <Card.Divider />
                <Text style={styles.quizDescription} numberOfLines={2}>
                    {item.description || "No description available"}
                </Text>
                <View style={styles.quizMetaRow}>
                    <Text style={styles.quizMetaText}>Category: {item.category || 'N/A'}</Text>
                    <Text style={styles.quizMetaText}>Difficulty: {item.difficulty || 'N/A'}</Text>
                </View>
                 <View style={styles.quizMetaRow}>
                     <Text style={styles.quizMetaText}>Type: {item.type || 'N/A'}</Text>
                     <Text style={styles.quizMetaText}>Questions: {item.number_of_questions || '?'}</Text>
                 </View>
                 <View style={styles.quizMetaRow}>
                    <Text style={styles.quizMetaText}>By: {item.creator_name}</Text>
                    <View style={styles.quizStats}>
                        <Icon name="star" type="font-awesome" color={THEME.accent} size={14} />
                        <Text style={styles.quizStatText}>{item.average_rating ? item.average_rating.toFixed(1) : "N/A"}</Text>
                        <Icon name="eye" type="font-awesome" color={THEME.inactiveTint} size={14} style={{ marginLeft: 8 }} />
                        <Text style={styles.quizStatText}>{item.total_attempts || 0}</Text>
                    </View>
                 </View>
                <Button
                    title="Try Quiz"
                    onPress={() => handleTryQuiz(item.id)}
                    buttonStyle={styles.tryQuizButton}
                    titleStyle={styles.tryQuizButtonText}
                    containerStyle={styles.tryQuizContainer}
                />
            </Card>
        </Animatable.View>
    );

    // Render Loading/Error/Empty States
    if (loading && !refreshing) {
        return (
            <View style={styles.centeredMessageContainer}>
                <ActivityIndicator size="large" color={THEME.primary} />
                <Text style={styles.loadingText}>Loading Quizzes...</Text>
            </View>
        );
    }

    if (error && !loading) {
        return (
            <View style={styles.centeredMessageContainer}>
                <Icon name="exclamation-triangle" type="font-awesome" color="red" size={40} />
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Retry" onPress={loadData} buttonStyle={{ backgroundColor: THEME.primary }}/>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Search and Filter Controls */}
            <View style={styles.controlsContainer}>
                <View style={styles.searchBar}>
                     <Icon name="search" type="font-awesome" size={18} color="#888" style={styles.searchIcon} />
                     <TextInput
                        placeholder="Search quizzes, categories, creators..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        style={styles.searchInput}
                        placeholderTextColor="#999"
                     />
                </View>
                 <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
                    <Icon name="filter" type="font-awesome" size={16} color={THEME.primary}/>
                    <Text style={styles.filterToggleText}>Filters</Text>
                 </TouchableOpacity>
            </View>

             {/* Filters Panel (Conditional) */}
            {showFilters && (
                 <Animatable.View animation="fadeIn" duration={300} style={styles.filtersPanel}>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                         {/* Category Picker */}
                         <View style={styles.filterGroup}>
                              <Text style={styles.filterLabel}>Category:</Text>
                              <View style={styles.pickerWrapper}>
                                 <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory} style={styles.picker} itemStyle={styles.pickerItem}>
                                     {categories.map(cat => <Picker.Item key={cat} label={cat} value={cat} />)}
                                 </Picker>
                              </View>
                         </View>
                         {/* Difficulty Picker */}
                         <View style={styles.filterGroup}>
                             <Text style={styles.filterLabel}>Difficulty:</Text>
                             <View style={styles.pickerWrapper}>
                                 <Picker selectedValue={selectedDifficulty} onValueChange={setSelectedDifficulty} style={styles.picker} itemStyle={styles.pickerItem}>
                                     {difficulties.map(diff => <Picker.Item key={diff} label={diff} value={diff} />)}
                                 </Picker>
                              </View>
                         </View>
                          {/* Type Picker */}
                          <View style={styles.filterGroup}>
                              <Text style={styles.filterLabel}>Type:</Text>
                              <View style={styles.pickerWrapper}>
                                 <Picker selectedValue={selectedType} onValueChange={setSelectedType} style={styles.picker} itemStyle={styles.pickerItem}>
                                     {types.map(typ => <Picker.Item key={typ} label={typ} value={typ} />)}
                                 </Picker>
                              </View>
                          </View>
                          {/* Sort Picker */}
                           <View style={styles.filterGroup}>
                               <Text style={styles.filterLabel}>Sort By:</Text>
                               <View style={styles.pickerWrapper}>
                                  <Picker selectedValue={sortBy} onValueChange={setSortBy} style={styles.picker} itemStyle={styles.pickerItem}>
                                      <Picker.Item label="Rating" value="rating" />
                                      <Picker.Item label="Popularity" value="popularity" />
                                      <Picker.Item label="Newest" value="newest" />
                                  </Picker>
                               </View>
                           </View>
                           {/* Reset Button */}
                           <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                               <Icon name="times-circle" type="font-awesome" size={16} color={THEME.inactiveTint} />
                               <Text style={styles.resetButtonText}>Reset</Text>
                           </TouchableOpacity>
                    </ScrollView>
                 </Animatable.View>
            )}


            {/* Quiz List */}
            <FlatList
                data={filteredQuizzes}
                renderItem={renderQuizCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                    <View style={styles.centeredMessageContainer}>
                         <Icon name="search" type="font-awesome" size={40} color="#ccc" />
                        <Text style={styles.emptyText}>No quizzes found matching your criteria.</Text>
                         { (searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedType !== 'All') &&
                            <Button title="Clear Filters" onPress={resetFilters} buttonStyle={{backgroundColor: THEME.primary, marginTop: 10}}/>
                         }
                    </View>
                )}
                refreshControl={ // Pull to refresh
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
        backgroundColor: '#F8F9FA', // Light background for the whole screen
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        marginTop: 50, // Add some margin from top controls
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: THEME.textSecondary,
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        color: THEME.logout,
        textAlign: 'center',
        marginBottom: 15,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: THEME.textSecondary,
        textAlign: 'center',
    },
    controlsContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // White background for controls bar
        borderBottomWidth: 1,
        borderBottomColor: THEME.separator,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9', // Light gray background for search
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 40,
        marginRight: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: THEME.textDark,
        height: '100%', // Ensure input takes full height
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: THEME.primaryLight,
        borderRadius: 20,
    },
    filterToggleText: {
        marginLeft: 5,
        color: THEME.primary,
        fontWeight: '500',
        fontSize: 14,
    },
    filtersPanel: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: THEME.separator,
        paddingBottom: 10, // Add padding below filters scroll
    },
     filtersScroll: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: 'center', // Align items vertically
     },
     filterGroup: {
        marginRight: 15, // Space between filter groups
        alignItems: 'flex-start', // Align label to the start
     },
     filterLabel: {
         fontSize: 12,
         color: THEME.textSecondary,
         marginBottom: 4,
         fontWeight: '500',
     },
     pickerWrapper: {
        height: 40, // Match search bar height
        minWidth: 120, // Minimum width for pickers
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        justifyContent: 'center',
        backgroundColor: '#F8F9FA', // Light background
        overflow: 'hidden',
     },
     picker: {
        width: '100%',
        height: '100%',
     },
     pickerItem: { // Might only work on iOS
        fontSize: 14,
        height: 40,
     },
     resetButton: {
         flexDirection: 'row',
         alignItems: 'center',
         marginLeft: 10, // Space before reset button
         paddingHorizontal: 12,
         paddingVertical: 8,
         backgroundColor: '#FEE2E2', // Light red background
         borderRadius: 20,
     },
     resetButtonText: {
         marginLeft: 5,
         color: '#DC2626', // Red text
         fontWeight: '500',
         fontSize: 14,
     },
    listContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    quizCard: {
        marginBottom: 15,
        borderRadius: 12, // More rounded corners
        padding: 15,
        backgroundColor: THEME.cardBackground,
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2.5,
    },
    quizTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: THEME.primary,
        marginBottom: 8,
        textAlign: 'left', // Align title left
    },
    quizDescription: {
        fontSize: 14,
        color: THEME.textSecondary,
        marginBottom: 10,
        lineHeight: 19,
    },
    quizMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        flexWrap: 'wrap', // Allow wrapping on small screens
    },
    quizMetaText: {
        fontSize: 13,
        color: THEME.textSecondary,
        marginRight: 10, // Space between items in a row
    },
    quizStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quizStatText: {
        marginLeft: 4,
        fontSize: 13,
        color: THEME.textSecondary,
    },
    tryQuizContainer: {
        marginTop: 12,
    },
    tryQuizButton: {
        backgroundColor: THEME.primary,
        borderRadius: 8,
        paddingVertical: 10,
    },
    tryQuizButtonText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
});