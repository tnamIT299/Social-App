import React, { useEffect, useState } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { createStackNavigator } from "@react-navigation/stack";
import { createGroup } from "../../../server/GroupService";

const Stack = createStackNavigator();

const AddGroupTab = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);

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

  const handleCreateGroup = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is not available.");
      return;
    }

    const groupDetails = {
      title: groupName,
      desc: description,
      imageUris: selectedImages,
      userId: userId,
    };

    try {
      const success = await createGroup(groupDetails);

      if (success) {
        Alert.alert("Success", "Group created successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Error creating Group.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Unexpected error when creating Group: ${error.message}"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Điều chỉnh offset cho iOS
    >
      <View style={{ flex: 1, width: "100%" }}>
        {/* Hiển thị ảnh preview */}
        <View style={styles.previewContainer}>
          {selectedImages.length > 0 ? (
            <Image
              source={{ uri: selectedImages[0] }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.noImageText}>No image</Text>
            </View>
          )}
        </View>

        {/* Nút chọn ảnh */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
          <Icon name="share-outline" size={24} color="#fff" />
          <Text style={styles.imagePickerText}>Chọn hình ảnh</Text>
        </TouchableOpacity>

        {/* Tên nhóm */}
        <TextInput
          style={styles.input}
          placeholder="Tên nhóm"
          placeholderTextColor="#B0B0B0"
          value={groupName}
          onChangeText={setGroupName}
        />

        {/* Mô tả */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Mô tả"
          placeholderTextColor="#B0B0B0"
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={4}
        />

        {/* Nút Tạo */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateGroup}
        >
          <Text style={styles.createButtonText}>Tạo</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const AddGroupStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddGroupTab"
        component={AddGroupTab}
        options={({ navigation }) => ({
          headerTitle: "Tạo nhóm",
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
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 100,
  },
  noImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 14,
    color: "#888",
  },
  imagePickerButton: {
    flexDirection: "row",
    backgroundColor: "#007BFF",
    padding: 10,
    justifyContent: "center",
    marginBottom: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  imagePickerText: {
    color: "#fff",
    fontSize: 16,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F5F5F5",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignSelf: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddGroupStack;
