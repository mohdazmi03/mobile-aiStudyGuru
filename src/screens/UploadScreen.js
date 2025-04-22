// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text, // Ensure Text is imported
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    SafeAreaView // Import from react-native-safe-area-context at the bottom if preferred, or keep here
} from 'react-native';
import { Button, Icon, Input } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

// --- Constants ---
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE_MB = 30;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UploadScreen() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // --- State Hooks ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileType, setFileType] = useState('');
    const [mode, setMode] = useState("basic");
    const [difficulty, setDifficulty] = useState("medium");
    const [quizType, setQuizType] = useState("mcq");
    const [numQuestions, setNumQuestions] = useState("10");
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Fetch User and Profile ---
    useEffect(() => {
        let isMounted = true;
        setLoadingProfile(true);
        const fetchUserData = async () => {
            try {
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
                if (!isMounted) return; // Check before proceeding
                if (authError) throw new Error("Authentication session error.");
                if (!authUser) {
                    console.log("No authenticated user found in Dashboard.");
                    // Rely on AppNavigator/App.js state changes for redirection
                    setLoadingProfile(false);
                    return;
                }
                setUser(authUser);

                console.log(`Dashboard: Fetching profile for ${authUser.email}`);
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, role, email_verified')
                    .eq('email', authUser.email)
                    .single();

                if (!isMounted) return; // Check again before state updates
                if (profileError) {
                    if (profileError.code === 'PGRST116') throw new Error("User profile not found.");
                    throw new Error(profileError.message || 'Failed to fetch profile.');
                }
                if (!profileData) throw new Error("User profile data missing.");

                console.log("Dashboard: Profile data fetched:", profileData);
                if (!profileData.email_verified) {
                    console.warn("Dashboard: User email not verified.");
                    Alert.alert("Email Not Verified","Verify your email to continue.",
                        [{ text: "Logout", onPress: handleLogout }]
                    );
                    setLoadingProfile(false);
                    return;
                }
                setUserProfile(profileData);

            } catch (error) {
                console.error("Error in fetchUserData (Dashboard):", error);
                if (isMounted) {
                    Alert.alert('Error Loading Profile', error.message || 'Could not load data.',
                        [{ text: 'Logout', onPress: handleLogout }] // Allow logout even on error
                    );
                }
            } finally {
                if (isMounted) setLoadingProfile(false);
            }
        };
        fetchUserData();
        return () => { isMounted = false; console.log("DashboardScreen unmounted."); };
    }, []);

    // --- Effect to Adjust Difficulty/Type based on Mode ---
    useEffect(() => {
        if (mode === "advance") {
            setDifficulty("lower-order");
            if (["mid-level", "learning-outcomes"].includes("lower-order")) setQuizType("mcq");
        } else { setDifficulty("medium"); }
    }, [mode]);

    // --- Logout Handler ---
    const handleLogout = async () => {
        // Simplified - actual logout happens via Drawer now
         console.log("Logout requested from Dashboard (likely error state)");
         await supabase.auth.signOut().catch(console.error); // Attempt signout
         // App.js listener handles navigation
    };

    // --- File Picking Handler ---
    const handlePickDocument = async () => {
        if (isGenerating) return; // Prevent picking during generation
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
                copyToCacheDirectory: true,
            });
            if (result.type === 'cancel' || !result.assets || result.assets.length === 0) return;
            const pickedFile = result.assets[0];
            const fileName = pickedFile.name;
            const fileSize = pickedFile.size;
            if (!fileName) { Alert.alert("Error", "Could not get file name."); return; }
            const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();
            if (!fileSize || fileSize > MAX_FILE_SIZE_BYTES) { Alert.alert('File Too Large', `Max size: ${MAX_FILE_SIZE_MB} MB.`); return; }
            if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) { Alert.alert('Invalid File Type', `Supports: ${SUPPORTED_EXTENSIONS.join(', ')}`); return; }
            let determinedType = '';
            if (fileExtension === '.pdf') determinedType = 'pdf';
            else if (fileExtension === '.docx') determinedType = 'docx';
            else if (fileExtension === '.txt') determinedType = 'txt';
            if (determinedType) { setSelectedFile(pickedFile); setFileType(determinedType); }
            else { Alert.alert('Error', 'Cannot determine file type.'); }
        } catch (error) { Alert.alert('Error', 'Could not open document picker.'); }
    };

     // --- File Removal ---
     const handleRemoveFile = () => { setSelectedFile(null); setFileType(''); };

    // --- Text Extraction (Simulated) ---
    const extractTextFromFileMobile = async (fileAsset, type) => { /* ... keep existing simulation ... */
         return new Promise((resolve) => {
             console.log(`[Simulated Extraction] From ${fileAsset.name} (${type})...`);
             setTimeout(() => {
                 const placeholderText = `Simulated text from ${type} file: ${fileAsset.name}. Mode: ${mode}, Difficulty: ${difficulty}, Questions: ${numQuestions}. Lorem ipsum...`;
                 resolve(placeholderText);
             }, 1000);
        });
    };

    // --- Quiz Generation (Simulated) ---
    const generateQuizMobile = async (text) => { /* ... keep existing simulation ... */
        setIsGenerating(true);
        Alert.alert("Generating Quiz", "Processing... (Simulated)");
        try {
            console.log("[Simulated Generation] API Call...");
            console.log("[Simulated Generation] Settings:", { mode, difficulty, quizType, numQuestions });
            await new Promise(resolve => setTimeout(resolve, 2500));
            console.log("[Simulated Generation] Success.");
            Alert.alert("Quiz Generated (Simulated)", "Quiz saved!",
                [{ text: "OK", onPress: () => console.log("Navigate to My Quizzes") }]
            );
             handleRemoveFile();
        } catch (error) { Alert.alert("Generation Failed", error.message); }
        finally { setIsGenerating(false); }
    };

    // --- Trigger Quiz Generation Process ---
    const handleGenerateQuizPress = async () => { /* ... keep existing simulation trigger ... */
        if (!selectedFile || !fileType || isGenerating) return;
        setIsGenerating(true); // Show loading early
        try {
            const extractedText = await extractTextFromFileMobile(selectedFile, fileType);
            if (!extractedText) throw new Error("Text extraction failed (simulated).");
            await generateQuizMobile(extractedText);
        } catch (error) { Alert.alert('Error', error.message); setIsGenerating(false); }
    };


    // --- Render Logic ---
    if (loadingProfile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#025a5a" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    if (!userProfile) {
         return (
            // FIX: Wrap text in <Text> component
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Could not load profile or email verification is pending.</Text>
                {/* Removed Logout button here as it's in the drawer */}
            </View>
         );
    }

    // --- Main Content Render ---
    return (
        // Use SafeAreaView from react-native-safe-area-context for edge handling
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    {/* FIX: Wrap text in <Text> component */}
                    <Text style={styles.welcomeHeading}>
                        Welcome, {userProfile.full_name || 'Student'}!
                    </Text>
                    {/* FIX: Wrap text in <Text> component */}
                    <Text style={styles.motivationalQuote}>
                        Turn your notes into knowledge. Let's start learning!
                    </Text>
                </View>

                {/* Upload and Options Card */}
                <View style={styles.card}>
                    {/* Mode Toggle */}
                    <View style={styles.modeToggleContainer}>
                        <TouchableOpacity
                            style={[styles.modeButton, mode === 'basic' && styles.modeButtonActive]}
                            onPress={() => setMode('basic')} disabled={isGenerating}>
                            {/* FIX: Wrap text in <Text> component */}
                            <Text style={[styles.modeButtonText, mode === 'basic' && styles.modeButtonTextActive]}>Basic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeButton, mode === 'advance' && styles.modeButtonActive]}
                            onPress={() => setMode('advance')} disabled={isGenerating}>
                             {/* FIX: Wrap text in <Text> component */}
                            <Text style={[styles.modeButtonText, mode === 'advance' && styles.modeButtonTextActive]}>Advanced</Text>
                        </TouchableOpacity>
                    </View>

                    {/* FIX: Wrap text in <Text> component */}
                    <Text style={styles.cardTitle}>Upload Your Notes</Text>
                    {/* FIX: Wrap text in <Text> component */}
                    <Text style={styles.description}>Generate quizzes from PDF, DOCX, or TXT files.</Text>
                    {/* FIX: Wrap text in <Text> component - use nested Text for bold */}
                    <Text style={styles.supportedTypes}>
                        Max file size: <Text style={{fontWeight: 'bold'}}>{MAX_FILE_SIZE_MB}MB</Text>
                    </Text>

                    {/* File Input Area */}
                    <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument} disabled={isGenerating}>
                        {selectedFile ? (
                            <View style={styles.filePreviewContainer}>
                                <View style={styles.fileInfoRow}>
                                    <Icon name={ fileType === 'pdf' ? 'file-pdf-o' : fileType === 'docx' ? 'file-word-o' : fileType === 'txt' ? 'file-text-o' : 'file-o' } type="font-awesome" size={24} color="#333" />
                                     {/* FIX: Wrap text in <Text> component */}
                                    <Text style={styles.fileNameDisplay} numberOfLines={1} ellipsizeMode="middle">
                                        {selectedFile.name}
                                    </Text>
                                </View>
                                <Button icon={<Icon name="times" type="font-awesome" size={15} color="#FFF" />} onPress={handleRemoveFile} buttonStyle={styles.removeButton} disabled={isGenerating} />
                            </View>
                        ) : (
                            <View style={styles.uploadMessageContainer}>
                                <Icon name="upload" type="font-awesome" size={30} color="#025a5a" />
                                {/* FIX: Wrap text in <Text> component */}
                                <Text style={styles.uploadText}>Tap to Select File</Text>
                                 {/* FIX: Wrap text in <Text> component */}
                                <Text style={styles.uploadSubText}>Supports: {SUPPORTED_EXTENSIONS.join(', ')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Quiz Options */}
                    <View style={styles.optionsContainer}>
                        {/* Number of Questions */}
                        <View style={styles.optionRow}>
                             {/* FIX: Wrap text in <Text> component */}
                            <Text style={styles.optionLabel}>Questions:</Text>
                            <Input
                                keyboardType="numeric" value={numQuestions}
                                onChangeText={(text) => setNumQuestions(text.replace(/[^0-9]/g, ''))}
                                onBlur={() => { let val = parseInt(numQuestions, 10); if (isNaN(val) || val < 5) val = 5; if (val > 30) val = 30; setNumQuestions(String(val)); }}
                                containerStyle={styles.optionInputContainer} inputStyle={styles.optionInput}
                                inputContainerStyle={styles.optionInputInnerContainer} disabled={isGenerating} maxLength={2}
                            />
                        </View>

                        {/* Difficulty Picker */}
                        <View style={styles.optionRow}>
                             {/* FIX: Wrap text in <Text> component */}
                            <Text style={styles.optionLabel}>Difficulty:</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker selectedValue={difficulty} onValueChange={(itemValue) => { setDifficulty(itemValue); if (mode === 'advance' && ["mid-level", "learning-outcomes"].includes(itemValue)) setQuizType("mcq"); }} style={styles.picker} enabled={!isGenerating}>
                                    {mode === "basic" ? (
                                        [ <Picker.Item key="easy" label="Easy" value="easy" />, <Picker.Item key="medium" label="Medium" value="medium" />, <Picker.Item key="hard" label="Hard" value="hard" /> ]
                                    ) : (
                                        [ <Picker.Item key="lower" label="Recall & Understand" value="lower-order" />, <Picker.Item key="mid" label="Apply & Analyze" value="mid-level" />, <Picker.Item key="lo" label="Learning Outcomes" value="learning-outcomes" /> ]
                                    )}
                                </Picker>
                           </View>
                        </View>

                        {/* Quiz Type Picker */}
                        <View style={styles.optionRow}>
                             {/* FIX: Wrap text in <Text> component */}
                            <Text style={styles.optionLabel}>Type:</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker selectedValue={quizType} onValueChange={setQuizType} style={styles.picker} enabled={!isGenerating && !(mode === "advance" && ["mid-level", "learning-outcomes"].includes(difficulty))}>
                                    <Picker.Item label="MCQ" value="mcq" />
                                    <Picker.Item label="True/False" value="truefalse" />
                                </Picker>
                            </View>
                            {mode === "advance" && ["mid-level", "learning-outcomes"].includes(difficulty) && (
                                  /* FIX: Wrap text in <Text> component */
                                  <Text style={styles.disabledHint}>(MCQ Only)</Text>
                            )}
                        </View>
                    </View>

                    {/* Generate Button */}
                    <Button
                        title="Generate Quiz ✨" onPress={handleGenerateQuizPress}
                        buttonStyle={styles.generateButton} titleStyle={styles.generateButtonText}
                        disabled={!selectedFile || isGenerating} loading={isGenerating}
                        loadingProps={{ color: '#FFF' }}
                    />
                </View>
                 {/* Removed Logout Button as it's in the drawer */}
            </ScrollView>
        </SafeAreaView>
    );
}


// --- Styles ---
// Using SafeAreaView from react-native-safe-area-context below
// If you keep the import at the top from 'react-native', remove this one.


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f4f4', },
    container: { flexGrow: 1, padding: 15, alignItems: 'center', },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f4', },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555', },
    errorText: { color: 'red', textAlign: 'center', marginBottom: 15, fontSize: 16 }, // Made error text slightly larger
    welcomeSection: { width: '100%', marginBottom: 20, paddingHorizontal: 10, },
    welcomeHeading: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#333', },
    motivationalQuote: { fontSize: 16, textAlign: 'center', color: '#555', fontStyle: 'italic', },
    card: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, width: '100%', maxWidth: 500, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, },
    cardTitle: { fontSize: 20, fontWeight: '600', marginBottom: 5, textAlign: 'center', color: '#333', },
    description: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 5, },
    supportedTypes: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 15, },
    modeToggleContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#025a5a', borderRadius: 20, overflow: 'hidden', marginBottom: 20, alignSelf: 'center', },
    modeButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', },
    modeButtonActive: { backgroundColor: '#025a5a', },
    modeButtonText: { color: '#025a5a', fontWeight: '600', },
    modeButtonTextActive: { color: '#FFF', },
    uploadArea: { borderWidth: 2, borderColor: '#025a5a', borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 130, marginBottom: 20, backgroundColor: '#f8f9fa', },
    filePreviewContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', },
    fileInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10, },
    fileNameDisplay: { marginLeft: 10, fontSize: 14, color: '#333', flexShrink: 1, },
    removeButton: { backgroundColor: '#ff4757', borderRadius: 15, padding: 5, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', },
    uploadMessageContainer: { alignItems: 'center', },
    uploadText: { marginTop: 10, fontSize: 16, fontWeight: '500', color: '#025a5a', },
    uploadSubText: { fontSize: 12, color: '#666', marginTop: 5, },
    optionsContainer: { marginBottom: 20, width: '100%', },
    optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Platform.OS === 'ios' ? 15 : 10, // Unified spacing
         paddingHorizontal: 5, },
    optionLabel: { fontSize: 15, fontWeight: '500', color: '#444', marginRight: 10, minWidth: 80, },
    optionInputContainer: { width: '35%', height: 40, },
    optionInputInnerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, height: '100%', paddingHorizontal: 5, backgroundColor: '#fff', },
    optionInput: { fontSize: 14, textAlign: 'center', },
    pickerWrapper: { height: 45, width: '60%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, justifyContent: 'center', overflow: 'hidden', backgroundColor: '#FFF', },
    picker: { width: '100%', height: Platform.OS === 'ios' ? undefined : '100%', }, // iOS needs undefined height for wrapper to control it
    disabledHint: { fontSize: 11, color: '#888', marginLeft: 5, fontStyle: 'italic', flexShrink: 1, textAlign: 'right' }, // Allow hint to shrink
    generateButton: { backgroundColor: '#025a5a', borderRadius: 10, paddingVertical: 12, },
    generateButtonText: { fontWeight: 'bold', fontSize: 16, color: '#FFF' }, // Ensure text color is white
    // Removed logoutButton styles as it's no longer here
});