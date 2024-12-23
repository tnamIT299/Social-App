import { StyleSheet } from "react-native";
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
  export default styles;