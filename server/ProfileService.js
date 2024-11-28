import { supabase } from "../data/supabaseClient";
import * as FileSystem from "expo-file-system";

export const updateUserProfile = async (profileDetails) => {
  const { coverUri, avatarUri, name, phone, job, address, workplace, userId } = profileDetails;

  try {
    let imageCoverUrls = [];
    let imageAvatarUrls = [];

    // Kiểm tra và xử lý avatar nếu có
    if (avatarUri && avatarUri.length > 0) {
      for (const imageAvatarUri of avatarUri) {
        const fileInfo = await FileSystem.getInfoAsync(imageAvatarUri);
        if (!fileInfo.exists) {
          console.error("File không tồn tại:", imageAvatarUri);
          continue; // Bỏ qua ảnh không tồn tại
        }

        const fileName = `Image_Profile/Avatar/${Date.now()}_${fileNameFromUri(imageAvatarUri)}`;

        const formData = new FormData();
        formData.append("file", {
          uri: imageAvatarUri,
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
        if (!response.ok) throw new Error(`Tải ảnh lên Supabase thất bại: ${result.message}`);

        const { data: urlData, error: urlError } = supabase.storage
          .from("SocialApp")
          .getPublicUrl(fileName);
        if (urlError) throw new Error(`Lấy URL công khai thất bại: ${urlError.message}`);

        imageAvatarUrls.push(urlData.publicUrl); // Thêm URL ảnh vào mảng
      }
    }

    // Kiểm tra và xử lý cover nếu có
    if (coverUri && coverUri.length > 0) {
      for (const imageCoverUri of coverUri) {
        const fileInfo = await FileSystem.getInfoAsync(imageCoverUri);
        if (!fileInfo.exists) {
          console.error("File không tồn tại:", imageCoverUri);
          continue; // Bỏ qua ảnh không tồn tại
        }

        const fileName = `Image_Profile/Cover/${Date.now()}_${fileNameFromUri(imageCoverUri)}`;

        const formData = new FormData();
        formData.append("file", {
          uri: imageCoverUri,
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
        if (!response.ok) throw new Error(`Tải ảnh lên Supabase thất bại: ${result.message}`);

        const { data: urlData, error: urlError } = supabase.storage
          .from("SocialApp")
          .getPublicUrl(fileName);
        if (urlError) throw new Error(`Lấy URL công khai thất bại: ${urlError.message}`);

        imageCoverUrls.push(urlData.publicUrl); // Thêm URL ảnh vào mảng
      }
    }

    // Chuẩn bị dữ liệu để cập nhật (chỉ cập nhật nếu có ảnh)
    const updates = {
      name: name,
      phone: phone,
      job: job,
      address: address,
      workplace: workplace,
      cover: imageCoverUrls.length > 0 ? (imageCoverUrls.length === 1 ? imageCoverUrls[0] : JSON.stringify(imageCoverUrls)) : undefined,
      avatar: imageAvatarUrls.length > 0 ? (imageAvatarUrls.length === 1 ? imageAvatarUrls[0] : JSON.stringify(imageAvatarUrls)) : undefined,
      updated_at: getLocalISOString(),
    };

    // Cập nhật thông tin người dùng
    const { error: updateError } = await supabase
      .from("User") // Tên bảng User trong Supabase
      .update(updates)
      .eq("uid", userId); // Điều kiện là userId khớp

    if (updateError) {
      console.error("Lỗi cập nhật hồ sơ người dùng:", updateError.message);
      return null;
    }

    console.log("Cập nhật hồ sơ người dùng thành công.");
    return true; // Thành công
  } catch (error) {
    console.error("Lỗi chung trong quá trình cập nhật hồ sơ:", error.message);
    return null;
  }
};

// Hàm lấy tên file từ URI
const fileNameFromUri = (uri) => {
  const parts = uri.split("/");
  return parts[parts.length - 1];
};

// Hàm lấy thời gian theo múi giờ địa phương
const getLocalISOString = () => {
  const localDate = new Date();
  return localDate.toISOString();
};
