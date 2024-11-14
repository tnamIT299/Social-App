import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const EditProfileScreenTab = ({ route }) => {
  const { uid } = route.params;
  const [username, setUsername] = useState("Loading...");
  const [avatarUrl, setAvatarUrl] = useState("https://via.placeholder.com/150");
  const [coverUrl, setCoverUrl] = useState(
    "https://via.placeholder.com/400x200"
  );
  const [phone, setPhone] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [job, setJob] = useState("Loading...");
  const [address, setAddress] = useState("Loading...");
  const [workplace, setWorkplace] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("User")
        .select("avatar, name, cover, phone, email, job, address, workplace")
        .eq("uid", uid)
        .single();

      if (error) {
        console.error("Error fetching user data: ", error);
      } else {
        setUsername(data.name || "Unknown User");
        setAvatarUrl(data.avatar || "https://via.placeholder.com/150");
        setCoverUrl(data.cover || "https://via.placeholder.com/400x200");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setJob(data.job || "");
        setAddress(data.address || "");
        setWorkplace(data.workplace || "");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [uid]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("User")
        .update({
          phone: phone,
          name: username,
          address: address,
          job: job,
          workplace: workplace,
        })
        .eq("uid", uid);

      if (error) {
        console.error("Error updating profile:", error);
        alert("Cập nhật thất bại!");
      } else {
        alert("Thông tin đã được lưu!");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Đã xảy ra lỗi khi lưu thông tin!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.infoSection}>
            <View style={styles.infoContainer}>
              <Text style={styles.titleText}>Tên:</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên"
              />

              <Text style={styles.titleText}>Điện thoại:</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, "");
                  setPhone(numericText);
                }}
                placeholder="Nhập số điện thoại"
                keyboardType="numeric"
              />

              <Text style={styles.titleText}>Địa chỉ:</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Nhập địa chỉ"
              />

              <Text style={styles.titleText}>Công việc:</Text>
              <TextInput
                style={styles.input}
                value={job}
                onChangeText={setJob}
                placeholder="Nhập công việc"
              />

              <Text style={styles.titleText}>Nơi làm việc:</Text>
              <TextInput
                style={styles.input}
                value={workplace}
                onChangeText={setWorkplace}
                placeholder="Nhập nơi làm việc"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Lưu thông tin</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const EditProfileScreenStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EditProfileScreenTab"
        component={EditProfileScreenTab}
        options={({ navigation }) => ({
          headerTitle: "Thông tin cá nhân",
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerBack: {
    marginTop: 10,
    marginBottom: 10,
  },
  titleText:{
    fontWeight: "bold",
    fontSize: 15,
  },
  info: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  infoSection: {
    padding: 20,
  },
  infoContainer: {
    alignItems: "flex-start",
  },
  buttonContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 10,
  },
  saveButton: {
    borderWidth: 0.5,
    borderColor: "black",
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#2F95DC',
  },
  saveButtonText: {
    color: "#333",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    marginBottom: 15,
  },
});

export default EditProfileScreenStack;
