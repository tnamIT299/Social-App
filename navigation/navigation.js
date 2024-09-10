import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Splash from '../screens/Splash';
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import ForgetPassword from '../screens/ForgetPassword';
import TabNavigation from './tabNavigation';
import * as Linking from 'expo-linking';
const Stack = createStackNavigator();

function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{headerShown:false}}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="TabNavigation" component={TabNavigation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation