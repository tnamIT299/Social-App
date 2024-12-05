import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export const pickImage = (launchGallery, launchCamera) => {
  const options = [
    { text: "Chọn Thư viện", onPress: () => launchGallery() },
    { text: "Chụp ảnh", onPress: () => launchCamera() },
    { text: "Hủy", onPress: () => {}, style: "cancel" },
  ];

  Alert.alert("Chọn ảnh", "Bạn muốn chọn ảnh từ đâu?", options);
};

export const launchGallery = async (setSelectedImages, selectedImages) => {
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
    setSelectedImages([...selectedImages, pickerResult.assets[0].uri]);
  } else {
    console.log("No image selected or picker was canceled");
  }
};

export const launchCamera = async (setSelectedImages, selectedImages) => {
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
    setSelectedImages([...selectedImages, cameraResult.assets[0].uri]);
  } else {
    console.log("No image taken or camera was canceled");
  }
};

export const removeImage = (uri, setSelectedImages, selectedImages) => {
  const filteredImages = selectedImages.filter(
    (imageUri) => imageUri !== uri
  );
  setSelectedImages(filteredImages);
};
