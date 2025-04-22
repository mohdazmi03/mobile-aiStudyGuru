import React, { useState } from 'react';
import {
    StyleSheet,
    Modal,
    Text,
    TouchableOpacity,
    Dimensions,
    Platform,
    TextInput,
    View,
    Keyboard,
} from 'react-native';
import { Icon } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';

const CustomPrompt = ({
    visible,
    title,
    message,
    placeholder = '',
    onSubmit,
    onCancel,
}) => {
    const [value, setValue] = useState('');

    const handleSubmit = () => {
        Keyboard.dismiss();
        onSubmit(value);
        setValue('');
    };

    const handleCancel = () => {
        setValue('');
        onCancel();
    };

    const BlurBackground = ({ children }) => {
        if (Platform.OS === 'ios') {
            return (
                <BlurView intensity={50} tint="dark" style={styles.overlay}>
                    {children}
                </BlurView>
            );
        }
        return (
            <View style={[styles.overlay, styles.androidOverlay]}>
                {children}
            </View>
        );
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <BlurBackground>
                <Animatable.View
                    animation="zoomIn"
                    duration={300}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        {message && <Text style={styles.message}>{message}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            value={value}
                            onChangeText={setValue}
                            autoFocus
                            onSubmitEditing={handleSubmit}
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleCancel}
                            >
                                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.submitButton]}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.buttonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animatable.View>
            </BlurBackground>
        </Modal>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    androidOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    container: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#4B5563',
        marginBottom: 16,
        lineHeight: 24,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 24,
        backgroundColor: '#F9FAFB',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
        marginLeft: 12,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    submitButton: {
        backgroundColor: '#025a5a',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cancelButtonText: {
        color: '#4B5563',
    },
});