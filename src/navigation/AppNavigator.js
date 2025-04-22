// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { Dimensions, Platform, BackHandler } from 'react-native';

// Screens (Ensure all required screens are imported)
import IndexScreen from '../screens/IndexScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen'; // Renamed from HomeScreen, now Explore/Public Quizzes
import UploadScreen from '../screens/UploadScreen';       // The actual upload UI
import ChatbotScreen from '../screens/ChatbotScreen';     // Separate Drawer item
import ProfileScreen from '../screens/ProfileScreen';
import MyQuizzesScreen from '../screens/MyQuizzesScreen';
import ReportScreen from '../screens/ReportScreen';
import AITutorScreen from '../screens/AITutorScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen'; // <-- Ensure this is imported
import JoinQuiz from '../screens/JoinQuiz'; // Added JoinQuiz screen
import QuizAttemptScreen from '../screens/QuizAttemptScreen'; // <-- Add this import

// Components
import CustomDrawerContent from '../components/CustomDrawerContent';
import AppHeader from '../components/Header';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// --- Define Theme Colors ---
const THEME = {
    primary: '#025a5a',
    primaryLight: '#E0F7FA',
    accent: '#FFD700',
    textLight: '#FFFFFF',
    textDark: '#111827',
    inactiveTint: '#4B5563',
    activeTabTint: '#025a5a',
    drawerInactiveTint: '#025a5a',
    logout: '#D32F2F',
    separator: '#E5E7EB',
    profileBg: '#A7F3D0',
    profileTextDark: '#064E3B',
    profileTextLight: '#047857',
};

// --- Stacks for Screens WITHIN Tabs ---

function DashboardStack() { // Renamed from HomeStack, represents the "Home/Explore" tab
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* The component here should be the Explore-like screen */}
            <Stack.Screen name="DashboardExplore" component={DashboardScreen} />
            {/* If navigating from Explore to attempt, it might go via Drawer -> MyQuizzesStack */}
        </Stack.Navigator>
    );
}

function MyQuizzesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MyQuizzesList" component={MyQuizzesScreen} />
            {/* Add screens navigable from MyQuizzes */}
             {/* <Stack.Screen name="ReviewQuiz" component={ReviewQuizScreen} /> */}
             {/* <Stack.Screen name="QuizAttempt" component={QuizAttemptScreen} /> */}
        </Stack.Navigator>
    );
}

function ReportsStack() { // Renamed from ReportsStackNavigator for consistency
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ReportsList" component={ReportScreen} />
            {/* FIX: Add ReportDetailScreen here */}
            <Stack.Screen
                name="ReportDetail" // Name used in navigation.navigate
                component={ReportDetailScreen}
                // Header options are handled by the Tab Navigator header prop now
            />
        </Stack.Navigator>
    );
}

function AITutorStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AITutorHome" component={AITutorScreen} />
        </Stack.Navigator>
    );
}

function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileView" component={ProfileScreen} />
        </Stack.Navigator>
    );
}

// --- Main Bottom Tab Navigator (Contains the Stacks) ---
function MainBottomTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                header: (props) => {
                    // Determine title based on focused route name
                    const routeName = props.route.name;
                    let title = "AI StudyGuru"; // Default
                    // Match tab names used below
                    if (routeName === "HomeTab") title = "Home";
                    else if (routeName === "MyQuizzesTab") title = "My Quizzes";
                    else if (routeName === "ReportsTab") title = "Reports";
                    else if (routeName === "AITutorTab") title = "AI Tutor";
                    else if (routeName === "ProfileTab") title = "My Profile";

                    return <AppHeader {...props} title={title} showDrawerToggle={true} />;
                },
                 tabBarIcon: ({ focused, color, size }) => {
                    let iconName; let iconType = 'font-awesome';
                    let finalSize = focused ? size + 1 : size;

                    // Match tab names used below
                    if (route.name === 'HomeTab') iconName = 'home';
                    else if (route.name === 'MyQuizzesTab') iconName = 'list-alt';
                    else if (route.name === 'ReportsTab') iconName = 'bar-chart';
                    else if (route.name === 'AITutorTab') iconName = 'magic';
                    else if (route.name === 'ProfileTab') iconName = 'user-circle-o';
                    else iconName = 'question-circle';

                    return <Icon name={iconName} type={iconType} size={finalSize} color={color} />;
                 },
                 tabBarActiveTintColor: THEME.activeTabTint,
                 tabBarInactiveTintColor: THEME.inactiveTint,
                 tabBarStyle: {
                    backgroundColor: '#ffffff', borderTopColor: '#eee', borderTopWidth: 0.5,
                    height: Platform.OS === 'ios' ? 85 : 65, paddingBottom: Platform.OS === 'ios' ? 30 : 5, paddingTop: 5,
                    elevation: 8, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4,
                 },
                 tabBarLabelStyle: { fontSize: 11, marginBottom: Platform.OS === 'ios' ? -15 : 3, fontWeight: '500' }
            })}
        >
            {/* Each Tab screen points to its corresponding Stack Navigator */}
            {/* Ensure these names match the route.name checks above */}
            <Tab.Screen name="HomeTab" component={DashboardStack} options={{ title: 'Home' }}/>
            <Tab.Screen name="MyQuizzesTab" component={MyQuizzesStack} options={{ title: 'My Quizzes' }}/>
            <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: 'Reports' }}/>
            <Tab.Screen name="AITutorTab" component={AITutorStack} options={{ title: 'AI Tutor' }}/>
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }}/>
        </Tab.Navigator>
    );
}


// --- Drawer Navigator (Wraps the Bottom Tabs) ---
function MainDrawerNavigator() {
    const drawerWidth = Dimensions.get('window').width * 0.70;

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false, // Headers are handled by the Stacks INSIDE the Tabs
                drawerStyle: { backgroundColor: THEME.primaryLight, width: drawerWidth, },
                drawerActiveTintColor: THEME.textLight,
                drawerActiveBackgroundColor: THEME.primary,
                drawerInactiveTintColor: THEME.drawerInactiveTint,
                drawerLabelStyle: { fontSize: 15, fontWeight: '500', marginLeft: 5, },
                drawerItemStyle: { marginVertical: 5, marginHorizontal: 12, borderRadius: 8, paddingVertical: 4, },
            }}
        >
             {/* The primary screen for the drawer IS the Bottom Tab Navigator */}
             <Drawer.Screen
                name="MainBottomTabs"
                component={MainBottomTabNavigator}
                options={{
                    // This title applies if you need a label for the entire tab section in the drawer,
                    // but often this screen isn't directly shown as a drawer item label itself.
                    title: 'Dashboard',
                     // Icon for the main tab section in the drawer (optional if it's the only main item)
                     drawerIcon: ({ color, size }) => ( <Icon name="th-large" type="font-awesome" color={color} size={size} /> ),
                }}
             />
             {/* Separate Drawer items for screens *without* bottom tabs */}
             <Drawer.Screen
                 name="UploadDrawer"
                 component={UploadScreen}
                 options={{
                    title: 'Upload Notes',
                    header: (props) => <AppHeader {...props} title="Upload Notes" showDrawerToggle={true}/>,
                    drawerIcon: ({ color, size }) => (<Icon name="upload" type="font-awesome" color={color} size={size}/>),
                 }}
             />
             <Drawer.Screen
                 name="ChatbotDrawer"
                 component={ChatbotScreen}
                 options={{
                    title: 'AI Chat',
                    header: (props) => <AppHeader {...props} title="AI Chat" showDrawerToggle={true}/>,
                    drawerIcon: ({ color, size }) => (<Icon name="comments" type="font-awesome" color={color} size={size}/>),
                 }}
             />
             {/* You could add other non-tab screens here, e.g., Settings */}

        </Drawer.Navigator>
    );
}

// --- Auth Stack Navigator ---
function AuthStackNavigator() {
    return (
        <Stack.Navigator 
            screenOptions={{ 
                headerShown: false,
                gestureEnabled: false // Disable gesture-based back
            }}
            initialRouteName="Index"
        >
            <Stack.Screen 
                name="Index" 
                component={IndexScreen}
                options={{
                    gestureEnabled: false
                }}
            />
            <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{
                    gestureEnabled: false
                }}
            />
            <Stack.Screen 
                name="Signup" 
                component={SignupScreen}
                options={{
                    gestureEnabled: false
                }}
            />
            <Stack.Screen 
                name="JoinQuiz" 
                component={JoinQuiz}
                options={{
                    gestureEnabled: false
                }}
            />
            <Stack.Screen
                name="QuizAttempt"
                component={QuizAttemptScreen}
                options={{
                    gestureEnabled: false
                }}
            />
        </Stack.Navigator>
    );
}

// --- Root Navigator ---
export default function AppNavigator({ session }) {
    return (
        <NavigationContainer>
            {session && session.user ? <MainDrawerNavigator /> : <AuthStackNavigator />}
        </NavigationContainer>
    );
}