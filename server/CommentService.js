import { supabase } from "../data/supabaseClient";

export const sendComment = async (commentDetails) => {
  const { newComment, userId, postId } = commentDetails;

  // Kiểm tra xem các giá trị cần thiết có hợp lệ không
  if (!newComment || !userId || !postId) {
    console.error("Các thông tin cần thiết không hợp lệ:", commentDetails);
    return false;
  }

  try {
    const comment = {
      cid: generateUniqueId(), // Thay thế bằng hàm tạo ID duy nhất của bạn
      comment: newComment,
      timestamp: getLocalISOString(), // Kiểm tra xem hàm này trả về định dạng thời gian chính xác không
      uid: userId,
      pid: postId,
    };

    // Log thông tin bình luận trước khi gửi
    console.log("Comment to be sent:", comment);

    const { data, error } = await supabase.from("Comment").insert([comment]);

    if (error) {
      throw error;
    }

    return { success: true, cid: comment.cid }; // Thành công và trả về ID của bình luận
  } catch (error) {
    console.error("Error creating post:", error.message);
    return false; // Trả về false nếu có lỗi
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
