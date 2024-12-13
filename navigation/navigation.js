import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Splash from "../screens/Splash";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import ForgetPassword from "../screens/ForgetPassword";
import TabNavigation from "./tabNavigation";
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
import { Message,MessageSummary,SettingChat} from "../screens/Chat";
import {AddGroup,GroupList,GroupMessage,GroupInfor,EditGroup,MemberGroup, AddMember } from "../screens/Chat/ChatGroup";
import { Account,ChangePassword } from "../screens/Account";
import { CreateReel } from "../screens/Reel";

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

        {/*Account Screen*/}
        <Stack.Screen name="Account" component={Account} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />

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
        <Stack.Screen name="MessageSummary" component={MessageSummary} />
        <Stack.Screen name="SettingChat" component={SettingChat} />

         {/*Reel Screen*/}
         <Stack.Screen name="CreateReel" component={CreateReel} />

        <Stack.Screen name="AddGroup" component={AddGroup} />
        <Stack.Screen name="GroupList" component={GroupList} />
        <Stack.Screen name="GroupMessage" component={GroupMessage} />
        <Stack.Screen name="GroupInfor" component={GroupInfor} />
        <Stack.Screen name="EditGroup" component={EditGroup} />
        <Stack.Screen name="MemberGroup" component={MemberGroup} />
        <Stack.Screen name="AddMember" component={AddMember} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;
