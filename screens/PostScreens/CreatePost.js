import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import { createPost } from "../../server/PostService";
import { supabase } from "../../data/supabaseClient";
import Icon from "react-native-vector-icons/FontAwesome";

const Stack = createStackNavigator();

const CreatePostTab = () => {
  const navigation = useNavigation();
  const [postText, setPostText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]); // Chuyển từ 1 ảnh sang mảng ảnh
  const [userId, setUserId] = useState(null); // Lưu trữ user ID
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const { user } = data;
        if (user) {
          setUserId(user.id);

          // Fetch user details
          const { data: userDetails, error: userError } = await supabase
            .from("User") // Adjust table name if different
            .select("name, avatar")
            .eq("uid", user.id)
            .single();

          if (userError) throw userError;

          if (userDetails) {
            setUserName(userDetails.name || ""); // Ensure it's a string
            setUserAvatar(userDetails.avatar || ""); // Ensure it's a string
          }
        } else {
          Alert.alert("Error", "User not found.");
        }
      } catch (error) {
        console.error("Error fetching user info:", error.message);
        Alert.alert("Error", "Fetching user info failed: ${error.message}");
      }
    };

    fetchUserInfo();
  }, []);

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
      // Thêm ảnh mới vào mảng selectedImages
      setSelectedImages([...selectedImages, pickerResult.assets[0].uri]);
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
      // Thêm ảnh mới vào mảng selectedImages
      setSelectedImages([...selectedImages, cameraResult.assets[0].uri]);
    } else {
      console.log("No image taken or camera was canceled");
    }
  };

  const removeImage = (uri) => {
    // Hàm để xóa ảnh khỏi danh sách selectedImages
    const filteredImages = selectedImages.filter(
      (imageUri) => imageUri !== uri
    );
    setSelectedImages(filteredImages);
  };

  const removeAllImages = () => {
    setSelectedImages([]); // Làm trống danh sách ảnh
  };

  const handlePost = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is not available.");
      return;
    }

    const postDetails = {
      title: postText,
      desc: postText,
      imageUris: selectedImages, // Gửi mảng URI ảnh đã chọn
      userId: userId, // Sử dụng userId
    };

    try {
      const success = await createPost(postDetails);

      if (success) {
        Alert.alert("Success", "Post created successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Error creating post.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Unexpected error when creating post: ${error.message}`
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Hiển thị thông tin người dùng */}
      {userName ? (
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: userAvatar || "https://via.placeholder.com/150" }} // Hiển thị ảnh đại diện người dùng
            style={styles.avatar}
          />
          <Text style={styles.userName}>{userName}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.postInput}
        placeholder="Bạn đang nghĩ gì?"
        value={postText}
        onChangeText={setPostText}
      />

      <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
        <Text style={styles.imagePickerText}>Chọn ảnh</Text>
      </TouchableOpacity>

      <View style={styles.imagePreviewContainer}>
        {selectedImages.length === 1 ? (
          // Khi chỉ có một ảnh
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: selectedImages[0] }}
              style={styles.selectedImage}
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeImage(selectedImages[0])} // Xóa ảnh duy nhất
            >
              <Text style={styles.deleteButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : selectedImages.length > 1 ? (
          // Khi có nhiều ảnh, hiển thị nút xóa và sẽ xóa toàn bộ ảnh khi người dùng nhấn xóa
          <View style={styles.multiImageContainer}>
            {selectedImages.map((imageUri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.multiSelectedImage}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeAllImages()} // Xóa tất cả ảnh khi người dùng nhấn
                >
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          // Khi không có ảnh nào được chọn
          <Text style={styles.noImageText}>No image selected</Text>
        )}
      </View>

      <TouchableOpacity onPress={handlePost} style={styles.postButton}>
        <Text style={styles.postButtonText}>Đăng</Text>
      </TouchableOpacity>
    </View>
  );
};

const CreatePostStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CreatePostTab"
        component={CreatePostTab}
        options={({ navigation }) => ({
          headerTitle: "Tạo bài viết",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2F95DC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <Icon
              name="chevron-left"
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
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    fontSize: 18,
    color: "#007BFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  postInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    height: 100,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  imagePickerText: {
    color: "#fff",
    fontSize: 16,
  },
  imagePreviewContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  selectedImage: {
    width: 200, // Đặt kích thước nhỏ hơn cho mỗi ảnh nếu hiển thị nhiều ảnh
    height: 200,
    borderRadius: 10,
    marginRight: 10,
  },
  noImageText: {
    color: "#ccc",
    fontSize: 16,
  },
  postButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  multiImageContainer: {
    flexDirection: "row", // Hiển thị ảnh theo hàng
    flexWrap: "wrap", // Cho phép bọc ảnh
    justifyContent: "space-between", // Căn giữa các ảnh
  },
  multiSelectedImage: {
    width: 100, // Chiều rộng cho mỗi ảnh
    height: 100, // Chiều cao tùy chọn
    marginBottom: 10, // Khoảng cách giữa các ảnh
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    padding: 5,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CreatePostStack;
