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
import { getUserId } from "../../data/getUserData";
import { handlePostDetailScreen, handleSendComment } from "./PostFunctions";
import styles from "./style/styleCommentSection";

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
          const userId = await getUserId();
          // Cập nhật comments nội bộ
          setLocalComments((prevComments) => [...prevComments, addedComment]);
          // console.log("Danh sách bình luận sau khi thêm:", [
          //   ...comments,
          //   addedComment,
          // ]); // In ra danh sách bình luận sau khi thêm
          setNewComment(""); // Xóa input sau khi gửi
          notifyCommentPost(userId, postId, setNewComment);
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



export default CommentSection;
