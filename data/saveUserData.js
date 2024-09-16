import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabaseClient"; // Import Supabase client của bạn

export const saveUserData = async (userId) => {
  try {
    // Lấy dữ liệu người dùng từ database
    const { data: user, error } = await supabase
      .from("User")
      .select("name, avatar")
      .eq("uid", userId)
      .single();

    if (error) {
      throw error;
    }

    // Kiểm tra nếu người dùng không có avatar, thì sử dụng ảnh placeholder
    const avatarUrl = user.avatar
      ? user.avatar
      : "https://via.placeholder.com/150";

    // Lưu tên và URL của avatar vào bộ nhớ cục bộ
    await AsyncStorage.setItem("userName", user.name);
    await AsyncStorage.setItem("userAvatar", avatarUrl);

    console.log("Đã lưu dữ liệu người dùng thành công.");
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu người dùng:", error.message);
  }
};
