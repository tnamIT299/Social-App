import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient"; // Ensure this path is correct

const PostDetailScreen = () => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const postId = route.params?.postId; // Get the post ID from route parameters

  const fetchPostDetails = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      // Fetch post details
      const { data: postData, error: postError } = await supabase
        .from("Post")
        .select("*")
        .eq("pid", postId)
        .single();

      if (postError) throw postError;

      // Fetch post's comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("Comment")
        .select("*, User(name, avatar)")
        .eq("pid", postId);

      if (commentsError) throw commentsError;

      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPostDetails();
    }, [postId])
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading post and comments...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text>Error fetching post and comments: {error}</Text>
        </View>
      ) : post ? (
        <ScrollView style={{ flex: 1 }}>
          {/* Post Details */}
          <View style={styles.postContainer}>
            <View style={styles.userInfo}>
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
              <View style={styles.user}>
                <Text style={styles.userName}>{post.user?.name}</Text>
              </View>
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
            <View style={styles.postStats}>
              <Text style={styles.statText}>{post.plike} lượt thích</Text>
              <Text style={styles.statText}>{post.pcomment} bình luận</Text>
              <Text style={styles.statText}>{post.pshare} chia sẻ</Text>
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentsContainer}>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <View key={comment.cid} style={styles.commentCard}>
                  <View style={styles.userInfo}>
                    {comment.user?.avatar ? (
                      <Image
                        source={{ uri: comment.user.avatar }}
                        style={styles.userAvatar}
                      />
                    ) : (
                      <Image
                        source={{ uri: "https://via.placeholder.com/150" }}
                        style={styles.userAvatar}
                      />
                    )}
                    <View style={styles.user}>
                      <Text style={styles.userName}>{comment.user?.name}</Text>
                      <Text style={styles.commentTime}>
                        {new Date(comment.timeStamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.commentText}>{comment.comment}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="heart-outline" size={16} color="black" />
                      <Text style={styles.actionText}>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={16}
                        color="black"
                      />
                      <Text style={styles.actionText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noComments}>No comments yet</Text>
            )}
          </View>

          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <Button title="Back" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  userInfo: {
    flexDirection: "row",
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
  statText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  commentsContainer: {
    padding: 15,
  },
  commentCard: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  commentText: {
    fontSize: 16,
    marginVertical: 5,
  },
  commentTime: {
    color: "#888",
    marginBottom: 5,
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
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
  noComments: {
    textAlign: "center",
    color: "#888",
  },
  backButtonContainer: {
    padding: 15,
  },
});

export default PostDetailScreen;
