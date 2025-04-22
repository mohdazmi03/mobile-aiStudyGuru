// src/screens/IndexScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

const slides = [
    {
        id: '1',
        title: 'Welcome to AI StudyGuru',
        description: 'Revolutionize your learning with AI-driven tools.',
        image: require('../../assets/icon.png'),
    },
    {
        id: '2',
        title: 'Upload Your Notes',
        description: 'Easily upload your notes and let AI generate quizzes.',
        image: require('../../assets/splash-icon.png'),
    },
    {
        id: '3',
        title: 'Interactive Quizzes',
        description: 'Take quizzes with real-time feedback and analytics.',
        image: require('../../assets/splash.png'),
    },
    {
        id: '4',
        title: 'Collaborative Learning',
        description: 'Join a community of learners and share your knowledge.',
        image: require('../../assets/google-logo.png'),
    },
];

export default function IndexScreen() {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.navigate('Login');
        }
    };

    const handleSkip = () => {
        navigation.navigate('Login');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.activeDot,
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#E0F2F7', '#B2DFDB', '#80CBC4']}
            style={styles.gradientBackground}
        >
            <SafeAreaView style={styles.safeArea}>
                <FlatList
                    data={slides}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    ref={flatListRef}
                    onViewableItemsChanged={onViewableItemsChanged}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.slide}>
                            <Image source={item.image} style={styles.image} />
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    )}
                />
                {renderDots()}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                        <Text style={styles.nextButtonText}>{currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    image: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#014D4E',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#B2DFDB',
    },
    skipButton: {
        padding: 10,
    },
    skipButtonText: {
        fontSize: 16,
        color: '#025a5a',
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#025a5a',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    nextButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ccc',
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: '#025a5a',
    },
});