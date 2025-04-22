// src/components/CustomDrawerContent.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform,
    SafeAreaView, ScrollView
} from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Icon } from 'react-native-elements';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

// Define Theme Colors
const THEME = {
    primary: '#025a5a',
    primaryLight: '#E0F7FA',
    accent: '#FFD700',
    textLight: '#FFFFFF',
    textDark: '#111827',
    textSecondary: '#4B5563',
    inactiveTint: '#025a5a',
    logout: '#D32F2F',
    separator: '#D1D5DB',
    profileBg: '#A7F3D0',
    profileTextDark: '#064E3B',
    profileTextLight: '#047857',
};

export default function CustomDrawerContent(props) {
    const [profile, setProfile] = useState(null);
    const navigation = useNavigation();

    // Fetch Profile Logic (no change needed)
    useEffect(() => { /* ... existing fetch logic ... */
        let isMounted = true; const fetchProfile = async () => { try { const { data: { user } } = await supabase.auth.getUser(); if (user && isMounted) { const { data: profileData, error } = await supabase .from('profiles').select('full_name, email, avatar_url').eq('id', user.id).maybeSingle(); if (error) { console.error("Error fetching drawer profile:", error); setProfile({ email: user.email, full_name: 'User' }); } else { setProfile(profileData || { email: user.email, full_name: 'User' }); } } } catch (e) { console.error("Exception fetching drawer profile:", e); if (isMounted) setProfile(null); } }; fetchProfile(); return () => { isMounted = false; };
     }, []);

    // Logout Handler (no change needed)
    const handleLogout = async () => { /* ... existing logout logic ... */
        Alert.alert("Logout", "Are you sure?", [ { text: "Cancel", style: "cancel" }, { text: "Logout", style: "destructive", onPress: async () => { const { error } = await supabase.auth.signOut(); if (error) Alert.alert("Error", "Failed to log out."); }, }, ]);
    };

    // Navigate to the Profile TAB when profile section is pressed
    const navigateToProfileTab = () => {
        props.navigation.closeDrawer(); // Close the drawer first
        // Navigate to the main Tab navigator, telling it which tab screen to show
        setTimeout(() => navigation.navigate('MainBottomTabs', { screen: 'ProfileTab' }), 250);
    };

    return (
        <SafeAreaView style={styles.safeAreaContainer} edges={['top', 'bottom']}>
            {/* Profile Section */}
            <Animatable.View animation="fadeInDown" duration={600}>
                 <TouchableOpacity
                    style={styles.profileSection}
                    onPress={navigateToProfileTab} // Use the updated handler
                >
                   {/* ... Avatar and Profile Info (no change needed) ... */}
                    <View style={styles.avatarPlaceholder}>{profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} /> : <View style={styles.defaultAvatar}><Icon name="user" type="font-awesome" size={30} color={THEME.primary} /></View>}</View>
                    <View style={styles.profileInfo}><Text style={styles.profileName} numberOfLines={1}>{profile?.full_name || 'AI StudyGuru User'}</Text><Text style={styles.profileEmail} numberOfLines={1}>{profile?.email}</Text></View>
                 </TouchableOpacity>
            </Animatable.View>

            {/* Navigation Items List */}
             <ScrollView style={styles.itemListScrollView}>
                {/* Renders items defined in MainDrawerNavigator */}
                {/* Should now show 'Dashboard', 'Upload Notes', 'AI Chat' */}
                <DrawerItemList {...props} />
            </ScrollView>

            {/* Footer Section for Logout */}
            <View style={styles.footer}>
                 <View style={styles.separator} />
                 <DrawerItem
                    label="Logout"
                    icon={({ size }) => <Icon name="sign-out" type="font-awesome" color={THEME.logout} size={size} />}
                    onPress={handleLogout}
                    labelStyle={styles.logoutLabel}
                    style={styles.logoutItemContainer}
                    inactiveTintColor={THEME.logout}
                 />
            </View>
        </SafeAreaView>
    );
}

// --- Styles ---
// Styles remain the same as the previous correct version
const styles = StyleSheet.create({
    safeAreaContainer: { flex: 1, backgroundColor: THEME.primaryLight, },
    profileSection: { paddingVertical: Platform.OS === 'ios' ? 25 : 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.profileBg, borderBottomWidth: 1, borderBottomColor: THEME.separator, },
    avatarPlaceholder: { width: 55, height: 55, borderRadius: 27.5, marginRight: 15, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(2, 90, 90, 0.3)', backgroundColor: '#fff', },
    avatar: { width: '100%', height: '100%', },
    defaultAvatar: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', },
    profileInfo: { flex: 1, },
    profileName: { fontSize: 16, fontWeight: '600', color: THEME.profileTextDark, marginBottom: 2, },
    profileEmail: { fontSize: 13, color: THEME.profileTextLight, },
    itemListScrollView: { flex: 1, marginTop: 8, },
    footer: { paddingBottom: Platform.OS === 'ios' ? 5 : 10, },
    separator: { height: 1, backgroundColor: THEME.separator, marginHorizontal: 15, marginBottom: 5, marginTop: 5, },
    logoutItemContainer: { marginHorizontal: 12, marginVertical: 5, },
    logoutLabel: { fontWeight: '600', color: THEME.logout, marginLeft: 5, fontSize: 15, }, // Matched marginLeft from AppNavigator
});