import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Icon } from '@rneui/themed';
import * as Animatable from 'react-native-animatable';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible = false,
  title = '',
  message = '',
  buttons = null,
  type = 'info',       // 'success' | 'error' | 'warning' | 'info'
  onClose = () => {},
}) {
  const getIconProps = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#10B981' };
      case 'error':
        return { name: 'times-circle', color: '#EF4444' };
      case 'warning':
        return { name: 'exclamation-circle', color: '#F59E0B' };
      default:
        return { name: 'info-circle', color: '#3B82F6' };
    }
  };

  const { name: iconName, color: iconColor } = getIconProps();

  const BlurBackground = ({ children }) =>
    Platform.OS === 'ios' ? (
      <BlurView intensity={50} tint="dark" style={styles.overlay}>
        {children}
      </BlurView>
    ) : (
      <View style={[styles.overlay, styles.androidOverlay]}>
        {children}
      </View>
    );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurBackground>
        <Animatable.View animation="zoomIn" duration={300} style={styles.container}>
          <View style={styles.content}>
            <Icon
              name={iconName}
              type="font-awesome"
              size={40}
              color={iconColor}
              containerStyle={styles.icon}
            />

            <Text style={styles.title}>{title}</Text>

            {!!message && <Text style={styles.message}>{message}</Text>}

            <View style={styles.buttonContainer}>
              {buttons
                ? buttons.map((btn, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.button,
                        btn.style === 'cancel' && styles.cancelButton,
                        btn.style === 'destructive' && styles.destructiveButton,
                        i > 0 && styles.buttonSpacing,
                      ]}
                      onPress={() => {
                        btn.onPress?.();
                        if (!btn.preventClose) onClose();
                      }}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          btn.style === 'cancel' && styles.cancelButtonText,
                          btn.style === 'destructive' && styles.destructiveButtonText,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  ))
                : (
                  <TouchableOpacity style={styles.button} onPress={onClose}>
                    <Text style={styles.buttonText}>OK</Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        </Animatable.View>
      </BlurBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#025a5a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpacing: {
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#4B5563',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});
