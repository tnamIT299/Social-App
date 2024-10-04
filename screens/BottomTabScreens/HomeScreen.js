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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getUserId } from "../../data/getUserData";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import PostScreen from "../PostScreens/PostScreen";
import { fetchPosts } from "../PostScreens/PostFunctions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt

dayjs.extend(relativeTime);
dayjs.locale("vi");

const HomeScreen = () => {
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const navigation = useNavigation();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchUserAvatar = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      const Id = await getUserId();
      setUserId(Id);

      if (user) {
        const { data, error } = await supabase
          .from("User")
          .select("avatar")
          .eq("uid", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data: ", error);
        } else {
          setAvatarUrl(data.avatar); // Lưu URL avatar vào state
        }
      }
    };
    fetchUserAvatar();
  }, []);

  const handleCreatePost = () => {
    toggleAddMenu(); // Đóng menu
    navigation.navigate("CreatePost"); // Điều hướng đến màn hình CreatePost
  };

  const handleSearchUser = () => {
    toggleSearchMenu(); // Đóng menu
    navigation.navigate("UserSearchScreen"); // Điều hướng đến màn hình tìm kiếm người dùng
  };

  const handleSearchPost = () => {
    toggleSearchMenu(); // Đóng menu
    navigation.navigate("PostSearchScreen"); // Điều hướng đến màn hình tìm kiếm bài viết
  };

  useFocusEffect(
    useCallback(() => {
      const loadPosts = async () => {
        setLoading(true);
        try {
          // Gọi hàm fetchPosts và truyền các hàm setPosts, setLoading, setError vào
          await fetchPosts(setPosts, setLoading, setError);
        } catch (error) {
          console.error("Error fetching posts:", error);
        } finally {
          setLoading(false);
        }
      };
      loadPosts();
    }, [])
  );

  const toggleAddMenu = () => {
    setAddModalVisible(!isAddModalVisible);
  };

  const toggleSearchMenu = () => {
    setSearchModalVisible(!isSearchModalVisible);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Loopy</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={toggleAddMenu}>
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
            visible={isAddModalVisible}
            onRequestClose={toggleAddMenu}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={toggleAddMenu}
            >
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

          <TouchableOpacity onPress={toggleSearchMenu}>
            <Ionicons
              name="search-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>

          <Modal
            animationType="fade"
            transparent={true}
            visible={isSearchModalVisible}
            onRequestClose={toggleSearchMenu}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={toggleSearchMenu}
            >
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSearchUser}
                >
                  <Text>Tìm kiếm người dùng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSearchPost}
                >
                  <Text>Tìm kiếm bài viết</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

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
          source={{ uri: avatarUrl || "https://via.placeholder.com/150" }}
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

        <PostScreen
          posts={posts}
          loading={loading}
          error={error}
          userId={userId}
          navigation={navigation}
          setPosts={setPosts}
          setLikedPosts={setLikedPosts}
          setLoading={setLoading}
          setError={setError}
          fetchPosts={fetchPosts}
        />
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
  menuContainer: {
    position: "absolute",
    right: 0,
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
  storyContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
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
});

export default HomeScreen;
