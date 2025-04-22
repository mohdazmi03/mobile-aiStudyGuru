import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '@rneui/themed';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();

  const handleNavStateChange = ({ url }) => {
    // Adjust this match to whatever your site uses on successful reset
    if (url.includes('reset-success') || url.includes('success')) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="close" type="font-awesome" size={24} />
        </TouchableOpacity>
      </View>
      <WebView
        source={{ uri: 'https://www.aistudyguru.com/forgot-password' }}
        onNavigationStateChange={handleNavStateChange}
        startInLoadingState
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: Platform.OS === 'ios' ? 70 : 50,
    paddingTop: Platform.OS === 'ios' ? 30 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  title: { fontSize: 18, fontWeight: '600' },
  closeBtn: { padding: 5 },
  webview: { flex: 1 },
});
