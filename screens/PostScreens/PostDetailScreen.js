import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import { handleSendComment } from "./PostFunctions";
import { getUserId, getUserName, getUserAvatar } from "../../data/getUserData";
import Swiper from "react-native-swiper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt
import styles from "./style/stylePostDetail";
import {
  sendReplyComment,
  editComment,
  deleteComment,
} from "../../server/CommentService";
dayjs.extend(relativeTime);
dayjs.locale("vi");

const PostDetailScreen = () => {
  const [post, setPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [replyTo, setReplyTo] = useState(null); // Theo dõi comment nào đang được reply
  const [replyText, setReplyText] = useState(""); // Nội dung của reply
  const [editingCommentId, setEditingCommentId] = useState(null); // ID of the comment being edited
  const [editingText, setEditingText] = useState(""); // New text for the comment
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [selectedComment, setSelectedComment] = useState(null);
  const [userId, setUserId] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params || {}; // Get postId from route params
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserId();
      setUserId(id);
    };
    fetchUserId();
  }, []);

  
  const fetchPostDetails = async () => {
    if (!postId) return;

    try {
      // Lấy thông tin người dùng hiện tại
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError)
        throw new Error("Failed to fetch user data: " + userError.message);

      const user = userData.user;

      if (!user) {
        console.error("No user found.");
        return;
      }

      // Lấy thông tin bài viết kèm thông tin người đăng
      const { data: postData, error: postError } = await supabase
        .from("Post")
        .select("*, User(name, avatar)") // Join bảng User để lấy thông tin người đăng bài
        .eq("pid", postId)
        .single();

      if (postError)
        throw new Error("Failed to fetch post details: " + postError.message);

      // Lấy thông tin bình luận kèm thông tin người bình luận
      const { data: commentsData, error: commentsError } = await supabase
        .from("Comment")
        .select("*, User(name, avatar)") // Join bảng User để lấy thông tin người bình luận
        .eq("pid", postId);

      if (commentsError)
        throw new Error("Failed to fetch comments: " + commentsError.message);

      // Lấy trạng thái like của người dùng hiện tại đối với bài viết
      const { data: likeData, error: likeError } = await supabase
        .from("Like")
        .select("status")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (likeError)
        throw new Error("Failed to fetch like status: " + likeError.message);

      const likedByUser = likeData ? likeData.status : false; // Nếu không có dữ liệu like, mặc định là false

      // Sắp xếp bình luận theo thời gian
      const sortedComments = commentsData.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Chuyển đổi danh sách bình luận thành dạng cây phân cấp

      const commentTree = buildCommentTree(sortedComments);

      // Lấy tên và avatar người dùng hiện tại
      const name = await getUserName();
      const avatar = await getUserAvatar();

      // Cập nhật state
      setPost({
        ...postData,
        likedByUser,
      });
      setComments(commentTree);
      setUserName(name);
      setUserAvatar(avatar);
    } catch (error) {
      console.error("Error in fetchPostDetails:", error.message);
    }
  };
  const buildCommentTree = (comments) => {
    const commentMap = {};
    const roots = [];

    comments.forEach((comment) => {
      comment.replies = []; // Khởi tạo danh sách replies
      commentMap[comment.cid] = comment;

      if (!comment.parent_cid) {
        // Nếu là comment gốc
        roots.push(comment);
      } else {
        // Nếu là reply, thêm vào replies của comment cha
        const parent = commentMap[comment.parent_cid];
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    return roots;
  };

  const handleLike = async (postId, isLiked, likeCount) => {
    try {
      // Update like status and count in local state
      const updatedLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.pid === postId ? { ...post, plike: updatedLikeCount } : post
        )
      );

      // Update liked status
      setLikedPosts((prevLikedPosts) => ({
        ...prevLikedPosts,
        [postId]: !isLiked,
      }));

      // Cập nhật số lượt thích trong cơ sở dữ liệu
      await updateLikeCount(postId, !isLiked);

      // Tải lại danh sách bài viết để đảm bảo giao diện được cập nhật
      await fetchPostDetails();
    } catch (error) {
      console.error("Error handling like:", error.message);
    }
  };

  const updateLikeCount = async (postId, isLiked) => {
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

      // Lấy dữ liệu id người dùng
      const userId = await getUserId();

      // Cập nhật trạng thái thích trong bảng Like
      const { data: existingLike, error: likeError } = await supabase
        .from("Like")
        .select("status")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (likeError && likeError.code !== "PGRST116") throw likeError; // Ignore "not found" error

      // Nếu đã có dữ liệu trong bảng Like, cập nhật trạng thái; nếu không, tạo mới
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
      console.error("Error updating like count:", error.message);
    }
  };
  // Sử dụng trong component của bạn
  const handleComment = async () => {
    const updatedComments = await handleSendComment(
      newComment,
      postId,
      userName,
      userAvatar,
      setComments,
      setNewComment
    );

    // Cập nhật lại comments và số lượng bình luận
    setComments((prevComments) => {
      // Giữ nguyên bình luận cũ và thêm bình luận mới
      return [...prevComments, updatedComments];
    });

    // Cập nhật lại số lượng bình luận trong post
    setPost((prevPost) => {
      if (!prevPost) {
        console.error("Previous post is not available or invalid:", prevPost);
        return prevPost; // Giữ nguyên giá trị cũ nếu không hợp lệ
      }
      return {
        ...prevPost,
        comments: [...(prevPost.comments || []), updatedComments], // Cập nhật lại danh sách bình luận
        pcomment: (prevPost.pcomment || 0) + 1, // Tăng số lượng bình luận
      };
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchPostDetails();
      fetchComments(postId);
    }, [postId])
  );

  const fetchComments = async (postId) => {
    try {
      const { data: fetchedComments, error } = await supabase
        .from("Comment")
        .select("*, User(name, avatar)")
        .eq("pid", postId);

      if (error) throw error;

      const organizedComments = organizeComments(fetchedComments || []);
      setComments(organizedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  // Tổ chức dữ liệu theo dạng phân cấp
  const organizeComments = (comments) => {
    const commentMap = {};
    const roots = [];

    // Tạo một map để lưu các comment dựa trên `cid`
    comments.forEach((comment) => {
      comment.replies = []; // Khởi tạo danh sách replies
      commentMap[comment.cid] = comment;

      // Nếu là comment gốc (không có parent_cid)
      if (!comment.parent_cid) {
        roots.push(comment);
      } else {
        // Nếu có parent_cid, thêm vào replies của comment cha
        const parent = commentMap[comment.parent_cid];
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    return roots;
  };

  const handleReply = (comment) => {
    setReplyTo(comment.cid); // Gán ID của comment cha
    setReplyText(`@${comment.User?.name} `); // Gợi ý tên người dùng
  };

  const handleReplySubmit = async () => {
    if (!replyText || !replyTo) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung và chọn comment cha.");
      return;
    }

    try {
      const userId = await getUserId();

      const replyDetails = {
        replyComment: replyText.trim(),
        userId: userId,
        postId: postId,
        parentCid: replyTo,
      };

      const response = await sendReplyComment(replyDetails);

      if (response.success) {
        // Fetch lại comment từ database để cập nhật đầy đủ
        await fetchPostDetails();

        // Reset trạng thái
        setReplyText("");
        setReplyTo(null);
      } else {
        Alert.alert("Lỗi", "Không thể gửi reply. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error in handleReplySubmit:", error.message);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi reply.");
    }
  };
  const handleOpenModal = (event, comment) => {
    const { pageY, pageX } = event.nativeEvent;
    const windowWidth = Dimensions.get("window").width;

    setModalPosition({
      top: pageY - 80,
      right: windowWidth - pageX + 10,
    });
    setSelectedComment(comment);
    setModalVisible(true);
  };

  const handleEditComment = async () => {
    if (editingText.trim() === "") {
      Alert.alert("Error", "Comment text cannot be empty.");
      return;
    }

    try {
      // Call the editComment function to update the comment in the database
      const { success, message } = await editComment(
        editingCommentId,
        editingText,
        userId
      );

      if (success) {
        // Update the local comments state
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.cid === editingCommentId
              ? { ...comment, comment: editingText }
              : comment
          )
        );
        // Reset the editing state
        setEditingCommentId(null);
        setEditingText("");
        setModalVisible(false);
      } else {
        Alert.alert("Error", message || "Failed to edit the comment.");
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      Alert.alert("Error", "An error occurred while editing the comment.");
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) {
      Alert.alert("Lỗi", "Không tìm thấy comment để xóa.");
      return;
    }
  
    const { cid, pid } = selectedComment; // Lấy thông tin từ comment đã chọn
  
    const { success, message } = await deleteComment(cid, pid);
  
    if (success) {
      // Cập nhật giao diện sau khi xóa
      setComments((prevComments) =>
        prevComments.filter(
          (comment) => comment.cid !== cid && comment.parent_cid !== cid
        )
      );
      Alert.alert("Thành công", "Bình luận đã được xóa.");
      setModalVisible(false); // Đóng modal sau khi xóa
      setSelectedComment(null); // Reset comment đã chọn
    } else {
      Alert.alert("Lỗi", message || "Không thể xóa bình luận.");
    }
  };
  
  

  // Render bình luận và reply theo dạng phân cấp
  const renderComments = (comments, depth = 0) => {
    return comments.map((comment) => (
      <View key={comment.cid} style={{ marginLeft: depth * 20 }}>
        {/* Comment chính */}
        {editingCommentId === comment.cid ? (
          <View style={styles.editingCommentCard}>
            <TextInput
              style={styles.editingInput}
              value={editingText}
              onChangeText={setEditingText}
              placeholder="Sửa bình luận..."
            />
            <View style={styles.editingActions}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEditComment}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingCommentId(null); // Exit editing mode
                  setEditingText(""); // Clear the input field
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.commentCard}>
            <View style={{ flexDirection: "row" }}>
              {comment.User?.avatar ? (
                <Image
                  source={{ uri: comment.User.avatar }}
                  style={styles.userAvatar}
                />
              ) : (
                <Image
                  source={{ uri: "https://via.placeholder.com/150" }}
                  style={styles.userAvatar}
                />
              )}
              <TouchableOpacity
                style={styles.contentContainer}
                onLongPress={(event) => {
                  if (comment.uid === userId) {
                    handleOpenModal(event, comment);
                  }
                }}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <Text style={styles.userName}>{comment.User?.name}</Text>
                <Text style={styles.commentText}>{comment.comment}</Text>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.commentActions}>
              <Text style={styles.commentTime}>
                {dayjs(comment.timestamp).fromNow()}
              </Text>
              <TouchableOpacity>
                <Text style={styles.actionText2}>Thích</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: "row", marginLeft: 3 }}
                onPress={() => handleReply(comment)}
              >
                <Ionicons
                  name="return-down-forward-outline"
                  size={16}
                  color="black"
                />
                <Text style={styles.actionText2}>Trả lời</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Render reply input nếu đang reply comment này */}
        {replyTo === comment.cid && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Nhập bình luận..."
              value={replyText}
              onChangeText={setReplyText}
            />
            <TouchableOpacity onPress={handleReplySubmit}>
              <Ionicons name="send" size={25} color="black" />
            </TouchableOpacity>
          </View>
        )}
        {/* Đệ quy render replies */}
        {comment.replies && renderComments(comment.replies, depth + 1)}
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={15}
    >
      <SafeAreaView style={styles.container}>
        {post && (
          <ScrollView style={styles.cardContainer}>
            {/* Post Details */}
            <View style={styles.backButtonContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={30} color="black" />
              </TouchableOpacity>
              <View style={styles.titleview}>
                <Text style={styles.title}>Bài đăng của {post.User?.name}</Text>
              </View>
            </View>
            <View style={styles.postContainer}>
              <View style={styles.userInfo}>
                <View style={styles.user}>
                  {post.User?.avatar ? (
                    <Image
                      source={{
                        uri: post.User.avatar,
                      }}
                      style={styles.userAvatar}
                    />
                  ) : (
                    <Image
                      source={{
                        uri:
                          "https://via.placeholder.com/150" ||
                          JSON.parse(post.pimage),
                      }}
                      style={styles.userAvatar}
                    />
                  )}
                  <Text style={{ flex: 1 }}>{post.User?.name}</Text>
                  <FontAwesome6
                    style={{ flex: 0.1 }}
                    name="ellipsis"
                    size={20}
                  ></FontAwesome6>
                </View>
              </View>
              <View style={styles.posttimeView}>
                <Text style={styles.posttimeText}>
                  {dayjs(post.createdat).fromNow()}
                </Text>
              </View>
              {post.pdesc || post.pimage ? (
                <>
                  {post.pdesc && (
                    <Text style={styles.postDesc}>{post.pdesc}</Text>
                  )}

                  {post.pimage &&
                    (() => {
                      let images = [];
                      try {
                        // Parse pimage và kiểm tra xem có phải mảng hợp lệ không
                        images = JSON.parse(post.pimage);
                        if (!Array.isArray(images) || images.length === 0)
                          return null; // Không hiển thị nếu không có ảnh
                      } catch (e) {
                        console.error("Lỗi khi parse pimage:", e.message);
                        return null; // Không hiển thị nếu parse lỗi
                      }

                      return (
                        <ScrollView
                          contentContainerStyle={styles.containerImage}
                        >
                          <View style={styles.gridContainer}>
                            {images.length === 1 ? (
                              <Image
                                key={0}
                                source={{ uri: images[0] }}
                                style={styles.postImage}
                              />
                            ) : (
                              <Swiper
                                loop={true}
                                autoplay={false}
                                showsButtons={false}
                                style={styles.wrapper}
                              >
                                {images.map((item, index) => (
                                  <View key={index} style={styles.slide}>
                                    <Image
                                      source={{ uri: item }}
                                      style={styles.image}
                                    />
                                  </View>
                                ))}
                              </Swiper>
                            )}
                          </View>
                        </ScrollView>
                      );
                    })()}
                </>
              ) : null}
              <View style={styles.cardStats}>
                {/* Likes, Comments, and Shares Counters */}
                <View style={styles.statRow}>
                  <Text style={styles.statText}>{post.plike} lượt thích</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      handleLike(post.pid, post.likedByUser, post.plike)
                    }
                  >
                    <Ionicons
                      name={post.likedByUser ? "heart" : "heart-outline"}
                      size={18}
                      color={post.likedByUser ? "red" : "black"}
                    />
                    <Text style={styles.actionText}>Like</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statText}>{post.pcomment} bình luận</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    //onPress={handleComment}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color="black"
                    />
                    <Text style={styles.actionText}>Comment</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statText}>{post.pshare} chia sẻ</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    //onPress={handleShare}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={16}
                      color="black"
                    />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Khung nhập bình luận */}
            <View style={styles.commentBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Viết bình luận..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleComment}>
                <Ionicons name="send" size={30} color="black" />
              </TouchableOpacity>
            </View>

            {/* Comments */}
            <View style={styles.commentsContainer}>
              <Text style={styles.titleComment}>Bình luận</Text>
              {comments.length > 0 ? (
                renderComments(comments)
              ) : (
                <View style={styles.emptyCommentCard}>
                  <Text style={styles.emptyCommentText}>Chưa có bình luận</Text>
                </View>
              )}
            </View>
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => setModalVisible(false)}
              >
                <View
                  style={[
                    styles.modalContent,
                    { top: modalPosition.top, right: modalPosition.right },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      setEditingCommentId(selectedComment.cid); // Set comment ID for editing
                      setEditingText(selectedComment.comment); // Set the initial text
                      setModalVisible(false); // Close the modal
                    }}
                  >
                    <Ionicons
                      name="create-outline"
                      size={24}
                      color="black"
                      style={styles.iconModal}
                    />
                    <Text style={styles.optionText}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      setModalVisible(false); // Close the modal
                      handleDeleteComment(); // Delete the comment
                    }}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color="black"
                      style={styles.iconModal}
                    />
                    <Text style={styles.optionText}>Xoá</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={24}
                      color="black"
                      style={styles.iconModal}
                    />
                    <Text style={styles.optionText}>Huỷ</Text>
                  </TouchableOpacity>
                  {/* Add more options as needed */}
                </View>
              </TouchableOpacity>
            </Modal>
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default PostDetailScreen;
