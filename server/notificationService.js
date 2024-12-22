import { supabase } from "../data/supabaseClient"; // Replace with your correct Supabase path

// Function to send a "like" notification for a post
export const notifyLikePost = async (likerId, postId) => {
  try {
    // Fetch the post details (title and the post owner's user ID)
    const { data: post, error: postError } = await supabase
      .from("Post")
      .select("uid, ptitle")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    // Send the like notification
    const { error: notifError } = await supabase.from("Notification").insert({
      uid: post.uid, // Post author (receiver)
      related_uid: likerId, // Liker (actor)
      post_id: postId, // Post ID
      notification_type: "like",
      notification: `Người dùng ${likerId} đã like bài viết "${post.pTitle}"`,
      timestamp: getLocalISOString(),
    });

    if (notifError) throw notifError;

    console.log("Đã gửi thông báo like thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi thông báo like:", error);
  }
};

// Function to send a "comment" notification for a post
export const notifyCommentPost = async (commenterId, postId, commentText) => {
  try {
    // Fetch the post details (title and the post owner's user ID)
    const { data: post, error: postError } = await supabase
      .from("Post")
      .select("uid, ptitle")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    // Send the comment notification
    const { error: notifError } = await supabase.from("Notification").insert({
      uid: post.uid, // Post author (receiver)
      related_uid: commenterId, // Commenter (actor)
      post_id: postId, // Post ID
      notification_type: "comment",
      notification: `Người dùng ${commenterId} đã bình luận bài viết "${post.pTitle}": "${commentText}"`,
      timestamp: getLocalISOString(),
    });

    if (notifError) throw notifError;

    console.log("Đã gửi thông báo bình luận thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi thông báo bình luận:", error);
  }
};

// Function to send a "friend post" notification for a post
export const notifyFriendPost = async (friendId, postId) => {
  try {
    // Fetch the list of friends who accepted the request
    const { data: friends, error: friendError } = await supabase
      .from("Friendship")
      .select("receiver_id, requester_id")
      .or(`receiver_id.eq.${friendId},requester_id.eq.${friendId}`)
      .eq("status", "accepted");

    if (friendError) throw friendError;

    // Fetch the post details (post title)
    const { data: post, error: postError } = await supabase
      .from("Post")
      .select("pTitle")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    // Send notifications to all friends
    const notifications = friends.map((friend) => ({
      uid:
        friend.receiver_id === friendId
          ? friend.requester_id
          : friend.receiver_id, // Receiver (friend)
      related_uid: friendId, // Post creator (friend of the receiver)
      post_id: postId, // Post ID
      notification_type: "friend_post",
      notification: `Bạn của bạn (${friendId}) đã đăng bài mới: "${post.pTitle}"`,
      timestamp: getLocalISOString(),
    }));

    const { error: notifError } = await supabase
      .from("Notification")
      .insert(notifications);

    if (notifError) throw notifError;

    console.log("Đã gửi thông báo bài đăng của bạn thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi thông báo bài đăng của bạn:", error);
  }
};

// Hàm lấy thời gian theo múi giờ địa phương
const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};
