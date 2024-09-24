import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  handleLike,
  isPostOwner,
  handleEditPost,
  handleDeletePost,
  handleSavePost,
  handleHidePost,
  handleChangePrivacy,
  handlePostDetailScreen,
} from "./PostFunctions";
import PostOptions from "../PostScreens/PostOptions";
import Swiper from "react-native-swiper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt

const { width: screenWidth } = Dimensions.get("window");
dayjs.extend(relativeTime);
dayjs.locale("vi");

const PostScreen = ({
  posts,
  loading,
  error,
  userId,
  navigation,
  setPosts,
  setLikedPosts,
  setLoading,
  setError, // Thêm setError vào đây
  fetchPosts,
}) => {
  return (
    <SafeAreaView style={styles.container}>
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
          {Array.isArray(posts) &&
            posts.map((post) => {
              const isOwner = isPostOwner(post.pid, userId, posts); // Kiểm tra xem người dùng hiện tại có phải là chủ bài viết không
              return (
                <View key={post.pid} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => handlePostDetailScreen(navigation, post.pid)}
                  >
                    <View style={styles.userInfo}>
                      <View style={styles.user}>
                        {post.user?.avatar ? (
                          <Image
                            source={{ uri: post.user.avatar }}
                            style={styles.userAvatar}
                          />
                        ) : (
                          <Image
                            source={{ uri: "https://via.placeholder.com/150" }}
                            style={styles.userAvatar}
                          />
                        )}
                        <Text style={{ flex: 1 }}>{post.user?.name}</Text>
                        <PostOptions
                          style={{ flex: 0.1 }}
                          postId={post.pid}
                          isOwner={isOwner}
                          onEdit={() =>
                            handleEditPost(
                              navigation,
                              post.pid,
                              post.pdesc,
                              JSON.parse(post.pimage)
                            )
                          }
                          onDelete={() =>
                            handleDeletePost(post.pid, setPosts, setLoading)
                          }
                          onSave={() => handleSavePost(post.pid)}
                          onHide={() => handleHidePost(post.pid)}
                          onPrivacyChange={(permission) =>
                            handleChangePrivacy(post.pid, permission)
                          }
                        />
                      </View>
                    </View>
                    <View style={styles.posttimeView}>
                      <Text style={styles.posttimeText}>
                        {dayjs(post.createdat).fromNow()}
                      </Text>
                    </View>
                    {post.pdesc && (
                      <Text style={styles.cardDesc}>{post.pdesc}</Text>
                    )}
                    {post.pimage && (
                      <View style={styles.containerImage}>
                        <View style={styles.gridContainer}>
                          {Array.isArray(JSON.parse(post.pimage)) &&
                          JSON.parse(post.pimage).length > 0 ? (
                            JSON.parse(post.pimage).length === 1 ? (
                              <Image
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
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.cardStats}>
                    <View style={styles.statRow}>
                      <Text style={styles.statText}>
                        {post.plike} lượt thích
                      </Text>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          handleLike(
                            post.pid,
                            post.likedByUser,
                            post.plike,
                            setPosts,
                            setLikedPosts,
                            setLoading,
                            setError
                          )
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
                        // onPress={handleComment} // Thêm logic bình luận nếu cần
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
                        // onPress={handleShare} // Thêm logic chia sẻ nếu cần
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  user: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
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
    top: 10,
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 10,
  },
  statText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  actionText: {
    marginLeft: 5,
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
  posttimeText: {
    color: "gray",
    size: 20,
  },
  posttimeView: {
    left: 48,
    bottom: 10,
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

export default PostScreen;
