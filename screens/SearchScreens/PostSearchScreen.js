import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient"; // Kết nối Supabase

const PostSearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (searchQuery) {
      fetchPosts(searchQuery);
    } else {
      setPosts([]); // Không hiển thị bài viết khi không có query
    }
  }, [searchQuery]);

  const fetchPosts = async (query) => {
    try {
      // Truy vấn các bài viết từ bảng Post
      let { data, error } = await supabase
        .from("Post")
        .select("pid, pdesc, plike, pcomment, pshare, uid, permission")
        .ilike("pdesc", `%${query}%`); // Tìm kiếm bài viết có phần mô tả chứa từ khóa

      if (error) {
        console.error("Lỗi khi lấy danh sách bài viết:", error);
      } else {
        // Kết hợp với dữ liệu người dùng từ bảng User
        const postsWithAuthor = await Promise.all(
          data.map(async (post) => {
            const { data: userData, error: userError } = await supabase
              .from("User")
              .select("name")
              .eq("uid", post.uid)
              .single();

            if (userError) {
              console.error("Lỗi khi lấy thông tin người dùng:", userError);
            }

            return {
              ...post,
              author: userData ? userData.name : "Unknown",
              time: "1 giờ trước", // Giả định cho ví dụ này
            };
          })
        );
        setPosts(postsWithAuthor);
      }
    } catch (error) {
      console.error("Lỗi kết nối Supabase:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm bài viết..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView>
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
                        <View contentContainerStyle={styles.containerImage}>
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
                        </View>
                      )}
                    </>
                  ) : null}
                </TouchableOpacity>
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
      </ScrollView>
    </View>
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
    top: 10,
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

export default PostSearchScreen;
