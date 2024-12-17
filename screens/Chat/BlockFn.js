// services/blockService.js
import { supabase } from "../../data/supabaseClient";
import { Alert } from "react-native";

// Hàm lấy thời gian hiện tại ở định dạng ISO
export const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Giả định múi giờ +7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};

// Hàm Block người dùng
export const blockUser = async (blockerId, blockedId) => {
  try {
    const { error } = await supabase.from("BlockedList").insert([
      {
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: getLocalISOString(),
      },
    ]);

    if (error) {
      console.error("Lỗi khi chặn người dùng:", error);
      Alert.alert("Lỗi", "Không thể chặn người dùng.");
      return false;
    }

    return true; // Chặn thành công
  } catch (err) {
    console.error("Lỗi không xác định khi chặn:", err);
    Alert.alert("Lỗi", "Đã xảy ra lỗi không xác định.");
    return false;
  }
};

// Hàm Unblock người dùng
export const unblockUser = async (blockerId, blockedId) => {
  try {
    const { error } = await supabase
      .from("BlockedList")
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);

    if (error) {
      console.error("Lỗi khi bỏ chặn người dùng:", error);
      Alert.alert("Lỗi", "Không thể bỏ chặn người dùng.");
      return false;
    }
    Alert.alert("Thành công", "Đã bỏ chặn người dùng.");
    return true; // Bỏ chặn thành công
  } catch (err) {
    console.error("Lỗi không xác định khi bỏ chặn:", err);
    Alert.alert("Lỗi", "Đã xảy ra lỗi không xác định.");
    return false;
  }
};
