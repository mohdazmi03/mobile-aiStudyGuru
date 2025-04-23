import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
  LogBox,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function WebViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { url } = route.params;

  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    LogBox.ignoreLogs([
      'defaultProps will be removed from function components in the future',
    ]);

    const backAction = () => {
      navigation.navigate('Login');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  const onNavigationStateChange = navState => {
    setCanGoBack(navState.canGoBack);
  };

  const onError = ({ nativeEvent }) => {
    console.warn('WebView error:', nativeEvent);
  };

  // Improved injected JavaScript with better error handling and logging
  const injectedBefore = `
    (function() {
      // Debug logging function
      const logToApp = (message) => {
        console.log(message);
        window.ReactNativeWebView.postMessage('debug:' + message);
      };

      logToApp('Script injection started');
      window.ReactNativeWebView.postMessage('injection-ready');

      // SweetAlert detection with more reliable selectors
      const observePopups = () => {
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                  // Handle any SweetAlert popup
                  const isSwalPopup = 
                    node.classList?.contains('swal2-popup') || 
                    node.querySelector?.('.swal2-popup');
                  
                  if (isSwalPopup) {
                    logToApp('SweetAlert popup detected');
                    const popup = node.classList?.contains('swal2-popup') ? node : node.querySelector('.swal2-popup');
                    
                    // Find the confirm button
                    const confirmBtn = popup.querySelector('.swal2-confirm');
                    if (confirmBtn) {
                      logToApp('Found confirm button');
                      
                      // Check if it's a success popup
                      const isSuccess = 
                        popup.querySelector('.swal2-icon-success') || 
                        popup.querySelector('.swal2-success');
                      
                      if (isSuccess) {
                        logToApp('Success popup detected');
                        
                        // Attach click handler to OK button
                        confirmBtn.addEventListener('click', () => {
                          logToApp('Success popup OK clicked');
                          window.ReactNativeWebView.postMessage('popup-ok');
                        }, { once: true });
                      } else {
                        logToApp('Error/other popup detected');
                      }
                    }
                  }
                }
              });
            }
          }
        });
        
        // Observe the entire document body for popup changes
        observer.observe(document.body, { childList: true, subtree: true });
        logToApp('Popup observer attached');
      };

      // Handle navigation interception
      const setupNavigationControl = () => {
        document.addEventListener('click', function(e) {
          const target = e.target;
          if (!target) return;

          // Get clicked anchor or closest parent anchor
          const a = target.tagName === 'A' ? target : target.closest('a');
          
          // Check if click is in header
          const headerEl = target.closest('header');
          
          // Don't interfere with SweetAlert popups
          if (target.closest('.swal2-popup') || target.closest('.swal2-container')) {
            logToApp('Click inside popup - not intercepting');
            return;
          }

          // Handle header clicks
          if (headerEl) {
            // Allow only "Join Quiz" link in header
            if (a && (a.textContent.trim().toLowerCase() === 'join quiz' || 
                     a.innerText.trim().toLowerCase() === 'join quiz')) {
              logToApp('Join Quiz clicked');
              e.preventDefault();
              window.ReactNativeWebView.postMessage('link-join-quiz');
            } else {
              // Prevent any other header navigation
              logToApp('Prevented header navigation');
              e.preventDefault();
              e.stopPropagation();
            }
            return;
          }

          // Handle "Back to Login" or login links
          if (a) {
            const href = a?.getAttribute('href');
            const linkText = a?.textContent.trim().toLowerCase() || '';
            
            if (href === '/login' || linkText === 'back to login') {
              logToApp('Login link clicked: ' + linkText);
              e.preventDefault();
              window.ReactNativeWebView.postMessage('link-login');
            }
          }
        }, true);
        
        logToApp('Click handler attached');
      };

      // Setup all listeners when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          observePopups();
          setupNavigationControl();
        });
      } else {
        observePopups();
        setupNavigationControl();
      }
    })();
    true;
  `;

  const handleMessage = ({ nativeEvent: { data } }) => {
    if (data.startsWith('debug:')) {
      console.log('WebView debug:', data.substring(6));
      return;
    }

    switch (data) {
      case 'popup-ok':
        console.log('Handling popup-ok: Navigating to Login');
        // Reset navigation stack to avoid back navigation issues
        navigation.reset({ 
          index: 0, 
          routes: [{ name: 'Login' }] 
        });
        break;
      case 'link-login':
        console.log('Handling link-login');
        navigation.navigate('Login');
        break;
      case 'link-join-quiz':
        console.log('Handling link-join-quiz');
        navigation.navigate('JoinQuiz');
        break;
      default:
        console.log('Unknown message:', data);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        injectedJavaScriptBeforeContentLoaded={injectedBefore}
        onMessage={handleMessage}
        onError={onError}
        onNavigationStateChange={onNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#025a5a" />
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
  loadingContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
});