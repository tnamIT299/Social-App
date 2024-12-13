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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getUserId, getUserAvatar } from "../../data/getUserData";
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
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [modalSearchVisible, setModalSearchVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const navigation = useNavigation();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const avatar = await getUserAvatar();
        const userId = await getUserId();
        setUserId(userId);
        setAvatarUrl(avatar || "https://via.placeholder.com/150"); 
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      }
    };
    fetchUserData();
  }, []);

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

  const toggleSearchMenu = () => {
    setSearchModalVisible(!isSearchModalVisible);
  };

  const handleOpenAddModal = (event) => {
    const { pageY, pageX } = event.nativeEvent;
    const windowWidth = Dimensions.get("window").width;

    setModalPosition({
      top: pageY + 10,
      right: windowWidth - pageX - 10,
    });
    setModalAddVisible(true);
  };

  const handleOpenSearchModal = (event) => {
    const { pageY, pageX } = event.nativeEvent;
    const windowWidth = Dimensions.get("window").width;

    setModalPosition({
      top: pageY + 10,
      right: windowWidth - pageX - 10,
    });
    setModalSearchVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Loopy</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={(event) => handleOpenAddModal(event)}>
            <Ionicons
              name="add-circle-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>

          {/* Options Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalAddVisible}
            onRequestClose={() => setModalAddVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => setModalAddVisible(false)}
            >
              <View
                style={[
                  styles.modalContent,
                  { top: modalPosition.top, right: modalPosition.right },
                ]}
              >
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => navigation.navigate("CreatePost")}
                >
                  <Ionicons
                    name="create-outline"
                    size={24}
                    color="black"
                    style={styles.iconButton}
                  />
                  <Text style={styles.optionText}>Tạo bài viết</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons
                    name="crop-outline"
                    size={24}
                    color="black"
                    style={styles.iconButton}
                  />
                  <Text style={styles.optionText}>Tạo tin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons
                    name="film-outline"
                    size={24}
                    color="black"
                    style={styles.iconButton}
                  />
                  <Text style={styles.optionText}>Tạo ShortVideo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons
                    name="videocam-outline"
                    size={24}
                    color="black"
                    style={styles.iconButton}
                  />
                  <Text style={styles.optionText}>Tạo Livestream</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <TouchableOpacity onPress={(event) => handleOpenSearchModal(event)}>
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
            visible={modalSearchVisible}
            onRequestClose={() => setModalSearchVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => setModalSearchVisible(false)}
            >
              <View
                style={[
                  styles.modalContent,
                  { top: modalPosition.top, right: modalPosition.right },
                ]}
              >
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={handleSearchUser}
                >
                  <Ionicons
                    name="locate-outline"
                    size={24}
                    color="black"
                    style={styles.iconButton}
                  />
                  <Text style={styles.optionText}>Tìm kiếm người dùng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={handleSearchPost}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color="black"
                    style={styles.iconButton}
                  />
                  <Text style={styles.optionText}>Tìm kiếm bài viết</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.notificationIcon}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("MessageSummary", {
                  screen: "MessageSummaryTab",
                  params: {
                    userId: userId,
                  },
                })
              }
            >
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
    right: 50,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    position: "absolute",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    width: 190,
    zIndex: 999,
  },
  optionItem: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  optionText: {
    color: "black",
    fontSize: 15,
    marginLeft: 10,
  },
});

export default HomeScreen;
