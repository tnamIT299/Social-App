import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Splash from "../screens/Splash";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import ForgetPassword from "../screens/ForgetPassword";
import TabNavigation from "./tabNavigation";
import * as Linking from "expo-linking";
import { FriendsScreen } from "../screens/BottomTabScreens";
import { CreatePost, EditPost, PostDetailScreen } from "../screens/PostScreens";
import { UserSearchScreen, PostSearchScreen } from "../screens/SearchScreens";
import { Profile, EditProfileScreen } from "../screens/ProfileScreens";
import {
  AddProductScreen,
  MyListProductPost,
  DetailProductPost,
  EditProductPostScreen,
} from "../screens/ProductScreens";
import { Message } from "../screens/Chat";
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

        {/*Post Screen*/}
        <Stack.Screen name="CreatePost" component={CreatePost} />
        <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
        <Stack.Screen name="EditPost" component={EditPost} />

        {/*Search Screen*/}
        <Stack.Screen name="UserSearchScreen" component={UserSearchScreen} />
        <Stack.Screen name="PostSearchScreen" component={PostSearchScreen} />

        {/*Friend Screen*/}
        <Stack.Screen name="FriendsScreen" component={FriendsScreen} />

        {/*Product Screen*/}
        <Stack.Screen name="AddProductScreen" component={AddProductScreen} />
        <Stack.Screen name="MyListProductPost" component={MyListProductPost} />
        <Stack.Screen name="DetailProductPost" component={DetailProductPost} />
        <Stack.Screen
          name="EditProductPostScreen"
          component={EditProductPostScreen}
        />
        {/*Profile Screen*/}
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />

        {/*Chat Screen*/}
        <Stack.Screen name="Message" component={Message} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;
