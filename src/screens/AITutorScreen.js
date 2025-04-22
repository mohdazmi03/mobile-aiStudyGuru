// src/screens/AITutorScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function AITutorScreen() { // Ensure default export
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>AI Tutor</Text>
                <Text>AI Tutor features coming soon!</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f4f4' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#025a5a' },
});