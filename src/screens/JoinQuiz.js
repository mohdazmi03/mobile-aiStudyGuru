import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
  Image,
  StatusBar,
  BackHandler,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../components/CustomAlert';
import CustomPrompt from '../components/CustomPrompt';
import { useDialog } from '../hooks/useDialog';

export default function JoinQuiz() {
  const navigation = useNavigation();
  const route = useRoute();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizDetails, setQuizDetails] = useState(null);
  const [showQuizDetails, setShowQuizDetails] = useState(false);
  const { prompt, showPrompt, promptConfig, closePrompt } = useDialog();
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  const showCustomAlert = (config) => {
    setAlertConfig(config);
    setShowAlert(true);
  };

  // Back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Login');
      return true;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    // Check if code was passed through navigation
    if (route.params?.code) {
      setCode(route.params.code);
      handleValidateCode(route.params.code);
    }
  }, [route.params?.code]);

  const handleValidateCode = async (codeToValidate = code) => {
    const trimmedCode = codeToValidate.trim();
    if (trimmedCode.length !== 6) {
      showCustomAlert({
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter a valid 6-digit access code.',
      });
      return;
    }

    setLoading(true);
    setQuizDetails(null);
    setShowQuizDetails(false);

    try {
      const { data, error } = await supabase
        .from('shared_quizzes')
        .select(`
          id,
          quiz_id,
          access_code,
          start_at,
          expires_at,
          quizzes (
            id,
            title,
            description,
            category,
            difficulty,
            type,
            number_of_questions,
            created_by
          )
        `)
        .eq('access_code', trimmedCode)
        .single();

      if (error || !data) {
        throw new Error('Quiz not found or invalid code');
      }

      const { data: creatorData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('email', data.quizzes.created_by)
        .single();

      setQuizDetails({
        ...data.quizzes,
        creator_name: creatorData?.full_name || 'Unknown',
        start_at: data.start_at,
        expires_at: data.expires_at,
        shared_quiz_id: data.id,
      });
      setShowQuizDetails(true);

    } catch (error) {
      // clear the input so user can retry
      setCode('');
      showCustomAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to validate the code',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quizDetails) {
      showCustomAlert({
        type: 'error',
        title: 'Error',
        message: 'Quiz details not found',
      });
      return;
    }

    if (quizDetails.start_at && new Date(quizDetails.start_at) > new Date()) {
      showCustomAlert({
        type: 'warning',
        title: 'Quiz Not Available',
        message: `This quiz will be available from:\n${new Date(
          quizDetails.start_at
        ).toLocaleString()}`,
      });
      return;
    }

    if (quizDetails.expires_at && new Date(quizDetails.expires_at) < new Date()) {
      showCustomAlert({
        type: 'warning',
        title: 'Quiz Expired',
        message: `This quiz expired on:\n${new Date(
          quizDetails.expires_at
        ).toLocaleString()}`,
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      prompt({
        title: 'Enter Your Name',
        message: 'Please enter your name to attempt the quiz',
        placeholder: 'Your name',
        onSubmit: (name) => {
          if (!name?.trim()) {
            showCustomAlert({
              type: 'error',
              title: 'Error',
              message: 'Name is required',
            });
            return;
          }
          navigation.navigate('QuizAttempt', {
            quizId: quizDetails.id,
            sharedQuizId: quizDetails.shared_quiz_id,
            guestName: name.trim(),
          });
          closePrompt();
        },
        onCancel: closePrompt,
      });
    } else {
      navigation.navigate('QuizAttempt', {
        quizId: quizDetails.id,
        sharedQuizId: quizDetails.shared_quiz_id,
      });
    }
  };

  return (
    <View style={[styles.container, styles.gradientBackground]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        
        {/* Back button and Join Quiz button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <Icon name="arrow-left" type="font-awesome" size={20} color="#025a5a" />
        </TouchableOpacity>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {/* Logo & Title */}
            <Animatable.View animation="fadeInDown" duration={800} style={styles.logoContainer}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.appName}>AI StudyGuru</Text>
            </Animatable.View>

            {/* Main Content: Either Code Input or Quiz Details */}
            {!showQuizDetails ? (
              <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.formContainer}>
                <Text style={styles.formTitle}>JOIN QUIZ</Text>
                
                <Input
                  placeholder="Quiz Code"
                  leftIcon={<Icon name="key" type="font-awesome" size={20} color="#888" />}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setCode(digits);
                    if (digits.length === 6) handleValidateCode(digits);
                  }}
                  value={code}
                  keyboardType="numeric"
                  maxLength={6}
                  inputContainerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="#aaa"
                  containerStyle={styles.inputOuterContainer}
                  disabled={loading}
                />
                
                <Button
                  title="Find Quiz"
                  onPress={() => handleValidateCode()}
                  buttonStyle={styles.primaryButton}
                  containerStyle={styles.buttonContainer}
                  titleStyle={styles.primaryButtonTitle}
                  disabled={loading || code.length !== 6}
                  loading={loading}
                />

                <Text style={styles.helperText}>
                  Enter the 6-digit code provided by your quiz creator
                </Text>
              
                {/* Back to Login link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Want to go back? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                    <Text style={styles.signupLink}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            ) : (
              <Animatable.View animation="fadeIn" duration={600} style={styles.quizDetailsContainer}>
                <Text style={styles.quizTitle}>{quizDetails?.title || 'Quiz Details'}</Text>
                
                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Icon name="user" type="font-awesome" size={16} color="#025a5a" />
                    <Text style={styles.detailLabel}>Creator:</Text>
                    <Text style={styles.detailText}>{quizDetails?.creator_name}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Icon name="tag" type="font-awesome" size={16} color="#025a5a" />
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailText}>{quizDetails?.category || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Icon name="signal" type="font-awesome" size={16} color="#025a5a" />
                    <Text style={styles.detailLabel}>Difficulty:</Text>
                    <Text style={styles.detailText}>{quizDetails?.difficulty || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Icon name="question-circle" type="font-awesome" size={16} color="#025a5a" />
                    <Text style={styles.detailLabel}>Questions:</Text>
                    <Text style={styles.detailText}>{quizDetails?.number_of_questions || 0}</Text>
                  </View>

                  {quizDetails?.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Description:</Text>
                      <Text style={styles.descriptionText}>{quizDetails.description}</Text>
                    </View>
                  )}

                  {quizDetails?.start_at && (
                    <View style={styles.timeContainer}>
                      <Icon name="clock-o" type="font-awesome" size={16} color="#025a5a" />
                      <Text style={styles.timeLabel}>Starts:</Text>
                      <Text style={styles.timeText}>
                        {new Date(quizDetails.start_at).toLocaleString()}
                      </Text>
                    </View>
                  )}

                  {quizDetails?.expires_at && (
                    <View style={styles.timeContainer}>
                      <Icon name="hourglass-end" type="font-awesome" size={16} color="#025a5a" />
                      <Text style={styles.timeLabel}>Expires:</Text>
                      <Text style={styles.timeText}>
                        {new Date(quizDetails.expires_at).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                <Button
                  title="Start Quiz"
                  onPress={handleStartQuiz}
                  buttonStyle={styles.primaryButton}
                  containerStyle={styles.buttonContainer}
                  titleStyle={styles.primaryButtonTitle}
                  icon={{
                    name: 'play-circle',
                    type: 'font-awesome',
                    size: 20,
                    color: '#FFFFFF',
                    marginRight: 10
                  }}
                />

                <Button
                  title="Try Different Code"
                  onPress={() => {
                    setShowQuizDetails(false);
                    setQuizDetails(null);
                    setCode('');
                  }}
                  type="outline"
                  buttonStyle={styles.secondaryButton}
                  containerStyle={[styles.buttonContainer, { marginTop: 15 }]}
                  titleStyle={styles.secondaryButtonTitle}
                />
              </Animatable.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <CustomAlert visible={showAlert} {...alertConfig} onClose={() => setShowAlert(false)} />
        {prompt.visible && <CustomPrompt {...promptConfig} />}
      </SafeAreaView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    backgroundColor: '#B2DFDB',
  },
  safeArea: { 
    flex: 1, 
  },
  keyboardAvoidingView: {
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
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 18, 
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
  inputText: { 
    fontSize: 20, 
    color: '#101828',
    textAlign: 'center',
    letterSpacing: 6, 
  },
  buttonContainer: { 
    width: '100%', 
    marginBottom: 15, 
  },
  primaryButton: { 
    backgroundColor: '#025a5a', 
    borderRadius: 12, 
    height: 52, 
  },
  primaryButtonTitle: { 
    fontWeight: '600', 
    fontSize: 16, 
    color: '#FFFFFF', 
  },
  secondaryButton: { 
    borderColor: '#025a5a', 
    borderWidth: 1, 
    borderRadius: 12, 
    height: 52, 
  },
  secondaryButtonTitle: { 
    fontWeight: '600', 
    fontSize: 16, 
    color: '#025a5a', 
  },
  helperText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginVertical: 15,
  },
  signupContainer: { 
    flexDirection: 'row', 
    marginTop: 20, 
    marginBottom: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  signupText: { 
    fontSize: 14, 
    color: '#666', 
  },
  signupLink: { 
    fontSize: 14, 
    color: '#025a5a', 
    fontWeight: '600', 
    marginLeft: 5, 
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
  quizDetailsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#025a5a',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#025a5a',
    marginLeft: 10,
    width: 80,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  descriptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#025a5a',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#025a5a',
    marginLeft: 10,
    marginRight: 5,
  },
  timeText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },
});