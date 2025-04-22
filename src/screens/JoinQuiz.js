import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    BackHandler,
    Dimensions,
    StatusBar
} from 'react-native';
import { Input, Button, Card, Icon } from 'react-native-elements';
import { supabase } from '../lib/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../components/CustomAlert';
import CustomPrompt from '../components/CustomPrompt';
import { useDialog } from '../hooks/useDialog';
import { LinearGradient } from 'expo-linear-gradient';


export default function JoinQuiz() {
    const navigation = useNavigation();
    const route = useRoute();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [quizDetails, setQuizDetails] = useState(null);
    const [showQuizDetails, setShowQuizDetails] = useState(false);
    const inputRefs = useRef([]);
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

  // 2) Replace handleValidateCode with this version:
const handleValidateCode = async (codeToValidate = code) => {
    const trimmedCode = codeToValidate.trim();
    if (trimmedCode.length !== 6) {
      showCustomAlert({
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter a valid 6‑digit access code.',
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
      

    const renderCodeInput = () => (
        <Animatable.View animation="fadeInUp" duration={800} delay={200}>
            <Card containerStyle={styles.codeCard}>
                <Card.Title style={styles.cardTitle}>Enter Quiz Code</Card.Title>
                <Card.Divider />
                <View style={styles.codeInputContainer}>
                <Input
                    placeholder="CODE"
                    value={code}
                    keyboardType="numeric"
                    maxLength={6}
                    inputContainerStyle={styles.inputContainer}
                    inputStyle={styles.input}
                    disabled={loading}
                    leftIcon={<Icon name="key" type="font-awesome" size={20} color="#025a5a" />}
                    onChangeText={(text) => {
                        // strip non‐digits, cap at 6
                        const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                        setCode(digits);
                        // auto‐submit as soon as we have 6
                        if (digits.length === 6) {
                        handleValidateCode(digits);
                        }
                    }}
                    />
                    <Button 
                        title={loading ? 'Validating...' : 'Find Quiz'}
                        onPress={() => handleValidateCode()}
                        loading={loading}
                        disabled={loading || code.length !== 6}
                        buttonStyle={styles.findButton}
                        containerStyle={styles.buttonContainer}
                        titleStyle={styles.buttonTitle}
                        raised
                    />
                </View>
                <Text style={styles.helperText}>
                    Enter the 6-digit code provided by your quiz creator
                </Text>
            </Card>
        </Animatable.View>
    );

    const renderQuizDetails = () => (
        <Animatable.View animation="fadeIn" duration={600}>
            <Card containerStyle={styles.quizDetailsCard}>
                <LinearGradient
                    colors={['#025a5a', '#037575']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                    >
                    <Text style={styles.quizTitle}>{quizDetails?.title || 'Quiz Details'}</Text>
                    </LinearGradient>

                <View style={styles.detailsContainer}>
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
                            <Text style={styles.descriptionLabel}>Description</Text>
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

                <View style={styles.buttonGroup}>
                    <Button
                        title="Start Quiz"
                        onPress={handleStartQuiz}
                        buttonStyle={styles.startButton}
                        containerStyle={styles.startButtonContainer}
                        titleStyle={styles.startButtonTitle}
                        icon={{
                            name: 'play-circle',
                            type: 'font-awesome',
                            size: 20,
                            color: 'white',
                        }}
                        raised
                    />
                    <Button
                        title="Try Different Code"
                        onPress={() => {
                            setShowQuizDetails(false);
                            setQuizDetails(null);
                            setCode('');
                        }}
                        buttonStyle={styles.backButton}
                        containerStyle={styles.backButtonContainer}
                        titleStyle={styles.backButtonTitle}
                        type="outline"
                    />
                </View>
            </Card>
        </Animatable.View>
    );

    return (
        <LinearGradient
          colors={['#E0F2F7', '#B2DFDB', '#80CBC4']}
          style={styles.gradientBackground}
        >
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}
            >
              {/* Header */}
              <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
                  <Icon name="arrow-left" type="font-awesome" size={20} color="#025a5a" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Join Quiz</Text>
                  <Text style={styles.headerSubtitle}>Enter quiz code to get started</Text>
                </View>
              </Animatable.View>
      
              {/* Content */}
              <View style={styles.content}>
                {!showQuizDetails ? renderCodeInput() : renderQuizDetails()}
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
      
          {/* ——— Pop‑ups ——— */}
      <CustomAlert
        visible={showAlert}
        {...alertConfig}
        onClose={() => setShowAlert(false)}
      />
      {prompt.visible && <CustomPrompt {...promptConfig} />}
    </LinearGradient>
      );
      
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({

    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
      },

    gradientBackground: {
        flex: 1,
        backgroundColor: '#E0F2F7', // Fallback color instead of gradient
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        paddingBottom: 20,
    },
    backBtn: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginRight: 15,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#025a5a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    codeCard: {
        borderRadius: 15,
        padding: 20,
        marginTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    cardTitle: {
        fontSize: 20,
        color: '#025a5a',
        textAlign: 'center',
        marginBottom: 5,
    },
    codeInputContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    inputContainer: {
        borderBottomWidth: 0,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        textAlign: 'center',
        fontSize: 24,
        letterSpacing: 8,
        color: '#025a5a',
    },
    findButton: {
        backgroundColor: '#025a5a',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 30,
    },
    buttonContainer: {
        width: '80%',
        marginTop: 20,
    },
    buttonTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    helperText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
        marginTop: 15,
    },
    quizDetailsCard: {
        borderRadius: 15,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    headerGradient: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#025a5a', // Replaced gradient with solid color
    },
    quizTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    detailsContainer: {
        padding: 20,
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
        marginTop: 15,
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
        marginTop: 15,
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
    buttonGroup: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    startButton: {
        backgroundColor: '#025a5a',
        borderRadius: 25,
        paddingVertical: 12,
    },
    startButtonContainer: {
        marginBottom: 10,
    },
    startButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        borderColor: '#025a5a',
        borderRadius: 25,
        paddingVertical: 12,
    },
    backButtonContainer: {
        marginTop: 10,
    },
    backButtonTitle: {
        color: '#025a5a',
    },
    // Kept overlay styles in case you need them later
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    androidOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
});