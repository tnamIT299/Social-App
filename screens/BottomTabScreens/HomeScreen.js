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
import "dayjs/locale/vi";
import styles from "./style/styleHome";

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
                <TouchableOpacity style={styles.optionItem} onPress={() => navigation.navigate("CreateReel")}>
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
        <TextInput onPress={() => navigation.navigate("CreatePost")} style={styles.postInput} placeholder="Bạn đang nghĩ gì ?" />
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

export default HomeScreen;
