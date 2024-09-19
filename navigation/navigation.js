import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Splash from "../screens/Splash";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import ForgetPassword from "../screens/ForgetPassword";
import TabNavigation from "./tabNavigation";
import CreatePost from "../screens/PostScreens/CreatePost";
import PostDetailScreen from "../screens/PostScreens/PostDetailScreen";
import * as Linking from "expo-linking";
import { FriendsScreen } from "../screens/BottomTabScreens";
import { AddProductScreen, MyListProductPost,DetailProductPost } from "../screens/ProductScreens";
const Stack = createStackNavigator();

function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="TabNavigation" component={TabNavigation} />
        <Stack.Screen name="CreatePost" component={CreatePost} />
        <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        <Stack.Screen name="FriendsScreen" component={FriendsScreen} />


        {/*Product Screen*/}
        <Stack.Screen name="AddProductScreen" component={AddProductScreen} />
        <Stack.Screen name="MyListProductPost" component={MyListProductPost} />
        <Stack.Screen name="DetailProductPost" component={DetailProductPost} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;
