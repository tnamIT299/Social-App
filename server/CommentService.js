import { supabase } from "../data/supabaseClient";

export const sendComment = async (commentDetails) => {
  const { newComment, userId, postId } = commentDetails;

  try {
    const comment = {
      cid: generateUniqueId(),
      comment: newComment,
      timestamp: getLocalISOString(),
      uid: userId,
      pid: postId,
    };

    const { data, error } = await supabase.from("Comment").insert([comment]);

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
