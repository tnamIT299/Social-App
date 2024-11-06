import { useState, React } from "react";
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
import { useFonts } from "expo-font";
import Icon from "react-native-vector-icons/FontAwesome6";
import { supabase } from "../data/supabaseClient";

const SignUp = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);

  let [fontsLoaded] = useFonts({
    "Montserrat-Regular": require("../assets/font/Montserrat-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  const handleSignup = async () => {
    if (!name || !email || !password || !ConfirmPassword) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    // Regular expression to validate email format
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    if (password !== ConfirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu không khớp");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) {
          setError(userError.message);
        } else {
          const uid = userData?.user?.id;
          console.log("UID:", uid);
          const { error: insertError } = await supabase
            .from("User")
            .insert([{ uid, name, email }]);

          if (insertError) {
            setError(insertError.message);
          } else {
            setError("");
            alert("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
          }
        }
      }
    } catch (error) {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/background/appbackground19.webp")}
      style={styles.background}
    >
      <KeyboardAvoidingView
        style={{ flex: 0.8 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >
        <View style={styles.container}>
          <Text style={styles.title}>WELCOME TO LOOPY</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Biệt danh"
              value={name}
              onChangeText={setName}
              style={styles.input}
              inputMode="text"
            />
          </View>

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
              value={password}
              onChangeText={setPassword}
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
              placeholder="Xác nhận mật khẩu"
              onChangeText={setConfirmPassword}
              secureTextEntry={!passwordConfirmVisible}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setPasswordConfirmVisible(!passwordConfirmVisible)}
            >
              <Icon
                name={passwordConfirmVisible ? "eye-slash" : "eye"}
                size={20}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.signInButton} onPress={handleSignup}>
            <Text style={styles.signInButtonText}>Đăng ký</Text>
          </TouchableOpacity>

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
    fontSize: 25,
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
    marginBottom: 30,
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

export default SignUp;