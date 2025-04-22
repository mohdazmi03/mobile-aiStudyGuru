// src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function SettingsScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Settings</Text>
                <Text>App settings coming soon!</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f4f4' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
     title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
});