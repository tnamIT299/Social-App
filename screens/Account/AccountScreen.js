import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Ionicons";
import { Ionicons, FontAwesome6, MaterialIcons } from '@expo/vector-icons';

const Stack = createStackNavigator();

const AccountTab = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ScrollView>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("ChangePassword")}
        >
          <Ionicons style={styles.icon} name="shield-outline" size={24} color="#0066ff" />
          <Text style={styles.buttonText}>Thay đổi mật khẩu</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const AccountStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AccountTab"
        component={AccountTab}
        options={({ navigation }) => ({
          title: "Tài Khoản",
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

export default AccountStack;

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    top: 10,
    marginVertical: 5,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  buttonText: {
    fontSize: 18,
    color: "#333333",
  },
};
