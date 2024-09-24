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
import PostScreen from "../PostScreens/PostScreen";
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
        const Id = await getUserId();
        setUserId(Id);
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default PostSearchScreen;
