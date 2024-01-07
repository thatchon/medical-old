import React from 'react';
import { useWindowDimensions } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import SelectRoleScreen from '../screens/SelectRoleScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import IpdScreen from '../screens/IpdScreen';
import OpdScreen from '../screens/OpdScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProcedureScreen from '../screens/ProcedureScreen';
import ReportScreen from '../screens/ReportScreen';
import AddIpdScreen from '../screens/AddScreen/AddIpdScreen';
import AddOpdScreen from '../screens/AddScreen/AddOpdScreen';
import AddActivityScreen from '../screens/AddScreen/AddActivityScreen';
import AddProcedureScreen from '../screens/AddScreen/AddProcedureScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from "react-redux";

import IpdHistoryScreen from '../screens/AddHistoryScreen/IpdHistoryScreen'
import OpdHistoryScreen from '../screens/AddHistoryScreen/OpdHistoryScreen'
import ActivityHistoryScreen from '../screens/AddHistoryScreen/ActivityHistoryScreen';
import ProcedureHistoryScreen from '../screens/AddHistoryScreen/ProcedureHistoryScreen';

import ResetPasswordScreen from '../screens/ResetPasswordScreen'
// สร้าง Stack Navigator สำหรับหน้า Login และ Home
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function MainTabNavigator() {
  const role = useSelector((state) => state.user.role);
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // กำหนดเกณฑ์สำหรับอุปกรณ์มือถือ
  
  return (
    <Tab.Navigator
    screenOptions={{
      tabBarLabelPosition: isMobile ? 'below-icon' : 'beside-icon',
      tabBarStyle: { backgroundColor: 'rgba(34,36,40,1)' },
    }}
  >
      <Tab.Screen name="หน้าหลัก" component={HomeScreen}
        options={{
          headerShown: false,
          title: 'หน้าหลัก',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={24} color={focused ? '#007BFF' : 'white'} />
          ),
        }} />

        <Tab.Screen
          name="ผู้ป่วยใน"
          component={IpdScreen}
          options={({ navigation }) => ({
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome5 name="file-medical" size={24} color={focused ? '#007BFF' : 'white'} />
            ),
            headerStyle: {
              backgroundColor: '#7274AE',
            },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerRight: () => <IpdHeaderRight navigation={navigation} />
          })}
        />

      <Tab.Screen 
        name="ผู้ป่วยนอก" 
        component={OpdScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="file-medical-alt" size={24} color={focused ? '#007BFF' : 'white'} />
          ),
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <OpdHeaderRight navigation={navigation} />
        })} />
        
      <Tab.Screen 
        name="หัตถการ" 
        component={ProcedureScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="hand-holding-medical" size={24} color={focused ? '#007BFF' : 'white'} />
          ),
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <ProcedureHeaderRight navigation={navigation} />
        })} />

      <Tab.Screen 
        name="กิจกรรม" 
        component={ActivityScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="pump-medical" size={24} color={focused ? '#007BFF' : 'white'} />
          ),
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <ActivityHeaderRight navigation={navigation} />
        })} />

      {role !== "teacher" && (
          <Tab.Screen 
              name="รายงานผล" 
              component={ReportScreen}
              options={{
                  tabBarIcon: ({ focused, color, size }) => (
                      <Ionicons name="document" size={24} color={focused ? '#007BFF' : 'white'} />
                  ),
                  headerStyle: {
                      backgroundColor: '#7274AE',
                  },
                  headerTintColor: '#fff',
                  headerTitleAlign: 'center',
                  headerTitleStyle: {
                      fontWeight: 'bold',
                  },
              }} 
          />
      )}
    </Tab.Navigator>
  );
}

function IpdHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('IpdHistory')}
    />
  );
}

function OpdHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('OpdHistory')}
    />
  );
}

function ActivityHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('ActivityHistory')}
    />
  );
}

function ProcedureHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('ProcedureHistory')}
    />
  );
}

function MyNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectRole">
        <Stack.Screen name="SelectRole" component={SelectRoleScreen} options={{ 
          headerShown: false,
          title: 'เลือกบทบาท'
          }} />

        <Stack.Screen name="Login" component={LoginScreen} options={{
          title: 'เข้าสู่ระบบ',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="Home" component={MainTabNavigator} options={{ 
          headerShown: false,
          title: 'หน้าหลัก'
          }} />

        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{
          title: 'เปลี่ยนรหัสผ่าน',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddIpd" component={AddIpdScreen} options={{
          title: 'เพิ่มข้อมูลผู้ป่วยใน',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
        <Stack.Screen name="IpdHistory" component={IpdHistoryScreen} options={{ headerShown: true }} options={{
          title: 'ประวัติผู้ป่วยใน',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddOpd" component={AddOpdScreen} options={{
          title: 'เพิ่มข้อมูลผู้ป่วยนอก',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
        <Stack.Screen name="OpdHistory" component={OpdHistoryScreen} options={{
          title: 'ประวัติผู้ป่วยนอก',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddActivity" component={AddActivityScreen} options={{
          title: 'เพิ่มข้อมูลกิจกรรม',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
        <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} options={{
          title: 'ประวัติกิจกรรม',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddProcedure" component={AddProcedureScreen} options={{
          title: 'เพิ่มข้อมูลหัตถการ',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
        <Stack.Screen name="ProcedureHistory" component={ProcedureHistoryScreen} options={{
          title: 'ประวัติหัตถการ',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default MyNavigator;