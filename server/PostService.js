import { supabase } from "../data/supabaseClient";
import * as FileSystem from "expo-file-system";

export const createPost = async (postDetails) => {
  const { title, desc, imageUris, userId } = postDetails;

  try {
    let imageUrls = []; // Mảng để lưu URL của các ảnh

    // Nếu có ảnh, xử lý tải từng ảnh lên Supabase
    if (imageUris && imageUris.length > 0) {
      for (const imageUri of imageUris) {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) throw new Error("File không tồn tại.");

        const fileName = `Image_Post/${Date.now()}_${fileNameFromUri(
          imageUri
        )}`;

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

    const post = {
      pid: generateUniqueId(),
      ptitle: title || "",
      pdesc: desc || "",
      pimage: JSON.stringify(imageUrls), // Lưu các URL dưới dạng chuỗi JSON
      pvideo: "",
      plike: 0,
      pcomment: 0,
      pshare: 0,
      permission: "cộng đồng",
      uid: userId || "",
      createdat: getLocalISOString(),
    };

    console.log("Đang thêm bài viết vào cơ sở dữ liệu:", post);

    const { data, error } = await supabase.from("Post").insert([post]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Lỗi tạo bài viết:", error);
    return false;
  }
};

export const editPost = async (postDetails) => {
  const { id, desc, imageUris, userId } = postDetails; // imageUris là mảng URI của các ảnh

  try {
    let imageUrls = []; // Mảng chứa URL ảnh

    // Nếu có ảnh mới, tải từng ảnh lên Supabase
    if (imageUris && imageUris.length > 0) {
      for (const imageUri of imageUris) {
        // Kiểm tra nếu imageUri là URL công khai từ Supabase (đã được lưu từ trước)
        if (imageUri.startsWith("https://")) {
          imageUrls.push(imageUri); // Đẩy URL vào mảng mà không cần tải lên lại
        } else {
          // Xử lý các ảnh mới cần tải lên từ thiết bị cục bộ
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (!fileInfo.exists) throw new Error("File không tồn tại.");

          const fileName = `Image_Post/${Date.now()}_${fileNameFromUri(
            imageUri
          )}`;

          const formData = new FormData();
          formData.append("file", {
            uri: imageUri,
            name: fileName,
            type: "image/jpeg",
          });

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

          // Lấy URL công khai của ảnh mới tải lên
          const { data: urlData, error: urlError } = supabase.storage
            .from("SocialApp")
            .getPublicUrl(fileName);
          if (urlError)
            throw new Error(`Lấy URL công khai thất bại: ${urlError.message}`);

          imageUrls.push(urlData.publicUrl); // Lưu URL công khai
        }
      }
    }

    const postUpdate = {
      pdesc: desc || "",
      pimage: JSON.stringify(imageUrls), // Lưu URL ảnh dưới dạng chuỗi JSON
      uid: userId || "",
      createdat: getLocalISOString(),
    };

    const { data, error } = await supabase
      .from("Post")
      .update(postUpdate)
      .eq("pid", id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Lỗi chỉnh sửa bài viết:", error);
    return false;
  }
};

// Hàm lấy tên tệp từ URI
const fileNameFromUri = (uri) => {
  const parts = uri.split("/");
  return parts[parts.length - 1];
};

// Hàm sinh ID duy nhất
const generateUniqueId = () => {
  return Date.now().toString();
};

// Hàm lấy thời gian theo múi giờ địa phương
const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};
