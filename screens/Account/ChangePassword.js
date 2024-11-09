import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../data/supabaseClient";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Ionicons";
const Stack = createStackNavigator();

const ChangePasswordTab = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [NewpasswordVisible, setNewPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);

  const handleChangePassword = async () => {
    if(!newPassword || !confirmPassword) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu không khớp");
      return;
    }
  
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
  
    if (updateError) {
      Alert.alert("Error", updateError.message);
    } else {
      Alert.alert("Thông báo", "Thay đổi mật khẩu thành công!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };
  

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 0.8 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Mật khẩu mới"
            onChangeText={setNewPassword}
            value={newPassword}
            secureTextEntry={!NewpasswordVisible}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setNewPasswordVisible(!NewpasswordVisible)}
          >
            <Icon
              name={NewpasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Xác nhận mật khẩu mới"
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            secureTextEntry={!passwordConfirmVisible}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setPasswordConfirmVisible(!passwordConfirmVisible)}
          >
            <Icon
              name={passwordConfirmVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.changPassButton} onPress={handleChangePassword}>
          <Text style={styles.changPassButtonText}>Thay đổi mật khẩu</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const ChangePasswordStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChangePasswordTab"
        component={ChangePasswordTab}
        options={({ navigation }) => ({
          title: "Thay đổi mật khẩu",
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

export default ChangePasswordStack;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 40,
    fontSize: 16,
    borderColor: "#000",
    borderBottomWidth: 1,
    marginBottom: 40,
    paddingLeft: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 15,
  },
  icon: {
    position: "absolute",
    right: 10,
    bottom: 8,
  },
  changPassButton: {
    width: "100%",
    backgroundColor: "#6672A0",
    padding: 10,
    alignItems: "center",
    borderRadius: 15,
    marginBottom: 20,
  },
  changPassButtonText: {
    color: "#FFF",
    fontSize: 18,
  },
});