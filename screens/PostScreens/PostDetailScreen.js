import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import { sendComment } from "../../server/CommentService";
import { getUserName, getUserAvatar } from "../../data/getUserData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt

dayjs.extend(relativeTime);
dayjs.locale("vi");

const PostDetailScreen = () => {
  const [post, setPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [userId, setUserId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params || {}; // Get postId from route params

  const fetchPostDetails = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const { user } = data;
      if (user) {
        setUserId(user.id);
        // Fetch post details along with user data
        const { data: postData, error: postError } = await supabase
          .from("Post")
          .select("*, User(name, avatar)") // Join the User table to get user data
          .eq("pid", postId)
          .single();

        if (postError) {
          console.error("Error fetching post:", postError);
          throw postError;
        }

        // Fetch post's comments with user data
        const { data: commentsData, error: commentsError } = await supabase
          .from("Comment")
          .select("*, User(name, avatar)") // Join the User table to get user data for comments
          .eq("pid", postId);

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          throw commentsError;
        }

        // Sort comments by timestamp in ascending order
        const sortedComments = commentsData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        setPost(postData);
        setComments(sortedComments);

        //Lấy dữ liệu người dùng
        const name = await getUserName();
        const avatar = await getUserAvatar();
        setUserName(name);
        setUserAvatar(avatar);
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      // Update the UI first
      const currentLikeCount = post.plike;
      const updatedLikeCount = isLiked
        ? currentLikeCount - 1
        : currentLikeCount + 1;
      setPost((prevPost) => ({
        ...prevPost,
        plike: updatedLikeCount,
      }));

      // Update the liked status
      setLikedPosts((prevLikedPosts) => ({
        ...prevLikedPosts,
        [postId]: !isLiked,
      }));

      // Update the like count in the database after UI update
      await updateLikeCount(postId, !isLiked);
    } catch (error) {
      console.error("Error handling like:", error.message);

      // If there's an error, revert the like count on the UI
      setPost((prevPost) => ({
        ...prevPost,
        plike: post.plike,
      }));

      setLikedPosts((prevLikedPosts) => ({
        ...prevLikedPosts,
        [postId]: isLiked,
      }));
    }
  };

  const updateLikeCount = async (postId, increment) => {
    try {
      // Update the like count in the database
      const { data: post, error: postError } = await supabase
        .from("Post")
        .select("plike")
        .eq("pid", postId)
        .single();

      if (postError) throw postError;

      const newLikeCount = post.plike + (increment ? 1 : -1);

      const { error } = await supabase
        .from("Post")
        .update({ plike: newLikeCount })
        .eq("pid", postId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating like count:", error.message);
    }
  };

  const handleSendComment = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is not available.");
      return;
    }

    if (newComment.trim() === "") return; // Không gửi bình luận rỗng

    const commentDetails = {
      newComment: newComment,
      userId: userId,
      postId: postId,
    };

    // Tạo bình luận tạm thời để hiển thị lên giao diện ngay lập tức
    const tempComment = {
      cid: Date.now(), // Sử dụng tạm thời ID để không trùng lặp
      comment: newComment,
      User: {
        name: userName, // Hiển thị tên người dùng hiện tại
        avatar: userAvatar || "https://via.placeholder.com/150", // Hoặc avatar của người dùng từ profile
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
      const success = await sendComment(commentDetails);

      if (!success) {
        Alert.alert("Error", "Lỗi khi gửi bình luận");
      } else {
        // Tăng số lượng bình luận
        await incrementCommentCount(postId);

        // Cập nhật số lượng bình luận mới trên bài đăng
        setPost((prevPost) => ({
          ...prevPost,
          pcomment: prevPost.pcomment + 1,
        }));
      }
    } catch (error) {
      console.error("Error sending comment:", error.message);
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      fetchPostDetails();
    }, [postId])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading post and comments...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text>Error fetching post and comments: {error}</Text>
      </SafeAreaView>
    );
  }

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
                        uri: "https://via.placeholder.com/150",
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
                  {post.pimage && (
                    <Image
                      source={{ uri: post.pimage }}
                      style={styles.postImage}
                    />
                  )}
                </>
              ) : null}
              <View style={styles.cardStats}>
                {/* Likes, Comments, and Shares Counters */}
                <View style={styles.statRow}>
                  <Text style={styles.statText}>{post.plike} lượt thích</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      handleLike(post.pid, likedPosts[post.pid] || false)
                    }
                  >
                    <Ionicons
                      name={likedPosts[post.pid] ? "heart" : "heart-outline"}
                      size={16}
                      color={likedPosts[post.pid] ? "red" : "black"}
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

            {/* Comments */}
            <View style={styles.commentsContainer}>
              <Text style={styles.titleComment}>Bình luận</Text>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment.cid} style={styles.commentCard}>
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
                      <View style={styles.contentContainer}>
                        <Text style={styles.userName}>
                          {comment.User?.name}
                        </Text>
                        <Text style={styles.commentText}>
                          {comment.comment}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.commentActions}>
                      <Text style={styles.commentTime}>
                        {dayjs(comment.timestamp).fromNow()}
                      </Text>
                      <TouchableOpacity>
                        <Text style={styles.actionText2}>Thích</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flexDirection: "row", marginLeft: 3 }}
                      >
                        <Ionicons
                          name="return-down-forward-outline"
                          size={16}
                          color="black"
                        />
                        <Text style={styles.actionText2}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCommentCard}>
                  <Text style={styles.emptyCommentText}>Chưa có bình luận</Text>
                </View>
              )}
            </View>

            {/* Khung nhập bình luận */}
            <View style={styles.commentBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Viết bình luận..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleSendComment}>
                <Ionicons name="send" size={30} color="black" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postContainer: {
    top: 20,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  cardContainer: {
    flexDirection: "column",
  },
  userInfo: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  postDesc: {
    fontSize: 16,
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  postStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statRow: {
    flexDirection: "column", // Column layout
    alignItems: "center", // Center align the like/comment/share text
    marginBottom: 10,
  },
  statText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5, // Space between the count and the button
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  actionText: {
    marginLeft: 5, // Space between the icon and the text
    fontSize: 16,
    color: "black",
  },
  actionText2: {
    fontSize: 12,
    color: "#007AFF",
    marginRight: 15,
  },
  commentsContainer: {
    marginTop: 20,
    flexDirection: "column",
    padding: 5,
  },
  commentCard: {
    flexDirection: "column",
    padding: 10,
  },
  commentText: {
    marginBottom: 10,
  },
  titleComment: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  commentTime: {
    fontSize: 12,
    color: "gray",
    marginRight: 10,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 5,
    marginStart: 50,
  },
  noComments: {
    textAlign: "center",
    color: "#888",
  },
  emptyCommentCard: {
    backgroundColor: "#d3d3d3", // Màu xám cho khung
    height: 100, // Chiều cao của khung
    justifyContent: "center", // Canh giữa theo chiều dọc
    alignItems: "center", // Canh giữa theo chiều ngang
    borderRadius: 10, // Bo góc cho khung
    marginVertical: 10, // Khoảng cách giữa các khung
  },
  emptyCommentText: {
    color: "#888", // Màu chữ nhạt
    fontSize: 16,
  },
  user: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  posttimeText: {
    color: "gray",
    size: 20,
  },
  posttimeView: {
    left: 48,
    bottom: 10,
  },
  backButtonContainer: {
    position: "static",
    flexDirection: "row",
    backgroundColor: "#bbb",
    padding: 15,
  },
  titleview: {
    flex: 0.9,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  commentBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff", // Đảm bảo khung comment luôn có màu nền
  },
  textInput: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    backgroundColor: "#f9f9f9", // Màu nền của khung nhập liệu
  },
  contentContainer: {
    flexDirection: "column",
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
  },
});

export default PostDetailScreen;
