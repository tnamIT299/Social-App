import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { getUserId } from "../../data/getUserData";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import Swiper from "react-native-swiper";
import PostOptions from "../PostScreens/PostOptions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt

const { width: screenWidth } = Dimensions.get("window");
dayjs.extend(relativeTime);
dayjs.locale("vi");

const HomeScreen = () => {
  const [visible, setVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const navigation = useNavigation();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchUserAvatar = async () => {
      // Fetch the current user's session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from("User")
          .select("avatar")
          .eq("uid", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data: ", error);
        } else {
          setAvatarUrl(data.avatar); // Save avatar URL in state
        }
      }
    };
    fetchUserAvatar();
  }, []);

  const handleCreatePost = () => {
    toggleMenu(); // Close menu
    navigation.navigate("CreatePost"); // Navigate to CreatePost screen
  };

  const handlePostDetailScreen = (postId) => {
    navigation.navigate("PostDetailScreen", { postId });
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("Post")
        .select("*")
        .eq("permission", "cộng đồng");

      if (postsError) throw postsError;

      const Id = await getUserId();
      setUserId(Id);

      const updatedPosts = await Promise.all(
        postsData.map(async (post) => {
          const { data: userData, error: userError } = await supabase
            .from("User")
            .select("uid, name, avatar")
            .eq("uid", post.uid)
            .single();

          if (userError) throw userError;

          // Fetch liked status
          const { data: likeData, error: likeError } = await supabase
            .from("Like")
            .select("status")
            .eq("post_id", post.pid)
            .eq("user_id", Id)
            .maybeSingle();

          if (likeError) throw likeError;

          // Check if likeData is null or undefined
          const likedByUser = likeData ? likeData.status : false; // Default to false if no like data

          return {
            ...post,
            user: userData,
            likedByUser, // Include likedByUser status
          };
        })
      );

      // Sắp xếp bài đăng theo thời gian từ muộn đến sớm
      const sortedPosts = updatedPosts.sort(
        (a, b) => new Date(b.createdat) - new Date(a.createdat)
      );

      setPosts(sortedPosts);
    } catch (error) {
      setError(error.message);
      console.log("Error fetching posts:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const toggleMenu = () => {
    setVisible(!visible);
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
      await fetchPosts();
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

  const isPostOwner = (postId, userId) => {
    return posts.find((post) => post.pid === postId)?.uid === userId;
  };

  // Các chức năng của bài đăng
  const handleEditPost = (postId, initialPostText, initialImageUris) => {
    // Điều hướng sang màn hình chỉnh sửa bài viết thông qua EditPostStack
    navigation.navigate("EditPost", {
      screen: "EditPostTab", // Chỉ định màn hình bên trong stack
      params: {
        postId,
        initialPostText,
        initialImageUris,
      },
    });
  };

  const handleDeletePost = async (postId) => {
    console.log("Xóa bài viết:", postId);
    try {
      // Xóa bài viết từ bảng "Post"
      const { error: postError } = await supabase
        .from("Post")
        .delete()
        .eq("pid", postId);

      if (postError) throw postError;

      // Do ON DELETE CASCADE đã được thiết lập, dữ liệu liên quan "Like" sẽ tự độn trong bảng "Comment" vàg bị xóa.

      // Cập nhật lại danh sách bài đăng sau khi xóa
      await fetchPosts();
      console.log("Xóa bài viết và các dữ liệu liên quan thành công");
    } catch (error) {
      console.error(
        "Lỗi khi xóa bài viết và dữ liệu liên quan:",
        error.message
      );
    }
  };

  const handleSavePost = (postId) => {
    console.log("Lưu bài viết:", postId);
    // Xử lý lưu bài viết
  };

  const handleHidePost = (postId) => {
    console.log("Ẩn bài viết:", postId);
    // Xử lý ẩn bài viết
  };

  const handleChangePrivacy = async (postId, newPrivacy) => {
    const { error } = await supabase
      .from("Post")
      .update({ permission: newPrivacy })
      .eq("pid", postId);

    if (error) {
      Alert.alert("Lỗi", "Không thể thay đổi quyền riêng tư");
    } else {
      Alert.alert("Thành công", "Quyền riêng tư đã được cập nhật");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Loopy</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={toggleMenu}>
            <Ionicons
              name="add-circle-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>

          <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={toggleMenu} // Đóng modal khi nhấn nút back trên Android
          >
            {/* Vùng overlay bên ngoài modal */}
            <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleCreatePost}
                >
                  <Text>Tạo bài viết</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text>Tạo tin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text>Tạo Short Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text>Tạo Livestream</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <TouchableOpacity>
            <Ionicons
              name="search-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>

          <View style={styles.notificationIcon}>
            <TouchableOpacity>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={30}
                color="black"
              />
            </TouchableOpacity>

            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>1</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Post input */}
      <View style={styles.postInputContainer}>
        <Image
          source={{
            uri: avatarUrl || "https://via.placeholder.com/150",
          }}
          style={styles.avatar}
        />
        <TextInput style={styles.postInput} placeholder="Bạn đang nghĩ gì ?" />
      </View>

      {/* Post cards with horizontal ScrollView */}
      <ScrollView style={{ marginBottom: 30 }}>
        <ScrollView
          horizontal={true}
          style={styles.storyContainer}
          showsHorizontalScrollIndicator={true}
        >
          {[
            "Username1",
            "Username2",
            "Username3",
            "Username3",
            "Username3",
            "Username3",
          ].map((name, index) => (
            <View key={index} style={styles.storyCard}>
              <Image
                source={{ uri: "https://via.placeholder.com/150" }}
                style={styles.storyCardImage}
              />
              <Text style={styles.storyCardText}>{name}</Text>
            </View>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading posts...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text>Error fetching posts: {error}</Text>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {posts.map((post) => {
              const isOwner = isPostOwner(post.pid, userId);
              return (
                <View key={post.pid} style={styles.card}>
                  <TouchableOpacity
                    key={post.pid}
                    onPress={() => handlePostDetailScreen(post.pid)}
                  >
                    <View style={styles.userInfo}>
                      <View style={styles.user}>
                        {post.user?.avatar ? (
                          <Image
                            source={{
                              uri: post.user.avatar,
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
                        <Text style={{ flex: 1 }}>{post.user?.name}</Text>
                        <PostOptions
                          style={{ flex: 0.1 }}
                          postId={post.pid}
                          isOwner={isOwner} // Kiểm tra xem người dùng hiện tại có phải là chủ bài viết
                          onEdit={() =>
                            handleEditPost(
                              post.pid,
                              post.pdesc,
                              JSON.parse(post.pimage)
                            )
                          } // Hàm sửa bài viết
                          onDelete={() => handleDeletePost(post.pid)} // Hàm xóa bài viết
                          onSave={() => handleSavePost(post.pid)} // Hàm lưu bài viết
                          onHide={() => handleHidePost(post.pid)} // Hàm ẩn bài viết
                          onPrivacyChange={(permission) =>
                            handleChangePrivacy(post.pid, permission)
                          } // Hàm thay đổi quyền riêng tư
                        />
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
                          <Text style={styles.cardDesc}>{post.pdesc}</Text>
                        )}
                        {post.pimage && (
                          <ScrollView
                            contentContainerStyle={styles.containerImage}
                          >
                            <View style={styles.gridContainer}>
                              {post.pimage &&
                              Array.isArray(JSON.parse(post.pimage)) ? (
                                JSON.parse(post.pimage).length === 1 ? (
                                  <Image
                                    key={0}
                                    source={{ uri: JSON.parse(post.pimage)[0] }}
                                    style={styles.cardImage}
                                  />
                                ) : (
                                  <Swiper
                                    loop={true}
                                    autoplay={false}
                                    showsButtons={true}
                                    style={styles.wrapper}
                                  >
                                    {JSON.parse(post.pimage).map(
                                      (item, index) => (
                                        <View key={index} style={styles.slide}>
                                          <Image
                                            source={{ uri: item }}
                                            style={styles.image}
                                          />
                                        </View>
                                      )
                                    )}
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
                  </TouchableOpacity>
                  <View style={styles.cardStats}>
                    {/* Likes, Comments, and Shares Counters */}
                    <View style={styles.statRow}>
                      <Text style={styles.statText}>
                        {post.plike} lượt thích
                      </Text>
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
                      <Text style={styles.statText}>
                        {post.pcomment} bình luận
                      </Text>
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
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0066ff",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 5,
  },
  icon: {
    marginHorizontal: 5,
  },
  notificationIcon: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  notificationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  postInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postInput: {
    flex: 1,
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  cardContainer: {
    padding: 10,
  },
  card: {
    marginBottom: 20,
    borderColor: "#ccc",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
    paddingBottom: 10,
    padding: 15,
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
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 16,
    marginBottom: 10,
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
  menuContainer: {
    position: "absolute",
    right: 130,
    top: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  menuItemText: {
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
  storyContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    right: 10,
  },
  storyCard: {
    width: 100,
    marginVertical: 10,
    alignItems: "center",
    marginHorizontal: 10,
  },
  storyCardImage: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  storyCardText: {
    marginTop: 5,
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

export default HomeScreen;
