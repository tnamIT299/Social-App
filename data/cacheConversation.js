import AsyncStorage from "@react-native-async-storage/async-storage";

// Lưu dữ liệu vào cache
export const saveToCache = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
};

// Lấy dữ liệu từ cache
export const fetchFromCache = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Error fetching from cache:", error);
    return null;
  }
};
