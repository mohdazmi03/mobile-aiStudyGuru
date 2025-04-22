// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    Image,
    StatusBar,
    BackHandler
} from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { forgotPassword } from '../lib/api';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../components/CustomAlert';
import { GOOGLE_OAUTH_WEB_CLIENT_ID, GOOGLE_OAUTH_ANDROID_CLIENT_ID, GOOGLE_OAUTH_IOS_CLIENT_ID } from '@env';

// Ensure browser behavior is configured
WebBrowser.maybeCompleteAuthSession();

if (!GOOGLE_OAUTH_WEB_CLIENT_ID || !GOOGLE_OAUTH_ANDROID_CLIENT_ID || !GOOGLE_OAUTH_IOS_CLIENT_ID) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("WARN: Google OAuth Client ID(s) might be missing or not loaded yet from .env!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
}

const LoginScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
    });
    console.log("[AuthSession] Forcing Proxy Redirect URI:", redirectUri);

    console.log('--- LoginScreen Render Debug ---');
    console.log('Web Client ID Used:', GOOGLE_OAUTH_WEB_CLIENT_ID);
    console.log('Android Client ID Used:', GOOGLE_OAUTH_ANDROID_CLIENT_ID);
    console.log('iOS Client ID Used:', GOOGLE_OAUTH_IOS_CLIENT_ID);
    console.log('--- END Render Debug ---');

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
        iosClientId: GOOGLE_OAUTH_IOS_CLIENT_ID,
        androidClientId: GOOGLE_OAUTH_ANDROID_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
    });

    useEffect(() => {
        const handleGoogleResponse = async () => {
            if (response?.type === 'success') {
                setGoogleLoading(true);
                const { id_token } = response.params;
                if (!id_token) {
                    showCustomAlert({
                        type: 'error',
                        title: 'Google Sign-In Error',
                        message: 'Could not get ID token.'
                    });
                    setGoogleLoading(false);
                    return;
                }

                console.log("Google ID Token received, attempting Supabase sign-in...");
                const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: id_token });
                setGoogleLoading(false);

                if (error) {
                    console.error("Supabase Google sign-in error:", error);
                    showCustomAlert({
                        type: 'error',
                        title: 'Google Sign-In Failed',
                        message: error.message
                    });
                } else if (!data.session) {
                    console.warn("Supabase sign-in via Google successful, but no session returned.");
                    showCustomAlert({
                        type: 'error',
                        title: 'Google Sign-In Failed',
                        message: 'Could not establish session.'
                    });
                } else {
                    console.log("Supabase Google sign-in successful for user:", data.user?.id);
                }
            } else if (response?.type === 'error') {
                console.error("Google Auth Error:", response.error);
                showCustomAlert({
                    type: 'error',
                    title: 'Google Sign-In Error',
                    message: response.error?.message || "Google auth failed."
                });
                setGoogleLoading(false);
            } else if (response?.type === 'cancel') {
                console.log("Google Sign-In cancelled.");
                setGoogleLoading(false);
            }
        };
        handleGoogleResponse();
    }, [response]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.navigate('Index');
            return true;
        });

        return () => backHandler.remove();
    }, []);

    const showCustomAlert = (config) => {
        setAlertConfig(config);
        setShowAlert(true);
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showCustomAlert({
                type: 'warning',
                title: 'Missing Information',
                message: 'Please enter email and password.'
            });
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: password
            });
            if (error) {
                if (error.message.includes("Email not confirmed")) {
                    showCustomAlert({
                        type: 'warning',
                        title: 'Email Not Verified',
                        message: 'Please check your email for a verification link.'
                    });
                } else {
                    showCustomAlert({
                        type: 'error',
                        title: 'Login Failed',
                        message: error.message
                    });
                }
            } else if (!data.session) {
                showCustomAlert({
                    type: 'error',
                    title: 'Login Failed',
                    message: 'Could not sign in.'
                });
            } else {
                setEmail('');
                setPassword('');
            }
        } catch (e) {
            showCustomAlert({
                type: 'error',
                title: 'Login Error',
                message: 'An unexpected error occurred.'
            });
        } finally {
            setLoading(false);
        }
    };

    const triggerGoogleSignIn = () => {
        if (!GOOGLE_OAUTH_WEB_CLIENT_ID || !GOOGLE_OAUTH_ANDROID_CLIENT_ID || !GOOGLE_OAUTH_IOS_CLIENT_ID) {
            console.error("Attempted Google Sign-In with missing Client IDs!");
            showCustomAlert({
                type: 'error',
                title: 'Configuration Error',
                message: 'Google Sign-In is not configured correctly in .env. Please contact support or check logs.'
            });
            return;
        }
        if (!request) {
            console.error("Google Sign-In request not ready yet.");
            showCustomAlert({
                type: 'warning',
                title: 'Please Wait',
                message: 'Google Sign-In is initializing. Please try again in a moment.'
            });
            return;
        }
        setGoogleLoading(false);
        promptAsync().catch(e => {
            console.error("promptAsync error:", e);
            showCustomAlert({
                type: 'error',
                title: 'Error',
                message: 'Could not start Google Sign-In process.'
            });
            setGoogleLoading(false);
        });
    };

    return (
        <View style={[styles.container, styles.gradientBackground]}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Index')}
                >
                    <Icon name="arrow-left" type="font-awesome" size={20} color="#025a5a" />
                </TouchableOpacity>
                <View style={styles.headerContainer}>
                    <TouchableOpacity 
                        style={styles.joinQuizButton}
                        onPress={() => navigation.navigate('JoinQuiz')}
                    >
                        <Text style={styles.joinQuizText}>Join Quiz</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animatable.View animation="fadeInDown" duration={800} style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/icon.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>AI StudyGuru</Text>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
                        <Text style={styles.formTitle}>LOGIN</Text>

                        <Input
                            placeholder="email@domain.com"
                            leftIcon={<Icon name="envelope" type="font-awesome" size={20} color="#888" />}
                            onChangeText={setEmail}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            inputContainerStyle={styles.inputContainer}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading || googleLoading}
                        />
                        <Input
                            placeholder="Password"
                            leftIcon={<Icon name="lock" type="font-awesome" size={24} color="#888" />}
                            rightIcon={
                                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                                    <Icon name={passwordVisible ? 'eye-slash' : 'eye'} type="font-awesome" size={20} color="#888"/>
                                </TouchableOpacity>
                            }
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry={!passwordVisible}
                            inputContainerStyle={styles.inputContainer}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading || googleLoading}
                        />
                        <TouchableOpacity 
                            style={styles.forgotPasswordButton} 
                            onPress={handleForgotPassword}
                            disabled={loading || googleLoading}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>
                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            buttonStyle={styles.primaryButton}
                            containerStyle={styles.buttonContainer}
                            titleStyle={styles.primaryButtonTitle}
                            disabled={loading || googleLoading}
                            loading={loading}
                            loadingProps={{ color: '#FFF' }}
                        />

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Button
                            title="Continue with Google"
                            onPress={triggerGoogleSignIn}
                            buttonStyle={styles.socialButton}
                            titleStyle={styles.socialButtonTitle}
                            icon={
                                googleLoading
                                    ? <ActivityIndicator size="small" color="#555" />
                                    : <Image source={require('../../assets/google-logo.png')} style={styles.socialIcon}/>
                            }
                            containerStyle={styles.buttonContainer}
                            disabled={!request || loading || googleLoading}
                        />

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading || googleLoading}>
                                <Text style={styles.signupLink}>Sign up</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.termsText}>
                            By continuing, you agree to our{' '}
                            <Text style={styles.linkText}>Terms of Service</Text>
                            {' '}and{' '}
                            <Text style={styles.linkText}>Privacy Policy</Text>.
                        </Text>
                    </Animatable.View>
                </ScrollView>
                <CustomAlert
                    visible={showAlert}
                    {...alertConfig}
                    onClose={() => setShowAlert(false)}
                />
            </SafeAreaView>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        backgroundColor: '#B2DFDB',
    },
    safeArea: { flex: 1, },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 40, },
    logoContainer: { alignItems: 'center', marginBottom: 30, },
    logo: { width: 80, height: 80, marginBottom: 10, },
    appName: { fontSize: 26, fontWeight: 'bold', color: '#014D4E', },
    formContainer: { width: '100%', alignItems: 'center', },
    formTitle: { fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 18, },
    inputOuterContainer: { width: '100%', marginBottom: 15, },
    inputContainer: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 10, height: 52, borderBottomWidth: 1, },
    inputText: { fontSize: 16, color: '#101828', },
    forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 20, },
    forgotPasswordText: { color: '#025a5a', fontSize: 14, fontWeight: '500', },
    buttonContainer: { width: '100%', marginBottom: 15, },
    primaryButton: { backgroundColor: '#025a5a', borderRadius: 12, height: 52, },
    primaryButtonTitle: { fontWeight: '600', fontSize: 16, color: '#FFFFFF', },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '90%', marginVertical: 25, },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0', },
    dividerText: { marginHorizontal: 15, color: '#888', fontSize: 14, fontWeight: '500', },
    socialButton: { backgroundColor: '#FFFFFF', borderRadius: 12, height: 52, borderWidth: 1, borderColor: '#D0D5DD', justifyContent: 'center', },
    socialButtonTitle: { fontWeight: '600', fontSize: 16, color: '#344054', marginLeft: 10, },
    socialIcon: { width: 20, height: 20, },
    signupContainer: { flexDirection: 'row', marginTop: 20, marginBottom: 20, justifyContent: 'center', alignItems: 'center', },
    signupText: { fontSize: 14, color: '#666', },
    signupLink: { fontSize: 14, color: '#025a5a', fontWeight: '600', marginLeft: 5, },
    termsText: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 15, paddingHorizontal: 10, lineHeight: 18, },
    linkText: { color: '#666', fontWeight: '500', textDecorationLine: 'underline', },
    headerContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        zIndex: 1,
    },
    joinQuizButton: {
        backgroundColor: '#025a5a',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    joinQuizText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 20,
        zIndex: 1,
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
});