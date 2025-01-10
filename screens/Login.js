import { useState, React } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFonts } from "expo-font";
import Icon from "react-native-vector-icons/FontAwesome6";
import { supabase } from "../data/supabaseClient";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { saveUserData } from "../data/saveUserData";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("thinh@gmail.com");
  const [password, setPassword] = useState("thinh12345678@@");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  let [fontsLoaded] = useFonts({
    "Montserrat-Regular": require("../assets/font/Montserrat-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }
  const generateToken = () => {
    return uuidv4();
  };
  const handleLogin = async () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    const currentDevice = generateToken();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("Login Error:", error);
        setError(error.message);
      } else {
        setError("");
        const { user } = data;

        if (user) {
          const { data: userData, error: userError } = await supabase
            .from("User")
            .select("currentDevice, onlinestatus")
            .eq("uid", user.id)
            .single();

          if (userError) {
            console.error("Error fetching user data:", userError);
            setError("Có lỗi xảy ra, vui lòng thử lại.");
            return;
          }

          if (!userData.currentDevice) {
            const { error: updateError } = await supabase
              .from("User")
              .update({
               // currentDevice: currentDevice,
                onlinestatus: "online",
              })
              .eq("uid", user.id);

            if (updateError) {
              console.error("Error updating device:", updateError);
              setError("Có lỗi khi cập nhật thiết bị.");
              return;
            }
            await saveUserData(user.id);
            navigation.navigate("TabNavigation");
          } else if (userData.currentDevice !== currentDevice) {
            setError("Tài khoản đang đăng nhập ở thiết bị khác.");
            return;
          } else {
            // User is already logged in on this device, just update online status
            await supabase
              .from("User")
              .update({ onlinestatus: "online" })
              .eq("uid", user.id);
            navigation.navigate("TabNavigation");
          }
        }
      }
    } catch (error) {
      console.error("Unexpected Error:", error);
      setError("Có lỗi xảy ra, vui lòng thử lại.");
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
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              inputMode="email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Mật khẩu"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
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
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgetPassword")}
          >
            <Text style={styles.forgotPassword}>Quên mật khẩu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
            <Text style={styles.signInButtonText}>Đăng nhập</Text>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text>Chưa có tài khoản ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.signUpText}>Đăng ký</Text>
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
  icon: {
    position: "absolute",
    right: 10,
    bottom: 8,
  },
  forgotPassword: {
    color: "#888",
    marginBottom: 40,
  },
  signInButton: {
    width: "100%",
    backgroundColor: "#6672A0",
    padding: 10,
    paddingHorizontal: 100,
    alignItems: "center",
    borderRadius: 15,
    marginBottom: 20,
  },
  signInButtonText: {
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#888",
  },
  dividerText: {
    marginHorizontal: 10,
  },
  google: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});

export default Login;
