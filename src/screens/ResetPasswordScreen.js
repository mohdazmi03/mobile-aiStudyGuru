import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Platform,
} from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resetPassword, validatePassword } from '../lib/api';
import CustomAlert from '../components/CustomAlert';
import * as Animatable from 'react-native-animatable';

const ResetPasswordScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [validation, setValidation] = useState({
        isValid: false,
        checks: {
            minLength: false,
            hasUpperCase: false,
            hasLowerCase: false,
            hasNumbers: false,
            hasSpecialChar: false,
        },
        errors: []
    });

    useEffect(() => {
        setValidation(validatePassword(newPassword));
    }, [newPassword]);

    const showCustomAlert = (config) => {
        setAlertConfig(config);
        setShowAlert(true);
    };

    const handleSubmit = async () => {
        if (!validation.isValid) {
            showCustomAlert({
                type: 'warning',
                title: 'Invalid Password',
                message: validation.errors.join('\n')
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            showCustomAlert({
                type: 'warning',
                title: 'Passwords Do Not Match',
                message: 'Please ensure both passwords match.'
            });
            return;
        }

        setLoading(true);
        try {
            const { message } = await resetPassword(newPassword);
            showCustomAlert({
                type: 'success',
                title: 'Success',
                message,
                buttons: [{
                    text: 'OK',
                    onPress: () => navigation.replace('Login')
                }]
            });
        } catch (error) {
            showCustomAlert({
                type: 'error',
                title: 'Error',
                message: error.message || 'Could not reset password. Please try again.'
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
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.description}>
                            Please enter your new password below.
                        </Text>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
                        <Input
                            placeholder="New Password"
                            leftIcon={<Icon name="lock" type="font-awesome" size={24} color="#888" />}
                            rightIcon={
                                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                                    <Icon name={passwordVisible ? 'eye-slash' : 'eye'} type="font-awesome" size={20} color="#888" />
                                </TouchableOpacity>
                            }
                            onChangeText={setNewPassword}
                            value={newPassword}
                            secureTextEntry={!passwordVisible}
                            inputContainerStyle={styles.inputContainer}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading}
                        />

                        <Input
                            placeholder="Confirm New Password"
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
                                confirmPassword && newPassword !== confirmPassword && styles.inputError
                            ]}
                            inputStyle={styles.inputText}
                            placeholderTextColor="#aaa"
                            containerStyle={styles.inputOuterContainer}
                            disabled={loading}
                            errorMessage={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
                        />

                        <View style={styles.requirementsContainer}>
                            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                            <Text style={validation.checks.minLength ? styles.valid : styles.invalid}>
                                • At least 8 characters
                            </Text>
                            <Text style={validation.checks.hasUpperCase ? styles.valid : styles.invalid}>
                                • At least one uppercase letter
                            </Text>
                            <Text style={validation.checks.hasLowerCase ? styles.valid : styles.invalid}>
                                • At least one lowercase letter
                            </Text>
                            <Text style={validation.checks.hasNumbers ? styles.valid : styles.invalid}>
                                • At least one number
                            </Text>
                            <Text style={validation.checks.hasSpecialChar ? styles.valid : styles.invalid}>
                                • At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                            </Text>
                        </View>

                        <Button
                            title="Reset Password"
                            onPress={handleSubmit}
                            buttonStyle={styles.submitButton}
                            containerStyle={styles.buttonContainer}
                            titleStyle={styles.buttonTitle}
                            disabled={!validation.isValid || newPassword !== confirmPassword || loading}
                            loading={loading}
                            loadingProps={{ color: '#FFF' }}
                        />

                        <TouchableOpacity 
                            style={styles.backToLoginButton}
                            onPress={() => navigation.navigate('Login')}
                            disabled={loading}
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
    inputError: {
        borderColor: '#DC2626',
    },
    inputText: {
        fontSize: 16,
        color: '#101828',
    },
    requirementsContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    valid: {
        color: '#059669',
        fontSize: 14,
        marginBottom: 5,
    },
    invalid: {
        color: '#DC2626',
        fontSize: 14,
        marginBottom: 5,
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
});

export default ResetPasswordScreen;