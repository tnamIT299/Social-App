import { supabase } from "../data/supabaseClient"; // Replace with your correct Supabase path
import { getUserId, getUserName } from "../data/getUserData";

// Hàm gửi thông báo khi bài viết được like
export const notifyLikePost = async (likerId, postId) => {
  try {
    // Lấy thông tin bài viết (người đăng bài và tiêu đề bài viết)
    const { data: postDetails, error: postError } = await supabase
      .from("Post")
      .select("uid, ptitle, User(name)")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    const {
      uid: postOwnerId,
      ptitle: postTitle,
      User: postOwner,
    } = postDetails;

    // Lấy tên người dùng đã like bài viết
    const likerName = await getUserName();

    // Soạn nội dung thông báo
    const notificationMessage = `${likerName} đã like bài viết của ${postOwner.name}: "${postTitle}"`;
    if(likerName === postOwner.name) return;
    // Gửi thông báo like
    const { error: notifError } = await supabase.from("Notification").insert({
      uid: postOwnerId, // Người nhận thông báo (người đăng bài)
      related_uid: likerId, // Người thực hiện hành động (người like)
      post_id: postId, // ID bài viết
      notification_type: "like",
      notification: notificationMessage,
      timestamp: getLocalISOString(),
    });

    if (notifError) throw notifError;

    console.log("Đã gửi thông báo like thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi thông báo like:", error);
  }
};

// Hàm gửi thông báo khi bài viết được comment
export const notifyCommentPost = async (commenterId, postId) => {
  try {
    // Lấy thông tin bài viết và người đăng bài
    const { data: postDetails, error: postError } = await supabase
      .from("Post")
      .select("uid, ptitle, User(name)")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    // Giải cấu trúc dữ liệu lấy được
    const {
      uid: postOwnerId,
      ptitle: postTitle,
      User: { name: postOwnerName }, // Lấy đúng trường 'name' từ đối tượng 'User'
    } = postDetails;

    // Lấy tên người bình luận
    const commentName = await getUserName();

    // Soạn nội dung thông báo
    const notificationMessage = `${commentName} đã bình luận bài viết của ${postOwnerName}: "${postTitle}"`;
    if(commentName === postOwnerName) return;

    // Tạo thông báo bình luận
    const { error: notifError } = await supabase.from("Notification").insert({
      uid: postOwnerId, // Người nhận (tác giả bài viết)
      related_uid: commenterId, // Người bình luận
      post_id: postId, // ID bài viết
      notification_type: "comment",
      notification: notificationMessage,
      timestamp: getLocalISOString(),
    });

    if (notifError) throw notifError;

    console.log("Đã gửi thông báo bình luận thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi thông báo bình luận:", error);
  }
};

// Hàm gửi thông báo khi bài viết được share
export const notifySharePost = async (sharerId, postId) => {
  try {
    // Lấy thông tin bài viết (người đăng bài và tiêu đề bài viết)
    const { data: postDetails, error: postError } = await supabase
      .from("Post")
      .select("uid, ptitle, User(name)")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    const {
      uid: postOwnerId,
      ptitle: postTitle,
      User: postOwner,
    } = postDetails;

    // Lấy tên người dùng đã chia sẻ bài viết
    const sharerName = await getUserName();

    // Soạn nội dung thông báo
    const notificationMessage = `${sharerName} đã chia sẻ bài viết của ${postOwner.name}: "${postTitle}"`;
    if(sharerName === postOwner.name) return ;
    // Gửi thông báo share
    const { error: notifError } = await supabase.from("Notification").insert({
      uid: postOwnerId, // Người nhận thông báo (người đăng bài)
      related_uid: sharerId, // Người thực hiện hành động (người share)
      post_id: postId, // ID bài viết
      notification_type: "share",
      notification: notificationMessage,
      timestamp: getLocalISOString(),
    });

    if (notifError) throw notifError;

    console.log("Đã gửi thông báo share thành công!");
  } catch (error) {
    console.error("Lỗi khi gửi thông báo share:", error);
  }
};

// Function to send a "friend post" notification for a new post
export const notifyFriendPost = async (friendId, postId) => {
  try {
    // Lấy thông tin bài viết và người đăng bài
    const { data: postDetails, error: postError } = await supabase
      .from("Post")
      .select("uid, ptitle")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    const postOwnerId = postDetails.uid; // ID của người đăng bài
    const postTitle = postDetails.ptitle; // Tiêu đề bài viết

    // Lấy danh sách bạn bè đã chấp nhận lời mời
    const { data: friends, error: friendError } = await supabase
      .from("Friendship")
      .select("receiver_id, requester_id")
      .or(`receiver_id.eq.${friendId},requester_id.eq.${friendId}`)
      .eq("status", "accepted");

    if (friendError) throw friendError;

    // Lấy tên người dùng đã like bài viết
    const postOwnerName = await getUserName();

    // Soạn nội dung thông báo
    const notificationMessage = `${postOwnerName} đã đăng bài mới: "${postTitle}"`;

    // Tạo mảng chứa các thông báo
    const notifications = friends.map((friend) => {
      const friendUid =
        friend.receiver_id === friendId
          ? friend.requester_id
          : friend.receiver_id; // Lấy UID bạn bè để gửi thông báo

      return {
        uid: friendUid, // Người nhận thông báo (bạn bè)
        related_uid: postOwnerId, // Người đăng bài
        post_id: postId, // ID bài viết
        notification_type: "friend_post", // Loại thông báo (bài đăng mới của bạn bè)
        notification: notificationMessage, // Nội dung thông báo
        timestamp: getLocalISOString(), // Thời gian thông báo
      };
    });

    // Chèn tất cả thông báo vào bảng Notification một lần
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
