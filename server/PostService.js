// PostServer.js
import { supabase } from "../data/supabaseClient";

export const createPost = async (postDetails) => {
  const { title, desc, imageUri, userId } = postDetails;

  try {
    const post = {
      pid: generateUniqueId(), // Sinh ID duy nhất
      ptitle: title || "",
      pdesc: desc || "",
      pimage: imageUri || "",
      pvideo: "", // Hoặc giá trị khác nếu có video
      plike: 0,
      pcomment: 0,
      pshare: 0,
      permission: "cộng đồng", // Hoặc giá trị khác nếu cần
      uid: userId || "", // Sử dụng userId từ CreatePost
      createdat: getLocalISOString(),
    };

    const { data, error } = await supabase.from("Post").insert([post]);

    if (error) {
      throw error;
    }

    return true; // Thành công
  } catch (error) {
    console.error("Error creating post:", error.message);
    return false;
  }
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
