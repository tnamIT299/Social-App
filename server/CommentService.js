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

export const sendReplyComment = async (replyDetails) => {
  const { replyComment, userId, postId, parentCid } = replyDetails;

  // Validate input data
  if (!replyComment || !userId || !postId || !parentCid) {
    console.error("Invalid reply details:", replyDetails);
    return false;
  }

  try {
    const reply = {
      cid: generateUniqueId(), // Replace with your unique ID generator
      comment: replyComment,
      timestamp: getLocalISOString(),
      uid: userId,
      pid: postId,
      parent_cid: parentCid, // Link to the parent comment
    };

    // Insert the reply into the "Comment" table
    const { data: replyData, error: replyError } = await supabase
      .from("Comment")
      .insert([reply]);

    if (replyError) {
      console.error("Error inserting reply:", replyError.message);
      return false;
    }

    // Fetch the current comment count for the post
    const { data: postData, error: fetchError } = await supabase
      .from("Post")
      .select("pcomment")
      .eq("pid", postId)
      .single();

    if (fetchError) {
      console.error("Error fetching post data:", fetchError.message);
      return false;
    }

    const currentCommentCount = postData?.pcomment || 0;

    // Increment the comment count and update the post
    const { error: updateError } = await supabase
      .from("Post")
      .update({ pcomment: currentCommentCount + 1 })
      .eq("pid", postId);

    if (updateError) {
      console.error(
        "Error updating comment count in Post table:",
        updateError.message
      );
      return false;
    }

    return { success: true, cid: reply.cid }; // Return success and new reply ID
  } catch (error) {
    console.error("Error sending reply comment:", error.message);
    return false;
  }
};

export const editComment = async (commentId, newCommentText, userId) => {
  // Validate input data
  if (
    !commentId ||
    !newCommentText ||
    newCommentText.trim() === "" ||
    !userId
  ) {
    console.error("Invalid input for editing comment:", {
      commentId,
      newCommentText,
      userId,
    });
    return { success: false, message: "Invalid input" };
  }

  try {
    // Check if the user is the owner of the comment
    const { data: commentData, error: fetchError } = await supabase
      .from("Comment")
      .select("uid")
      .eq("cid", commentId)
      .single();

    if (fetchError) {
      console.error("Error fetching comment:", fetchError.message);
      return { success: false, message: fetchError.message };
    }
    // Update the comment in the "Comment" table
    const { data, error } = await supabase
      .from("Comment")
      .update({ comment: newCommentText })
      .eq("cid", commentId);

    if (error) {
      console.error("Error editing comment:", error.message);
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error editing comment:", error.message);
    return { success: false, message: error.message };
  }
};

export const deleteComment = async (commentId, postId) => {
  try {
    // Step 1: Fetch all comments with the given parent_cid
    const { data: childComments, error: fetchChildError } = await supabase
      .from("Comment")
      .select("cid")
      .eq("parent_cid", commentId);

    if (fetchChildError) {
      throw new Error(`Failed to fetch child comments: ${fetchChildError.message}`);
    }

    // Collect all comment IDs to be deleted (parent and children)
    const commentIdsToDelete = [commentId, ...childComments.map((c) => c.cid)];

    // Step 2: Delete all comments by their IDs
    const { error: deleteError } = await supabase
      .from("Comment")
      .delete()
      .in("cid", commentIdsToDelete);

    if (deleteError) {
      throw new Error(`Failed to delete comments: ${deleteError.message}`);
    }

    // Step 3: Decrement the comment count in the associated post
    const { data: post, error: fetchPostError } = await supabase
      .from("Post")
      .select("pcomment")
      .eq("pid", postId)
      .single();

    if (fetchPostError) {
      throw new Error(`Failed to fetch post: ${fetchPostError.message}`);
    }

    // Update comment count by subtracting the number of deleted comments
    const updatedCommentCount = Math.max((post.pcomment || 0) - commentIdsToDelete.length, 0);

    const { error: updatePostError } = await supabase
      .from("Post")
      .update({ pcomment: updatedCommentCount })
      .eq("pid", postId);

    if (updatePostError) {
      throw new Error(`Failed to update comment count: ${updatePostError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    return { success: false, message: error.message };
  }
};







// Hàm sinh ID duy nhất
const generateUniqueId = () => {
  return Date.now().toString();
};

// Hàm lấy thời gian theo múi giờ địa phương
export const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};
