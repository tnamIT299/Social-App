import AsyncStorage from "@react-native-async-storage/async-storage";

export const handleColorChange = async (
  color,
  setSelectedColor,
  setModalVisible,
  navigation,
  uid,
  avatar,
  name
) => {
  try {
    await AsyncStorage.setItem("themeColor", color);
    setSelectedColor(color); 
    setModalVisible(false); 
    navigation.navigate("Message", {
      themeColor: color,
      uid,
      avatar,
      name,
    });
  } catch (error) {
    console.error("Error saving color: ", error);
  }
};
