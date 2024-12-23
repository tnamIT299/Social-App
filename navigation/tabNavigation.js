import { Image } from "react-native";
import { React, useState } from "react";
import {
  HomeScreen,
  FriendsScreen,
  ReelsScreen,
  MarketplaceScreen,
  NotificationScreen,
  MenuScreen,
} from "../screens/BottomTabScreens";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import icon from "../constant/icon";
const Tab = createBottomTabNavigator();
const screenOptions = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: "white",
  tabBarInactiveTintColor: "black",
  tabBarStyle: {
    position: "absolute", // Đặt vị trí tabBar để bo tròn
    bottom: 10, // Điều chỉnh khoảng cách từ dưới
    left: 10,
    right: 10,
    borderRadius: 20, // Bo tròn góc
    backgroundColor: "#ffffff", // Màu nền của thanh tab
    height: 60, // Chiều cao của tabBar
    shadowColor: "#000", // Thêm shadow nếu muốn
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 10, // Đổ bóng cho Android
  },
  tabBarShowLabel: false,
  tabBarActiveBackgroundColor: "#33CCFF",
  tabBarInactiveBackgroundColor: "white",
  tabBarIcon: ({ focused, color, size }) => {
    let screenName = route.name;
    let iconName = "iconName";

    if (screenName == "HomeScreen") {
      iconName = icon.icon_home;
    } else if (screenName == "FriendsScreen") {
      iconName = icon.icon_friend;
    } else if (screenName == "ReelsScreen") {
      iconName = icon.icon_video;
    } else if (screenName == "MarketplaceScreen") {
      iconName = icon.icon_store;
    } else if (screenName == "NotificationScreen") {
      iconName = icon.icon_notification;
    } else if (screenName == "MenuScreen") {
      iconName = icon.icon_menu;
    }
    return (
      <Image
        source={iconName}
        style={{
          width: 25,
          height: 25,
          tintColor: focused ? "white" : "black",
        }}
      />
    );
  },
});
function TabNavigation(props) {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name={"HomeScreen"} component={HomeScreen} />
      <Tab.Screen name={"FriendsScreen"} component={FriendsScreen} />
      <Tab.Screen name={"ReelsScreen"} component={ReelsScreen} />
      <Tab.Screen name={"MarketplaceScreen"} component={MarketplaceScreen} />
      <Tab.Screen name={"NotificationScreen"} component={NotificationScreen} />
      <Tab.Screen name={"MenuScreen"} component={MenuScreen} />
    </Tab.Navigator>
  );
}

export default TabNavigation;
