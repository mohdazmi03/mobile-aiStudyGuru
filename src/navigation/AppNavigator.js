import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { Dimensions, Platform } from 'react-native';

// Screens
import IndexScreen from '../screens/IndexScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import UploadScreen from '../screens/UploadScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyQuizzesScreen from '../screens/MyQuizzesScreen';
import ReportScreen from '../screens/ReportScreen';
import AITutorScreen from '../screens/AITutorScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import JoinQuiz from '../screens/JoinQuiz';
import QuizAttemptScreen from '../screens/QuizAttemptScreen';
import WebViewScreen from '../screens/WebViewScreen';

// Components
import CustomDrawerContent from '../components/CustomDrawerContent';
import AppHeader from '../components/Header';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Theme colors
const THEME = {
  primary: '#025a5a',
  primaryLight: '#E0F7FA',
  activeTabTint: '#025a5a',
  inactiveTint: '#4B5563',
  drawerInactiveTint: '#025a5a',
  textLight: '#FFFFFF',
};

// Dashboard (Explore) stack
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardExplore" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

// My Quizzes stack
function MyQuizzesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyQuizzesList" component={MyQuizzesScreen} />
    </Stack.Navigator>
  );
}

// Reports stack
function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsList" component={ReportScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    </Stack.Navigator>
  );
}

// AI Tutor stack
function AITutorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AITutorHome" component={AITutorScreen} />
    </Stack.Navigator>
  );
}

// Profile stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileView" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Main bottom tab navigator
function MainBottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: props => {
          let title = 'AI StudyGuru';
          if (props.route.name === 'HomeTab') title = 'Home';
          if (props.route.name === 'MyQuizzesTab') title = 'My Quizzes';
          if (props.route.name === 'ReportsTab') title = 'Reports';
          if (props.route.name === 'AITutorTab') title = 'AI Tutor';
          if (props.route.name === 'ProfileTab') title = 'Profile';
          return <AppHeader {...props} title={title} showDrawerToggle />;
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab: 'home',
            MyQuizzesTab: 'list-alt',
            ReportsTab: 'bar-chart',
            AITutorTab: 'magic',
            ProfileTab: 'user-circle-o',
          };
          const iconName = icons[route.name] || 'question-circle';
          const iconSize = focused ? size + 1 : size;
          return <Icon name={iconName} type="font-awesome" size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: THEME.activeTabTint,
        tabBarInactiveTintColor: THEME.inactiveTint,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: Platform.OS === 'ios' ? -15 : 3 },
      })}
    >
      <Tab.Screen name="HomeTab" component={DashboardStack} options={{ title: 'Home' }} />
      <Tab.Screen name="MyQuizzesTab" component={MyQuizzesStack} options={{ title: 'My Quizzes' }} />
      <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: 'Reports' }} />
      <Tab.Screen name="AITutorTab" component={AITutorStack} options={{ title: 'AI Tutor' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// Main drawer navigator
function MainDrawerNavigator() {
  const drawerWidth = Dimensions.get('window').width * 0.7;

  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: THEME.primaryLight, width: drawerWidth },
        drawerActiveTintColor: THEME.textLight,
        drawerInactiveTintColor: THEME.drawerInactiveTint,
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' },
      }}
    >
      <Drawer.Screen
        name="MainBottomTabs"
        component={MainBottomTabNavigator}
        options={{ drawerIcon: ({ color, size }) => <Icon name="th-large" type="font-awesome" color={color} size={size} />, title: 'Dashboard' }}
      />
      <Drawer.Screen
        name="UploadDrawer"
        component={UploadScreen}
        options={{
          title: 'Upload Notes',
          header: props => <AppHeader {...props} title="Upload Notes" showDrawerToggle />,
          drawerIcon: ({ color, size }) => <Icon name="upload" type="font-awesome" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="ChatbotDrawer"
        component={ChatbotScreen}
        options={{
          title: 'AI Chat',
          header: props => <AppHeader {...props} title="AI Chat" showDrawerToggle />,
          drawerIcon: ({ color, size }) => <Icon name="comments" type="font-awesome" color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}

// Auth stack navigator
function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }} initialRouteName="Index">
      <Stack.Screen name="Index" component={IndexScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="JoinQuiz" component={JoinQuiz} />
      <Stack.Screen name="QuizAttempt" component={QuizAttemptScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Root navigator export
export default function AppNavigator({ session }) {
  return (
    <NavigationContainer>
      {session && session.user ? <MainDrawerNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}
