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

const { width: screenWidth } = Dimensions.get("window");
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
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params || {}; // Get postId from route params

  const fetchPostDetails = async () => {
    if (!postId) return;

    try {
      // Lấy thông tin người dùng hiện tại
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData.user;
      if (user) {
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

        // Fetch liked status
        const { data: likeData, error: likeError } = await supabase
          .from("Like")
          .select("status")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (likeError) throw likeError;

        // Check if likeData is null or undefined
        const likedByUser = likeData ? likeData.status : false; // Default to false if no like data

        // Sort comments by timestamp in descending order
        const sortedComments = commentsData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setComments(sortedComments);

        setPost({
          ...postData,
          likedByUser, // Include likedByUser status
        });

        // Lấy dữ liệu người dùng
        const name = await getUserName();
        const avatar = await getUserAvatar();
        setUserName(name);
        setUserAvatar(avatar);
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
    } finally {
    }
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
    }, [postId])
  );

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
                  {post.pimage && (
                    <ScrollView contentContainerStyle={styles.containerImage}>
                      <View style={styles.gridContainer}>
                        {post.pimage &&
                        Array.isArray(JSON.parse(post.pimage)) ? (
                          JSON.parse(post.pimage).length === 1 ? (
                            <Image
                              key={0}
                              source={{ uri: JSON.parse(post.pimage)[0] }}
                              style={styles.postImage}
                            />
                          ) : (
                            <Swiper
                              loop={true}
                              autoplay={false}
                              showsButtons={false}
                              style={styles.wrapper}
                            >
                              {JSON.parse(post.pimage).map((item, index) => (
                                <View key={index} style={styles.slide}>
                                  <Image
                                    source={{ uri: item }}
                                    style={styles.image}
                                  />
                                </View>
                              ))}
                            </Swiper>
                          )
                        ) : (
                          <Text>Không có hình ảnh nào</Text>
                        )}
                      </View>
                    </ScrollView>
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
              <TouchableOpacity onPress={handleComment}>
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
  containerImage: {
    flexGrow: 1,
    padding: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  wrapper: {
    height: 250,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: screenWidth,
    height: 250,
    resizeMode: "cover",
  },
});

export default PostDetailScreen;
