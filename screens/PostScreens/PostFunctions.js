import { supabase } from "../../data/supabaseClient";
import { getUserId } from "../../data/getUserData";
import { sendComment } from "../../server/CommentService";
import { notifyLikePost } from "../../server/notificationService";

// Lấy danh sách bài viết với quyền công khai và thông tin người dùng liên quan
export const fetchPosts = async (setPosts, setLoading, setError) => {
  setLoading(true);
  try {
    // Lấy danh sách bài viết với quyền truy cập là "cộng đồng"
    const { data: postsData, error: postsError } = await supabase
      .from("Post")
      .select("*")
      .eq("permission", "cộng đồng");

    if (postsError) throw new Error(postsError.message);

    // Kiểm tra nếu không có bài viết nào
    if (!postsData || postsData.length === 0) {
      setPosts([]);
      return;
    }

    const userId = await getUserId();

    // Lấy danh sách người dùng, lượt thích và bình luận cho tất cả bài viết
    const updatedPosts = await Promise.all(
      postsData.map(async (post) => {
        const userPromise = supabase
          .from("User")
          .select("uid, name, avatar")
          .eq("uid", post.uid)
          .single();

        const likePromise = supabase
          .from("Like")
          .select("status")
          .eq("post_id", post.pid)
          .eq("user_id", userId)
          .maybeSingle();

        const commentsPromise = supabase
          .from("Comment")
          .select("*, User(name, avatar)") // Join để lấy thông tin người dùng
          .eq("pid", post.pid);

        const [userData, likeData, commentsData] = await Promise.all([
          userPromise,
          likePromise,
          commentsPromise,
        ]);

        // Xử lý lỗi từ các yêu cầu
        if (userData.error) throw new Error(userData.error.message);
        if (likeData.error) throw new Error(likeData.error.message);
        if (commentsData.error) throw new Error(commentsData.error.message);

        const likedByUser = likeData.data ? likeData.data.status : false;

        // Sắp xếp bình luận theo thứ tự thời gian giảm dần
        const sortedComments = (commentsData.data || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        return {
          ...post,
          user: userData.data,
          likedByUser,
          comments: sortedComments,
        };
      })
    );

    // Sắp xếp các bài viết theo thời gian tạo
    const sortedPosts = updatedPosts.sort(
      (a, b) => new Date(b.createdat) - new Date(a.createdat)
    );

    setPosts(sortedPosts);
  } catch (error) {
    setError(error.message);
    console.error("Lỗi khi lấy bài viết:", error.message);
  } finally {
    setLoading(false);
  }
};

export const fetchPostsUser = async (
  userId,
  setPosts,
  setLoading,
  setError
) => {
  setLoading(true);
  try {
    // Lấy danh sách bài viết với quyền truy cập là "cộng đồng"
    const { data: postsData, error: postsError } = await supabase
      .from("Post")
      .select("*")
      .eq("uid", userId);

    if (postsError) throw new Error(postsError.message);

    // Kiểm tra nếu không có bài viết nào
    if (!postsData || postsData.length === 0) {
      setPosts([]);
      return;
    }

    // Lấy danh sách người dùng, lượt thích và bình luận cho tất cả bài viết
    const updatedPosts = await Promise.all(
      postsData.map(async (post) => {
        const userPromise = supabase
          .from("User")
          .select("uid, name, avatar")
          .eq("uid", post.uid)
          .single();

        const likePromise = supabase
          .from("Like")
          .select("status")
          .eq("post_id", post.pid)
          .eq("user_id", userId)
          .maybeSingle();

        const commentsPromise = supabase
          .from("Comment")
          .select("*, User(name, avatar)") // Join để lấy thông tin người dùng
          .eq("pid", post.pid);

        const [userData, likeData, commentsData] = await Promise.all([
          userPromise,
          likePromise,
          commentsPromise,
        ]);

        // Xử lý lỗi từ các yêu cầu
        if (userData.error) throw new Error(userData.error.message);
        if (likeData.error) throw new Error(likeData.error.message);
        if (commentsData.error) throw new Error(commentsData.error.message);

        const likedByUser = likeData.data ? likeData.data.status : false;

        // Sắp xếp bình luận theo thứ tự thời gian giảm dần
        const sortedComments = (commentsData.data || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        return {
          ...post,
          user: userData.data,
          likedByUser,
          comments: sortedComments,
        };
      })
    );

    // Sắp xếp các bài viết theo thời gian tạo
    const sortedPosts = updatedPosts.sort(
      (a, b) => new Date(b.createdat) - new Date(a.createdat)
    );

    setPosts(sortedPosts);
  } catch (error) {
    setError(error.message);
    console.error("Lỗi khi lấy bài viết:", error.message);
  } finally {
    setLoading(false);
  }
};

export const handleLike = async (
  postId,
  isLiked,
  likeCount,
  setPosts,
  setLikedPosts,
  setLoading,
  setError
) => {
  // Tính số lượt thích cập nhật
  const updatedLikeCount = isLiked ? likeCount - 1 : likeCount + 1;

  // Cập nhật trạng thái likedPosts
  setLikedPosts((prevLikedPosts) => ({
    ...prevLikedPosts,
    [postId]: !isLiked, // Đảo ngược trạng thái likedByUser
  }));

  // Cập nhật trạng thái posts ngay lập tức
  setPosts((prevPosts) => {
    if (!Array.isArray(prevPosts)) {
      console.error("prevPosts is not an array", prevPosts);
      return []; // Trả về giá trị mặc định
    }
    // Tìm bài viết và cập nhật số lượt thích và trạng thái likedByUser
    return prevPosts.map((post) =>
      post.pid === postId
        ? { ...post, plike: updatedLikeCount, likedByUser: !isLiked } // Cập nhật cả số lượt thích và trạng thái likedByUser
        : post
    );
  });

  try {
    const userId = await getUserId();

    // Cập nhật số lượt thích trong cơ sở dữ liệu
    await updateLikeCount(postId, !isLiked, userId);
    notifyLikePost(userId, postId);
  } catch (error) {
    console.error("Lỗi khi xử lý thích bài viết:", error.message);
    setError(error.message); // Đặt lỗi nếu có

    // Khôi phục trạng thái likedPosts và posts về trạng thái ban đầu nếu có lỗi
    setLikedPosts((prevLikedPosts) => ({
      ...prevLikedPosts,
      [postId]: isLiked, // Trả về trạng thái ban đầu
    }));

    // Khôi phục lại trạng thái posts
    setPosts((prevPosts) => {
      return prevPosts.map((post) =>
        post.pid === postId
          ? { ...post, plike: likeCount, likedByUser: isLiked } // Trả về số lượt thích và trạng thái likedByUser ban đầu
          : post
      );
    });
  } finally {
    setLoading(false);
  }
};

// Cập nhật số lượng like và bảng Like
const updateLikeCount = async (postId, isLiked, userId) => {
  try {
    const { data: post, error: postError } = await supabase
      .from("Post")
      .select("plike")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    const newLikeCount = post.plike + (isLiked ? 1 : -1);

    const { error } = await supabase
      .from("Post")
      .update({ plike: newLikeCount })
      .eq("pid", postId);

    if (error) throw error;

    const { data: existingLike, error: likeError } = await supabase
      .from("Like")
      .select("status")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (likeError && likeError.code !== "PGRST116") throw likeError;

    if (existingLike) {
      const { error: updateLikeError } = await supabase
        .from("Like")
        .update({ status: isLiked })
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (updateLikeError) throw updateLikeError;
    } else {
      const { error: insertLikeError } = await supabase.from("Like").insert({
        post_id: postId,
        user_id: userId,
        status: isLiked,
      });

      if (insertLikeError) throw insertLikeError;
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật số lượng like:", error.message);
  }
};

// Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu bài viết không
export const isPostOwner = (postId, userId, posts) => {
  if (!Array.isArray(posts)) {
    console.error("posts không phải là một mảng");
    return false;
  }
  return posts.find((post) => post.pid === postId)?.uid === userId;
};

// Xử lý điều hướng đến màn hình chỉnh sửa bài viết
export const handleEditPost = (
  navigation,
  postId,
  initialPostText,
  initialImageUris
) => {
  navigation.navigate("EditPost", {
    screen: "EditPostTab",
    params: {
      postId,
      initialPostText,
      initialImageUris,
    },
  });
};

// Xử lý xóa bài viết
export const handleDeletePost = async (postId, setPosts, setLoading) => {
  console.log("Xóa bài viết:", postId);
  setLoading(true); // Bắt đầu trạng thái loading
  try {
    const { error: postError } = await supabase
      .from("Post")
      .delete()
      .eq("pid", postId);

    if (postError) throw postError;

    // Cập nhật lại trạng thái posts để loại bỏ bài viết đã xóa
    setPosts((prevPosts) => prevPosts.filter((post) => post.pid !== postId));

    console.log("Xóa bài viết và các dữ liệu liên quan thành công");
  } catch (error) {
    console.error("Lỗi khi xóa bài viết và dữ liệu liên quan:", error.message);
  } finally {
    setLoading(false); // Kết thúc trạng thái loading
  }
};

// Xử lý lưu bài viết (chưa thực hiện)
export const handleSavePost = (postId) => {
  console.log("Lưu bài viết:", postId);
  // Xử lý lưu bài viết
};

// Xử lý ẩn bài viết (chưa thực hiện)
export const handleHidePost = (postId) => {
  console.log("Ẩn bài viết:", postId);
  // Xử lý ẩn bài viết
};

// Thay đổi quyền riêng tư của bài viết
export const handleChangePrivacy = async (postId, newPrivacy) => {
  try {
    const { error } = await supabase
      .from("Post")
      .update({ permission: newPrivacy })
      .eq("pid", postId);

    if (error) {
      throw new Error("Không thể thay đổi quyền riêng tư");
    } else {
      Alert.alert("Thành công", "Quyền riêng tư đã được cập nhật");
    }
  } catch (error) {
    Alert.alert("Lỗi", error.message);
  }
};

// Điều hướng đến màn hình chi tiết bài viết
export const handlePostDetailScreen = (navigation, postId) => {
  navigation.navigate("PostDetailScreen", { postId });
};

// Gửi bình luận
export const handleSendComment = async (
  newComment,
  postId,
  userName,
  userAvatar,
  setComments,
  setNewComment
) => {
  // Lấy dữ liệu id người dùng
  const userId = await getUserId();

  if (!userId) {
    console.error("User ID is not available.");
    return;
  }

  if (newComment.trim() === "") return; // Không gửi bình luận rỗng

  // Tạo bình luận tạm thời để hiển thị lên giao diện ngay lập tức
  const tempComment = {
    cid: Date.now(), // Sử dụng tạm thời ID để không trùng lặp
    comment: newComment,
    User: {
      name: userName,
      avatar: userAvatar || "https://via.placeholder.com/150",
    },
    timestamp: new Date().toISOString(),
  };

  // Thêm bình luận mới vào giao diện ngay lập tức
  setComments((prevComments) =>
    [tempComment, ...prevComments].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )
  );

  // Reset khung nhập liệu
  setNewComment("");

  try {
    // Gửi bình luận lên Supabase
    const success = await sendComment({
      newComment,
      userId,
      postId,
    });

    if (!success) {
      // Nếu việc gửi thất bại, bạn có thể cảnh báo và xoá bình luận tạm thời khỏi giao diện
      console.error("Lỗi khi gửi bình luận lên máy chủ.");
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.cid !== tempComment.cid)
      );
      return null; // Trả về null nếu không gửi được bình luận
    } else {
      // Tăng số lượng bình luận
      await incrementCommentCount(postId);

      // Trả về bình luận đã gửi thành công
      return {
        ...tempComment,
        cid: success.cid, // Cập nhật ID thật nếu cần thiết
      };
    }
  } catch (error) {
    console.error("Error sending comment:", error.message);

    // Nếu có lỗi, xóa bình luận tạm thời khỏi giao diện
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.cid !== tempComment.cid)
    );
    return null; // Trả về null nếu có lỗi xảy ra
  }
};

// Tăng số lượng bình luận
const incrementCommentCount = async (postId) => {
  try {
    const { data: post, error: postError } = await supabase
      .from("Post")
      .select("pcomment")
      .eq("pid", postId)
      .single();

    if (postError) throw postError;

    const newCommentCount = post.pcomment + 1;

    const { error } = await supabase
      .from("Post")
      .update({ pcomment: newCommentCount })
      .eq("pid", postId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating comment count:", error.message);
  }
};
