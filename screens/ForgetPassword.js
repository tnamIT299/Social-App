import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome6";
import { useFonts } from "expo-font";
import { supabase } from "../data/supabaseClient";
import { sendotp, confirmotp } from "../mail/OtpConfig";

const ForgetPassword = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmNewPasswordVisible, setConfirmNewPasswordVisible] =
    useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [otp, setOtp] = useState(false);

  let [fontsLoaded] = useFonts({
    "Montserrat-Regular": require("../assets/font/Montserrat-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  const handleSendOtp = () => {
    sendotp(email, setIsCodeSent);
  };

  const handleConfirmOtp = () => {
    confirmotp(email, recoveryCode, setOtp);
  };

  const changePass = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin mật khẩu mới.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Thông báo", "Mật khẩu không khớp.");
      return;
    }
    const { user, error_1 } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error_1) {
      Alert.alert("Error", error_1.message);
    } else {
      Alert.alert("Thông báo", "Khôi phục mật khẩu thành công!");
      setEmail("");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      navigation.navigate("Login");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/background/appbackground19.webp")}
      style={styles.background}
    >
      <KeyboardAvoidingView
        style={{ flex: 0.7 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >
        <View style={styles.container}>
          <Text style={styles.title}>WELCOME TO LOOPY</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Email"
              inputMode="email"
              style={styles.input}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {isCodeSent ? (
            <>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Mã khôi phục"
                  value={recoveryCode}
                  onChangeText={setRecoveryCode}
                  style={styles.input}
                />
              </View>

              {otp === true ? (
                <View style={{ alignItems: "center", width: "100%" }}>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!passwordVisible}
                      style={styles.input}
                    />
                    <TouchableOpacity
                      onPress={() => setPasswordVisible(!passwordVisible)}
                    >
                      <Icon
                        name={passwordVisible ? "eye-slash" : "eye"}
                        size={20}
                        style={styles.icon}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Xác thực mật khẩu mới"
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      secureTextEntry={!confirmNewPasswordVisible}
                      style={styles.input}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setConfirmNewPasswordVisible(!confirmNewPasswordVisible)
                      }
                    >
                      <Icon
                        name={confirmNewPasswordVisible ? "eye-slash" : "eye"}
                        size={20}
                        style={styles.icon}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => changePass()}
                  >
                    <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {otp === true ? null : (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleConfirmOtp}
                >
                  <Text style={styles.submitButtonText}>Khôi Phục</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSendOtp}
            >
              <Text style={styles.submitButtonText}>Gửi mã khôi phục</Text>
            </TouchableOpacity>
          )}

          <View style={styles.signUpContainer}>
            <Text>Đã có tài khoản ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.signUpText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Montserrat-Regular",
    marginBottom: 40,
    color: "#000",
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
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#6672A0",
    padding: 10,
    alignItems: "center",
    borderRadius: 15,
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 18,
  },
  signUpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  signUpText: {
    color: "red",
    marginLeft: 5,
  },
  icon: {
    position: "absolute",
    right: 10,
    bottom: 8,
  },
});

export default ForgetPassword;