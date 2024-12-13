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
import { supabase } from "../../../data/supabaseClient";
import { updateGroupInfor } from "../../../server/GroupService";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const EditGroupTab = ({ route }) => {
  const [groupname, setGroupname] = useState("Loading...");
  const { groupIcon, groupName, groupId } = route.params;
  const [selectedImages, setSelectedImages] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchGroupName = async () => {
      try {
        const { data, error } = await supabase
          .from("Group")
          .select("grouptitle")
          .eq("groupid", groupId)
          .single(); // Lấy một dòng duy nhất
  
        if (error) {
          console.error("Error fetching group name:", error);
          Alert.alert("Lỗi", "Không thể tải tên nhóm.");
          return;
        }
  
        if (data && data.grouptitle) {
          setGroupname(data.grouptitle); // Cập nhật tên nhóm vào state
        } else {
          console.error("Group title not found in data:", data);
          Alert.alert("Lỗi", "Tên nhóm không tồn tại.");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        Alert.alert("Lỗi", "Đã xảy ra lỗi không mong muốn.");
      }
    };
  
    fetchGroupName();
  }, [groupId]);
  

  const pickImage = async () => {
    const options = [
      { text: "Chọn Thư viện", onPress: () => launchGallery() },
      { text: "Chụp ảnh", onPress: () => launchCamera() },
      { text: "Hủy", onPress: () => {}, style: "cancel" },
    ];

    Alert.alert("Chọn ảnh", "Bạn muốn chọn ảnh từ đâu?", options);
  };

  const launchGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      // Cập nhật ảnh được chọn (chỉ giữ 1 ảnh)
      setSelectedImages([pickerResult.assets[0].uri]);
    } else {
      console.log("No image selected or picker was canceled");
    }
  };

  const launchCamera = async () => {
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
      // Cập nhật ảnh được chọn (chỉ giữ 1 ảnh)
      setSelectedImages([cameraResult.assets[0].uri]);
    } else {
      console.log("No image taken or camera was canceled");
    }
  };

  const handleSave = async () => {
    const updatedDetails = {
        title: groupname, // Giá trị groupname trong state
        imageUris: selectedImages, // URI ảnh đã chọn
      };
    
      const result = await updateGroupInfor(groupId, updatedDetails);
    
      if (result.success) {
        Alert.alert("Thành công", "Thông tin nhóm đã được cập nhật.");
      } else {
        Alert.alert("Thất bại", result.message || "Có lỗi xảy ra khi cập nhật.");
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
              {/* Hiển thị ảnh avatar từ trạng thái selectedImages hoặc groupIcon */}
              <Image
                source={{ uri: selectedImages[0] || groupIcon }}
                style={styles.avatar}
              />
            </View>
            <TouchableOpacity
              style={styles.changeCoverButton}
              onPress={pickImage}
            >
              <Text style={styles.changeCoverText}>Thay đổi ảnh nhóm</Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.titleText}>Tên nhóm</Text>
              <TextInput
                style={styles.input}
                value={groupname} // Hiển thị tên cũ của nhóm
                placeholder="Nhập tên"
                onChangeText={setGroupname} // Cập nhật state groupname
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
const EditGroupStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EditGroupTab"
        component={EditGroupTab}
        options={({ navigation }) => ({
          headerTitle: "Chỉnh sửa nhóm",
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
    marginTop: 30,
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
    marginTop: 10,
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

export default EditGroupStack;
