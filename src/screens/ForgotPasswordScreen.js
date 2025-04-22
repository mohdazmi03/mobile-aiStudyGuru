import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { forgotPassword } from '../lib/api';
import CustomAlert from '../components/CustomAlert';
import * as Animatable from 'react-native-animatable';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [captcha, setCaptcha] = useState('');
    const [generatedCaptcha, setGeneratedCaptcha] = useState('');
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        generateNewCaptcha();
        checkConnectivity();
    }, []);

    const checkConnectivity = async () => {
        try {
            const response = await fetch('https://www.google.com');
            setIsOffline(!response.ok);
        } catch (error) {
            setIsOffline(true);
        }
    };

    const generateNewCaptcha = () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedCaptcha(randomNum);
    };

    const showCustomAlert = (config) => {
        setAlertConfig(config);
        setShowAlert(true);
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        await checkConnectivity();
        if (isOffline) {
            showCustomAlert({
                type: 'error',
                title: 'No Internet Connection',
                message: 'Please check your internet connection and try again.'
            });
            return;
        }

        if (!email) {
            showCustomAlert({
                type: 'warning',
                title: 'Email Required',
                message: 'Please enter your email address.'
            });
            return;
        }

        if (!validateEmail(email)) {
            showCustomAlert({
                type: 'warning',
                title: 'Invalid Email',
                message: 'Please enter a valid email address.'
            });
            return;
        }

        if (captcha !== generatedCaptcha) {
            showCustomAlert({
                type: 'error',
                title: 'Invalid Captcha',
                message: 'Please enter the correct verification code.'
            });
            generateNewCaptcha();
            setCaptcha('');
            return;
        }

        setLoading(true);
        try {
            const { message } = await forgotPassword(email.trim().toLowerCase());
            showCustomAlert({
                type: 'success',
                title: 'Success',
                message
            });
            setEmail('');
            setCaptcha('');
            generateNewCaptcha();
        } catch (error) {
            showCustomAlert({
                type: 'error',
                title: 'Error',
                message: error.message || 'Could not process your request. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" type="font-awesome" size={20} color="#025a5a" />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animatable.View animation="fadeInDown" duration={800} style={styles.headerContainer}>
                        <Text style={styles.title}>Forgot Password</Text>
                        <Text style={styles.description}>
                            Enter your email address and we'll send you instructions to reset your password.
                        </Text>
                    </Animatable.View>

                    {isOffline && (
                        <View style={styles.offlineWarning}>
                            <Icon name="wifi-off" type="feather" size={20} color="#721c24" />
                            <Text style={styles.offlineText}>
                                You are currently offline. Please check your internet connection.
                            </Text>
                        </View>
                    )}

                    <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
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
                            disabled={loading || isOffline}
                        />

                        <View style={styles.captchaContainer}>
                            <Text style={styles.captchaLabel}>Verification Code</Text>
                            <View style={styles.captchaDisplay}>
                                <Text style={styles.captchaCode}>{generatedCaptcha}</Text>
                                <TouchableOpacity onPress={generateNewCaptcha} style={styles.refreshButton}>
                                    <Icon name="refresh" type="font-awesome" size={20} color="#025a5a" />
                                </TouchableOpacity>
                            </View>
                            <Input
                                placeholder="Enter the code above"
                                onChangeText={setCaptcha}
                                value={captcha}
                                keyboardType="number-pad"
                                inputContainerStyle={styles.inputContainer}
                                inputStyle={styles.inputText}
                                placeholderTextColor="#aaa"
                                containerStyle={styles.inputOuterContainer}
                                disabled={loading || isOffline}
                            />
                        </View>

                        <Button
                            title={loading ? 'Sending...' : 'Send Reset Instructions'}
                            onPress={handleSubmit}
                            buttonStyle={styles.submitButton}
                            containerStyle={styles.buttonContainer}
                            titleStyle={styles.buttonTitle}
                            disabled={loading || isOffline}
                            loading={loading}
                            loadingProps={{ color: '#FFF' }}
                        />

                        <TouchableOpacity 
                            style={styles.backToLoginButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.backToLoginText}>Back to Login</Text>
                        </TouchableOpacity>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B2DFDB',
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
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
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#025a5a',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inputOuterContainer: {
        marginBottom: 15,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: '#D0D5DD',
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 52,
        borderBottomWidth: 1,
    },
    inputText: {
        fontSize: 16,
        color: '#101828',
    },
    captchaContainer: {
        marginBottom: 20,
    },
    captchaLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    captchaDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    captchaCode: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 3,
        color: '#025a5a',
    },
    refreshButton: {
        marginLeft: 15,
        padding: 8,
    },
    buttonContainer: {
        width: '100%',
        marginVertical: 10,
    },
    submitButton: {
        backgroundColor: '#025a5a',
        borderRadius: 12,
        height: 52,
    },
    buttonTitle: {
        fontWeight: '600',
        fontSize: 16,
    },
    backToLoginButton: {
        alignItems: 'center',
        marginTop: 15,
    },
    backToLoginText: {
        color: '#025a5a',
        fontSize: 16,
        fontWeight: '500',
    },
    offlineWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8d7da',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    offlineText: {
        color: '#721c24',
        marginLeft: 10,
        flex: 1,
    },
});

export default ForgotPasswordScreen;