import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import PostScreen from "../PostScreens/PostScreen";
import { getUserId } from "../../data/getUserData";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient"; // Kết nối Supabase

const PostSearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (searchQuery) {
      fetchPosts(searchQuery);
    } else {
      setPosts([]); // Không hiển thị bài viết khi không có query
    }
  }, [searchQuery]);

  const fetchPosts = async (query) => {
    setLoading(true);
    try {
      // Truy vấn các bài viết từ bảng Post có mô tả chứa từ khóa tìm kiếm
      const { data: postsData, error: postsError } = await supabase
        .from("Post")
        .select("*")
        .ilike("pdesc", `%${query}%`) // Tìm kiếm bài viết có phần mô tả chứa từ khóa
        .eq("permission", "cộng đồng");

      if (postsError) throw new Error(postsError.message);

      // Kiểm tra nếu không có bài viết nào
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      const Id = await getUserId();
      setUserId(Id);

      const updatedPosts = await Promise.all(
        postsData.map(async (post) => {
          const { data: userData, error: userError } = await supabase
            .from("User")
            .select("uid, name, avatar")
            .eq("uid", post.uid)
            .single();

          if (userError) throw new Error(userError.message);

          const { data: likeData, error: likeError } = await supabase
            .from("Like")
            .select("status")
            .eq("post_id", post.pid)
            .eq("user_id", userId)
            .maybeSingle();

          if (likeError) throw new Error(likeError.message);

          const likedByUser = likeData ? likeData.status : false;

          return {
            ...post,
            user: userData,
            likedByUser,
          };
        })
      );

      // Sắp xếp bài viết theo ngày tạo
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.boxSearch}
          placeholder="Tìm kiếm bài viết..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView>
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
    paddingTop: 45, // Để tạo khoảng cách từ trên cùng
    justifyContent: "center", // Căn giữa ngang
    alignItems: "center", // Căn giữa dọc
    paddingHorizontal: 15,
  },
  boxSearch: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 40,
    width: "90%",
    alignSelf: "center", // Căn giữa thanh tìm kiếm
  },
});

export default PostSearchScreen;
