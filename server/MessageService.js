import { supabase } from "../data/supabaseClient";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

export const sendMessageWithImage = async (mesageDetails) => {
  const { sender_id, receiver_id, image_url } = mesageDetails;

  try {
    let imageUrls = []; // Mảng để lưu URL của các ảnh

    // Nếu có ảnh, xử lý tải từng ảnh lên Supabase
    if (image_url && image_url.length > 0) {
      for (const imageUri of image_url) {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) throw new Error("File không tồn tại.");

        const fileName = `Message/${Date.now()}_${fileNameFromUri(imageUri)}`;

        const formData = new FormData();
        formData.append("file", {
          uri: imageUri,
          name: fileName,
          type: "image/jpeg",
        });
        // Tải ảnh lên Supabase Storage
        const response = await fetch(
          `https://uhhyfdvwcgkdhazvgamp.supabase.co/storage/v1/object/SocialApp/${fileName}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaHlmZHZ3Y2drZGhhenZnYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1Mzg1NzcsImV4cCI6MjA0MTExNDU3N30.wIntuljwnbAe99So-08Rx8hTa3nHNo1eHE61dy6VZOc`,
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          }
        );

        const result = await response.json();
        if (!response.ok)
          throw new Error(`Tải ảnh lên Supabase thất bại: ${result.message}`);

        const { data: urlData, error: urlError } = supabase.storage
          .from("SocialApp")
          .getPublicUrl(fileName);
        if (urlError)
          throw new Error(`Lấy URL công khai thất bại: ${urlError.message}`);

        imageUrls.push(urlData.publicUrl); // Thêm URL ảnh vào mảng
      }
    }

    const message = {
      sender_id: sender_id,
      receiver_id: receiver_id,
      image_url: JSON.stringify(imageUrls),
      created_at: getLocalISOString(),
    };

    const { data, error } = await supabase.from("Message").insert([message]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
    return false;
  }
};
export const deleteMessage = async (id, senderId, uid, fetchMessages) => {
    if (senderId !== uid) {
      Alert.alert("Lỗi", "Bạn không có quyền xoá tin nhắn này.");
      return; // Ngừng hành động nếu người dùng không phải là người gửi tin nhắn
    }
  
    Alert.alert("Xác nhận", "Bạn có chắc muốn xoá tin nhắn này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("Message")
              .delete()
              .eq("id", id);
  
            if (error) {
              console.error("Lỗi xoá tin nhắn:", error);
              Alert.alert("Lỗi", "Không thể xoá tin nhắn.");
            } else {
              Alert.alert("Thành công", "Tin nhắn đã được xoá.");
              await fetchMessages(); // Tải lại tin nhắn
            }
          } catch (err) {
            console.error("Unexpected error:", err);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi xoá tin nhắn.");
          }
        },
      },
    ]);
  };
  


const fileNameFromUri = (uri) => {
  const parts = uri.split("/");
  return parts[parts.length - 1];
};

const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};
