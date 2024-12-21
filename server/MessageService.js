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

export const editMessage = async (messageId, newContent, fetchMessages) => {
  if (newContent.trim() === "") {
    return { success: false, message: "Nội dung tin nhắn không được để trống." };
  }

  try {
    // Cập nhật tin nhắn trong bảng Message
    const { error } = await supabase
      .from("Message")
      .update({ content: newContent })
      .eq("id", messageId);

    if (error) {
      console.error("Lỗi khi chỉnh sửa tin nhắn:", error);
      return { success: false, message: "Không thể chỉnh sửa tin nhắn." };
    }

    // Tải lại danh sách tin nhắn
    await fetchMessages();

    return { success: true };
  } catch (err) {
    console.error("Lỗi không mong muốn khi chỉnh sửa tin nhắn:", err);
    return { success: false, message: "Đã xảy ra lỗi khi chỉnh sửa tin nhắn." };
  }
};

export const deleteMessage = async (messageId, fetchMessages) => {
  Alert.alert(
    "Xác nhận",
    "Bạn có chắc muốn thu hồi tin nhắn này?",
    [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Thu hồi",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("Message")
              .delete()
              .eq("id", messageId);

            if (error) {
              console.error("Lỗi khi thu hồi tin nhắn:", error);
              Alert.alert("Lỗi", "Không thể thu hồi tin nhắn.");
            } else {
              Alert.alert("Thành công", "Tin nhắn đã được thu hồi.");
              await fetchMessages(); // Tải lại danh sách tin nhắn sau khi xóa
            }
          } catch (err) {
            console.error("Lỗi không mong muốn:", err);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi thu hồi tin nhắn.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};


  


const fileNameFromUri = (uri) => {
  const parts = uri.split("/");
  return parts[parts.length - 1];
};

export const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};
