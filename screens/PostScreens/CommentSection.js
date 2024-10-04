import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Đảm bảo bạn đã cài đặt @expo/vector-icons
import dayjs from "dayjs"; // Đảm bảo bạn đã cài đặt dayjs
import { handlePostDetailScreen, handleSendComment } from "./PostFunctions";

const CommentSection = ({
  postId,
  initialComments,
  setComments,
  userName,
  userAvatar,
  navigation,
}) => {
  const [comments, setLocalComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState("");

  // Cập nhật comments khi nhận được props mới
  useEffect(() => {
    if (initialComments && initialComments.length !== comments.length) {
      setLocalComments(initialComments);
    }
  }, [initialComments]);

  const handleComment = async () => {
    //console.log("Bắt đầu gửi bình luận:", newComment); // In ra bình luận đang gửi

    if (newComment.trim()) {
      try {
        const addedComment = await handleSendComment(
          newComment,
          postId,
          userName,
          userAvatar,
          setComments,
          setNewComment
        );

        //console.log("Bình luận đã được thêm:", addedComment); // In ra bình luận vừa thêm

        if (addedComment) {
          // Cập nhật comments nội bộ
          setLocalComments((prevComments) => [...prevComments, addedComment]);
          // console.log("Danh sách bình luận sau khi thêm:", [
          //   ...comments,
          //   addedComment,
          // ]); // In ra danh sách bình luận sau khi thêm
          setNewComment(""); // Xóa input sau khi gửi
        } else {
          console.warn("Không có bình luận nào được thêm."); // Cảnh báo nếu không có bình luận được thêm
        }
      } catch (error) {
        console.error("Lỗi khi gửi bình luận:", error); // In ra lỗi nếu có
      }
    } else {
      console.warn("Bình luận không hợp lệ (trống)."); // Cảnh báo nếu bình luận trống
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Comments */}
        <View style={styles.commentsContainer}>
          <Text style={styles.titleComment}>Bình luận</Text>
          {comments.length > 0 ? (
            comments.slice(0, 2).map((comment) => (
              <View key={comment.cid} style={styles.commentCard}>
                <View style={{ flexDirection: "row" }}>
                  <Image
                    source={{
                      uri:
                        comment.User?.avatar ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.contentContainer}>
                    <Text style={styles.userName}>{comment.User?.name}</Text>
                    <Text style={styles.commentText}>{comment.comment}</Text>
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

        {/* Xem thêm bình luận */}
        {comments.length > 2 && (
          <TouchableOpacity
            onPress={() => handlePostDetailScreen(navigation, postId)} // Thay thế bằng navigation logic
          >
            <Text style={styles.seeMoreText}>Xem thêm</Text>
          </TouchableOpacity>
        )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
  },
  commentBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    backgroundColor: "#f9f9f9",
  },
  seeMoreText: {
    color: "blue",
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
  },
});

export default CommentSection;
