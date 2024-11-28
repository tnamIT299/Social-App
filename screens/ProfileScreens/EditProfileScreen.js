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
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker
import { updateUserProfile } from "../../server/ProfileService";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const EditProfileScreenTab = ({ route }) => {
  const { uid } = route.params;
  const [username, setUsername] = useState("Loading...");
  const [avatarUrl, setAvatarUrl] = useState("https://via.placeholder.com/150");
  const [coverUrl, setCoverUrl] = useState("https://via.placeholder.com/400x200");
  const [phone, setPhone] = useState("Loading...");
  const [job, setJob] = useState("Loading...");
  const [address, setAddress] = useState("Loading...");
  const [workplace, setWorkplace] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [coverImages, setCoverImages] = useState([]);
  const [avatarImages, setAvatarImages] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("User")
        .select("avatar, name, cover, phone, job, address, workplace")
        .eq("uid", uid)
        .single();

      if (error) {
        console.error("Error fetching user data: ", error);
      } else {
        setUsername(data.name || "Unknown User");
        setAvatarUrl(data.avatar || "https://via.placeholder.com/150");
        setCoverUrl(data.cover || "https://via.placeholder.com/400x200");
        setPhone(data.phone || "");
        setJob(data.job || "");
        setAddress(data.address || "");
        setWorkplace(data.workplace || "");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [uid]);

  const pickImage = (type) => {
    const options = [
      { text: "Chọn Thư viện", onPress: () => launchGallery(type) }, // Truyền type vào hàm launchGallery
      { text: "Chụp ảnh", onPress: () => launchCamera(type) },        // Truyền type vào hàm launchCamera
      { text: "Hủy", onPress: () => {}, style: "cancel" },
    ];
  
    Alert.alert("Chọn ảnh", "Bạn muốn chọn ảnh từ đâu?", options);
  };
  
  const launchGallery = async (type) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }
  
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      const newImage = pickerResult.assets[0].uri;
  
      if (type === "avatar") {
        // Nếu là thay đổi ảnh avatar
        setAvatarUrl(newImage); // Cập nhật URL của avatar
        setAvatarImages([...avatarImages, newImage]);
      } else if (type === "cover") {
        // Nếu là thay đổi ảnh bìa
        setCoverUrl(newImage); // Cập nhật URL của ảnh bìa
        setCoverImages([...coverImages, newImage]);
      }
    } else {
      console.log("No image selected or picker was canceled");
    }
  };
  
  const launchCamera = async (type) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera is required!");
      return;
    }
  
    let cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!cameraResult.canceled && cameraResult.assets.length > 0) {
      const newImage = cameraResult.assets[0].uri;
  
      if (type === "avatar") {
        // Nếu là thay đổi ảnh avatar
        setAvatarUrl(newImage); // Cập nhật URL của avatar
        setAvatarImages([...avatarImages, newImage]);
      } else if (type === "cover") {
        // Nếu là thay đổi ảnh bìa
        setCoverUrl(newImage); // Cập nhật URL của ảnh bìa
        setCoverImages([...coverImages, newImage]);
      }
    } else {
      console.log("No image taken or camera was canceled");
    }
  };
  

  const handleSave = async () => {
    if (!uid) {
      Alert.alert("Error", "User ID is not available.");
      return;
    }

    const profileDetails = {
      coverUri: coverImages,
      avatarUri: avatarImages,
      name: username,
      phone: phone,
      job: job,
      address: address,
      workplace: workplace,
      userId: uid,
    };

    try {
      const { error } = await updateUserProfile(profileDetails);

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
            <View style={styles.headerSection}>
              <Image source={{ uri: coverUrl }} style={styles.coverImage} />
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </View>
            <TouchableOpacity
              onPress={() => pickImage("cover")} // Gọi pickImage với type là 'cover' khi nhấn thay đổi ảnh bìa
              style={styles.changeCoverButton}
            >
              <Text style={styles.changeCoverText}>Thay đổi ảnh bìa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickImage("avatar")} // Gọi pickImage với type là 'avatar' khi nhấn thay đổi avatar
              style={styles.changeCoverButton}
            >
              <Text style={styles.changeCoverText}>Thay đổi Avatar</Text>
            </TouchableOpacity>

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
  titleText: {
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
  headerSection: {
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    borderWidth: 2,
    borderColor: "black",
  },
  coverImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "black",
  },
  changeCoverButton: {
    marginTop: 10,
    backgroundColor: "#2F95DC",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  changeCoverText: {
    color: "white",
    fontWeight: "bold",
  },
  infoContainer: {
    marginTop: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
  },
  buttonContainer: {
    marginTop: 30,
    padding: 20,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#2F95DC",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default EditProfileScreenStack;
