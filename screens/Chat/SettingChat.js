import { View, Text } from 'react-native'
import React from 'react'
import Icon from "react-native-vector-icons/Ionicons";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const SettingChatTab = () => {
  return (
    <View>

    </View>
  )
};

const SettingChatStack = ({ navigation }) => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="SettingChatTab"
          component={SettingChatTab}
          options={({ navigation }) => ({
            headerTitle: "Tuỳ chỉnh",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: "#2F95DC" },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: { fontWeight: "bold" },
            headerLeft: () => (
              <Icon
                name="chevron-back-outline"
                size={20}
                onPress={() => navigation.goBack()}
                style={{ color: "#FFFFFF", marginLeft: 20 }}
              ></Icon>
            ),
          })}
        />
      </Stack.Navigator>
    );
  };

export default SettingChatStack