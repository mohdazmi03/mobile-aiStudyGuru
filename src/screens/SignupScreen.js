// src/screens/SignupScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Alert,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    Image,
    StatusBar,
    BackHandler
} from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GOOGLE_OAUTH_WEB_CLIENT_ID, GOOGLE_OAUTH_ANDROID_CLIENT_ID, GOOGLE_OAUTH_IOS_CLIENT_ID } from '@env';
import CustomAlert from '../components/CustomAlert';

// Ensure browser behavior is configured
WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const isPasswordLengthValid = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isPasswordComplex = isPasswordLengthValid && hasUppercase && hasNumber && hasSpecialChar;
    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isFormValid = name.trim() && isEmailValid && password && confirmPassword && isPasswordComplex && passwordsMatch;

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.navigate('Login');
            return true;
        });

        return () => backHandler.remove();
    }, []);

    const showCustomAlert = (config) => {
        setAlertConfig(config);
        setShowAlert(true);
    };

    const handleSignup = async () => {
        if (!isFormValid) {
            let alertMessage = "Please ensure all fields are filled correctly and passwords meet requirements.";
            let alertType = "warning";

            if (!name.trim()) {
                alertMessage = "Please enter your name.";
            } else if (!isEmailValid) {
                alertMessage = "Please enter a valid email address.";
            } else if (!isPasswordComplex) {
                alertMessage = "Password does not meet all complexity requirements.";
            } else if (!passwordsMatch) {
                alertMessage = "Passwords do not match.";
            }

            showCustomAlert({
                type: alertType,
                title: 'Validation Error',
                message: alertMessage
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: password,
                options: {
                    data: { full_name: name.trim(), role: 'student' }
                }
            });

            if (error) {
                showCustomAlert({
                    type: 'error',
                    title: 'Signup Failed',
                    message: error.message || 'Could not create account.'
                });
            } else if (data.user && !data.session) {
                showCustomAlert({
                    type: 'success',
                    title: 'Signup Successful',
                    message: 'Please check your email for a verification link!',
                    buttons: [{
                        text: 'OK',
                        onPress: () => navigation.navigate('Login')
                    }]
                });
                setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
            } else if (data.user && data.session) {
                showCustomAlert({
                    type: 'success',
                    title: 'Signup Successful',
                    message: 'Welcome!'
                });
                setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
            } else {
                showCustomAlert({
                    type: 'error',
                    title: 'Signup Failed',
                    message: 'Could not create account. Please try again.'
                });
            }
        } catch (catchError) {
            showCustomAlert({
                type: 'error',
                title: 'Signup Error',
                message: 'An unexpected error occurred.'
            });
        } finally {
            setLoading(false);
        }
    };

    const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
    });

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
                        title: "Google Sign-In Error",
                        message: "Could not get ID token."
                    });
                    setGoogleLoading(false);
                    return;
                }

                try {
                    const { data, error } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: id_token
                    });

                    if (error) throw error;
                    if (!data.session) throw new Error('Could not establish session.');
                } catch (error) {
                    showCustomAlert({
                        type: 'error',
                        title: 'Google Sign-In Failed',
                        message: error.message
                    });
                } finally {
                    setGoogleLoading(false);
                }
            } else if (response?.type === 'error') {
                showCustomAlert({
                    type: 'error',
                    title: "Google Sign-In Error",
                    message: response.error?.message || "Google auth failed."
                });
                setGoogleLoading(false);
            }
        };
        handleGoogleResponse();
    }, [response]);

    const triggerGoogleSignIn = () => {
        if (!request) {
            showCustomAlert({
                type: 'info',
                title: "Please Wait",
                message: "Google Sign-In is initializing."
            });
            return;
        }
        setGoogleLoading(true);
        promptAsync().catch(e => {
            showCustomAlert({
                type: 'error',
                title: "Error",
                message: "Could not start Google Sign-In process."
            });
            setGoogleLoading(false);
        });
    };

    return (
        <LinearGradient
            colors={['#E0F2F7', '#B2DFDB', '#80CBC4']}
            style={styles.gradientBackground}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Login')}
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
                        <Text style={styles.formTitle}>Create an Account</Text>
                        <Text style={styles.formSubtitle}>
                            Enter your details to get started
                        </Text>

                        <Input
                            placeholder="Full Name"
                            leftIcon={<Icon name="user" type="font-awesome" size={22} color="#888" />}
                            onChangeText={setName}
                            value={name}
                            inputContainerStyle={styles.inputContainer}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading}
                            autoCapitalize="words"
                        />

                        <Input
                            placeholder="Email Address"
                            leftIcon={<Icon name="envelope" type="font-awesome" size={20} color="#888" />}
                            onChangeText={setEmail}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            inputContainerStyle={styles.inputContainer}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading}
                        />

                        <Input
                            placeholder="Password"
                            leftIcon={<Icon name="lock" type="font-awesome" size={24} color="#888" />}
                            rightIcon={
                                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                                    <Icon name={passwordVisible ? 'eye-slash' : 'eye'} type="font-awesome" size={20} color="#888" />
                                </TouchableOpacity>
                            }
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry={!passwordVisible}
                            inputContainerStyle={styles.inputContainer}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading}
                        />

                        <Input
                            placeholder="Confirm Password"
                            leftIcon={<Icon name="lock" type="font-awesome" size={24} color="#888" />}
                            rightIcon={
                                <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                                    <Icon name={confirmPasswordVisible ? 'eye-slash' : 'eye'} type="font-awesome" size={20} color="#888" />
                                </TouchableOpacity>
                            }
                            onChangeText={setConfirmPassword}
                            value={confirmPassword}
                            secureTextEntry={!confirmPasswordVisible}
                            inputContainerStyle={[
                                styles.inputContainer,
                                confirmPassword && !passwordsMatch ? styles.inputErrorHighlight : null
                            ]}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading}
                            errorMessage={confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''}
                            errorStyle={styles.inputErrorMessage}
                        />

                        {password ? (
                            <Animatable.View animation="fadeIn" duration={300} style={styles.requirementsContainer}>
                                <Text style={isPasswordLengthValid ? styles.valid : styles.invalid}>• 6+ characters</Text>
                                <Text style={hasUppercase ? styles.valid : styles.invalid}>• 1 Uppercase letter</Text>
                                <Text style={hasNumber ? styles.valid : styles.invalid}>• 1 Number</Text>
                                <Text style={hasSpecialChar ? styles.valid : styles.invalid}>• 1 Special (!@#..)</Text>
                            </Animatable.View>
                        ) : null}

                        <Button
                            title="Sign Up"
                            onPress={handleSignup}
                            disabled={!isFormValid || loading}
                            buttonStyle={styles.primaryButton}
                            disabledStyle={styles.buttonDisabled}
                            containerStyle={styles.buttonContainer}
                            titleStyle={styles.primaryButtonTitle}
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
                                    : <Image source={require('../../assets/google-logo.png')} style={styles.socialIcon} />
                            }
                            containerStyle={styles.buttonContainer}
                            disabled={!request || loading || googleLoading}
                        />

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                                <Text style={styles.loginLink}>Log in</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.termsText}>
                            By signing up, you agree to our{' '}
                            <Text style={styles.linkText}>Terms of Service</Text>
                            {' '}and{' '}
                            <Text style={styles.linkText}>Privacy Policy</Text>.
                        </Text>
                    </Animatable.View>
                </ScrollView>
            </SafeAreaView>
            <CustomAlert
                visible={showAlert}
                {...alertConfig}
                onClose={() => setShowAlert(false)}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    appName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#014D4E',
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 15,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputOuterContainer: {
        width: '100%',
        marginBottom: 15,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: '#D0D5DD',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        height: 52,
        borderBottomWidth: 1,
    },
    inputErrorHighlight: {
        borderColor: '#ff4757',
    },
    inputErrorMessage: {
        color: '#ff4757',
        fontSize: 12,
        marginLeft: 5,
        marginTop: 3,
    },
    inputText: {
        fontSize: 16,
        color: '#101828',
    },
    requirementsContainer: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 8,
        marginTop: -10,
        marginBottom: 20,
    },
    valid: {
        fontSize: 13,
        color: '#2ed573',
        lineHeight: 18,
    },
    invalid: {
        fontSize: 13,
        color: '#ff4757',
        lineHeight: 18,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 15,
        marginTop: 10,
    },
    primaryButton: {
        backgroundColor: '#025a5a',
        borderRadius: 12,
        height: 52,
    },
    buttonDisabled: {
        backgroundColor: '#B2DFDB',
    },
    primaryButtonTitle: {
        fontWeight: '600',
        fontSize: 16,
        color: '#FFFFFF',
    },
    loginContainer: {
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 13,
        color: '#666',
    },
    loginLink: {
        fontSize: 17,
        color: '#025a5a',
        fontWeight: '600',
        marginLeft: 5,
    },
    termsText: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        marginTop: 15,
        paddingHorizontal: 10,
        lineHeight: 18,
    },
    linkText: {
        color: '#666',
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        marginVertical: 25,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 15,
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
    },
    socialButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 52,
        borderWidth: 1,
        borderColor: '#D0D5DD',
        justifyContent: 'center',
    },
    socialButtonTitle: {
        fontWeight: '600',
        fontSize: 16,
        color: '#344054',
        marginLeft: 10,
    },
    socialIcon: {
        width: 20,
        height: 20,
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