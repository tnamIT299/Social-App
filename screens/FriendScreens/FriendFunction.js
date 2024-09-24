import { supabase } from "../../data/supabaseClient";

// Gửi lời mời kết bạn
export const handleSendFriendRequest = async (
  receiverId,
  fetchSuggestions,
  fetchSentInvitations
) => {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const currentUserId = sessionData?.session?.user?.id;
    if (!currentUserId) {
      console.error("Người dùng hiện tại không tồn tại.");
      return;
    }

    // Kiểm tra lời mời kết bạn đã gửi
    const { data: existingRequests } = await supabase
      .from("Friendship")
      .select("*")
      .eq("requester_id", currentUserId)
      .eq("receiver_id", receiverId)
      .eq("status", "pending");

    if (existingRequests.length > 0) {
      console.log("Lời mời kết bạn đã được gửi.");
      return;
    }

    // Kiểm tra người dùng đã là bạn bè chưa
    const { data: friendshipsByUser } = await supabase
      .from("Friendship")
      .select("*")
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .or(`requester_id.eq.${receiverId},receiver_id.eq.${receiverId}`);

    if (friendshipsByUser.length > 0) {
      console.log("Đã là bạn hoặc đã gửi lời mời kết bạn.");
      return;
    }

    // Xóa lời mời kết bạn nếu đã tồn tại phía người nhận
    const { data: existingReceivedRequests } = await supabase
      .from("Friendship")
      .select("*")
      .eq("requester_id", receiverId)
      .eq("receiver_id", currentUserId)
      .eq("status", "pending");

    if (existingReceivedRequests.length > 0) {
      await supabase
        .from("Friendship")
        .delete()
        .eq("requester_id", receiverId)
        .eq("receiver_id", currentUserId)
        .eq("status", "pending");
    }

    // Gửi lời mời kết bạn mới
    await supabase.from("Friendship").insert({
      requester_id: currentUserId,
      receiver_id: receiverId,
      status: "pending",
    });

    console.log("Lời mời kết bạn đã được gửi thành công.");

    // Cập nhật danh sách
    fetchSuggestions();
    fetchSentInvitations();
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error.message || error);
  }
};

// Hủy bỏ gợi ý bạn bè
export const handleRemoveFriendSuggestion = (
  userId,
  suggestions,
  setSuggestions
) => {
  setSuggestions(suggestions.filter((suggestion) => suggestion.id !== userId));
};

// Hoàn tác thêm bạn
export const handleUndoAddFriend = async (
  receiverId,
  suggestions,
  setSuggestions
) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) return;

    const { data: friendshipRequests } = await supabase
      .from("Friendship")
      .select("id")
      .eq("requester_id", currentUserId)
      .eq("receiver_id", receiverId)
      .eq("status", "pending");

    if (friendshipRequests.length === 0) {
      console.log("Yêu cầu kết bạn không tìm thấy.");
      return;
    }

    const friendshipId = friendshipRequests[0].id;

    // Cập nhật giao diện người dùng
    setSuggestions(
      suggestions.map((suggestion) =>
        suggestion.id === receiverId
          ? { ...suggestion, isFriendAdded: false }
          : suggestion
      )
    );

    // Xóa yêu cầu kết bạn
    await supabase.from("Friendship").delete().eq("id", friendshipId);
  } catch (error) {
    console.error(error.message);
    setSuggestions(
      suggestions.map((suggestion) =>
        suggestion.id === receiverId
          ? { ...suggestion, isFriendAdded: true }
          : suggestion
      )
    );
  }
};

// Chấp nhận lời mời kết bạn
export const handleAcceptFriendRequest = async (
  requestId,
  fetchFriendRequests,
  fetchFriendList
) => {
  try {
    await supabase
      .from("Friendship")
      .update({ status: "accepted" })
      .eq("id", requestId);

    fetchFriendRequests();
    fetchFriendList();
  } catch (error) {
    console.error("Lỗi khi chấp nhận lời mời kết bạn:", error);
  }
};

// Xóa lời mời kết bạn
export const handleDeleteFriendRequest = async (
  requestId,
  fetchFriendRequests
) => {
  try {
    await supabase.from("Friendship").delete().eq("id", requestId);

    fetchFriendRequests();
  } catch (error) {
    console.error("Lỗi khi xóa lời mời kết bạn:", error);
  }
};

// Thu hồi lời mời đã gửi
export const handleRevokeInvitation = async (
  receiverId,
  fetchSentInvitations
) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) {
      console.error("Người dùng hiện tại không tồn tại.");
      return;
    }

    const { data: friendshipRequests } = await supabase
      .from("Friendship")
      .select("id")
      .eq("requester_id", currentUserId)
      .eq("receiver_id", receiverId)
      .eq("status", "pending");

    if (friendshipRequests.length === 0) {
      console.log("Yêu cầu kết bạn không tìm thấy.");
      return;
    }

    const friendshipId = friendshipRequests[0].id;

    await supabase.from("Friendship").delete().eq("id", friendshipId);

    fetchSentInvitations();
  } catch (error) {
    console.error("Lỗi khi thu hồi yêu cầu kết bạn:", error);
  }
};
