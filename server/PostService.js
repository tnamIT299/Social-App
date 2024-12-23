import { Alert } from "react-native";
import { notifyFriendPost, notifySharePost } from "./notificationService";
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
      //pvideo: "",
      plike: 0,
      pcomment: 0,
      pshare: 0,
      permission: "cộng đồng",
      uid: userId || "",
      createdat: getLocalISOString(),
    };

    console.log("Đang thêm bài viết vào cơ sở dữ liệu:", post);

    // Chèn bài viết vào cơ sở dữ liệu
    const { data, error } = await supabase.from("Post").insert([post]);

    if (error) throw error;

    // Gọi hàm gửi thông báo sau khi bài viết được thêm thành công
    await notifyFriendPost(userId, post.pid);

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

// Chia sẻ bài viết
export const handleSharePost = async (postId, userId, setPosts, setError) => {
  try {
    // 1. Lấy thông tin bài viết gốc và người đăng bài gốc
    const { data: originalPost, error: fetchError } = await supabase
      .from("Post")
      .select(
        `
        * ,
        user:uid(name, avatar) -- Lấy thông tin người đăng bài gốc
      `
      )
      .eq("pid", postId)
      .single();

    if (fetchError) {
      throw new Error(`Không thể lấy bài viết gốc: ${fetchError.message}`);
    }

    // 2. Tạo bài viết chia sẻ
    const { error: insertError } = await supabase.from("Post").insert({
      pid: generateUniqueId(),
      ptitle: originalPost.ptitle,
      pdesc: originalPost.pdesc,
      pimage: originalPost.pimage,
      plike: 0,
      pcomment: 0,
      pshare: 0,
      uid: userId, // ID người chia sẻ
      createdat: getLocalISOString(),
      original_pid: originalPost.pid, // Liên kết bài viết gốc
    });

    if (insertError) {
      throw new Error(`Không thể tạo bài viết chia sẻ: ${insertError.message}`);
    }

    // 3. Tăng số lượt chia sẻ bài viết gốc
    const { error: updateError } = await supabase
      .from("Post")
      .update({ pshare: originalPost.pshare + 1 })
      .eq("pid", postId);

    if (updateError) {
      throw new Error(
        `Không thể cập nhật số lượt chia sẻ: ${updateError.message}`
      );
    }

    // 4. Tải lại toàn bộ danh sách bài viết
    const { data: updatedPosts, error: fetchUpdatedError } =
      await supabase.from("Post").select(`
        * ,
        user:uid(name, avatar), 
        original_post:original_pid( 
          ptitle,
          user:uid(name, avatar) 
        )
      `);

    if (fetchUpdatedError) {
      throw new Error(
        `Không thể tải lại danh sách bài viết: ${fetchUpdatedError.message}`
      );
    }

    if (!updatedPosts || updatedPosts.length === 0) {
      throw new Error("Không tìm thấy bài viết nào sau khi chia sẻ.");
    }

    // In toàn bộ danh sách bài viết (debug)
    console.log("Updated Posts:", updatedPosts);

    // 5. Cập nhật danh sách bài viết và thông báo thành công
    setPosts(updatedPosts);
    Alert.alert("Thông báo", "Chia sẻ bài viết thành công!");

    // Cập nhật ID của bài viết chia sẻ trong trường hợp này
    const { data: newPost } = await supabase
      .from("Post")
      .select("pid")
      .eq("uid", userId)
      .order("createdat", { ascending: false })
      .limit(1)
      .single();

    // Gọi notifySharePost với ID bài viết mới
    await notifySharePost(userId, newPost.pid);
  } catch (error) {
    console.error("Error in handleSharePost:", error.message);
    setError(error.message);
    Alert.alert("Lỗi", `Chia sẻ bài viết thất bại: ${error.message}`);
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
