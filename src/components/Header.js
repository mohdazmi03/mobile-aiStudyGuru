// src/components/Header.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native'; // Import DrawerActions

export default function AppHeader({ title, showDrawerToggle = false }) {
    const navigation = useNavigation();

    const handleDrawerToggle = () => {
        navigation.dispatch(DrawerActions.toggleDrawer());
    };

    return (
        <View style={styles.headerContainer}>
            <View style={styles.leftContainer}>
                {showDrawerToggle && (
                    <TouchableOpacity onPress={handleDrawerToggle} style={styles.toggleButton}>
                        <Icon name="bars" type="font-awesome" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
                 {/* Only show logo if drawer toggle isn't shown, or conditionally */}
                 {!showDrawerToggle && (
                     <Image
                        source={require('../../assets/icon.png')} // Or your specific logo
                        style={styles.logo}
                    />
                 )}
                <Text style={styles.title}>{title || 'AI StudyGuru'}</Text>
            </View>
            <View style={styles.rightContainer}>
                {/* Add right-side icons/buttons if needed later */}
                 {/* Example: Join Quiz Button */}
                {/* <TouchableOpacity style={styles.joinButton} onPress={() => navigation.navigate('JoinQuiz')}>
                     <Icon name="key" type="font-awesome" size={14} color="#FFF" />
                     <Text style={styles.joinButtonText}>Join</Text>
                 </TouchableOpacity> */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        height: Platform.OS === 'android' ? 56 : 65, // Standard header height
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#025a5a', // Match web header
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 10 : 0, // Adjust padding for iOS status bar overlap
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleButton: {
        marginRight: 15,
        padding: 5, // Add padding for easier tapping
    },
    logo: {
        width: 30,
        height: 30,
        marginRight: 8,
        // tintColor: '#FFF', // If using a single color logo and want it white
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
     joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    joinButtonText: {
        color: '#FFF',
        marginLeft: 5,
        fontSize: 14,
        fontWeight: '500',
    },
});