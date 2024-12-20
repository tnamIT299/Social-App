import { StyleSheet,Dimensions } from "react-native";
const { width: screenWidth } = Dimensions.get("window");
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
      top: 20,
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    cardContainer: {
      flexDirection: "column",
      flex: 1,
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
      marginBottom: 5,
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
    cardStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statRow: {
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
    actionText2: {
      fontSize: 12,
      color: "#007AFF",
      marginRight: 15,
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
    noComments: {
      textAlign: "center",
      color: "#888",
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
    backButtonContainer: {
      position: "static",
      flexDirection: "row",
      backgroundColor: "#2F95DC",
      padding: 15,
    },
    titleview: {
      flex: 0.9,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
    },
    commentBox: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 15,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: "#ddd",
      backgroundColor: "#fff", // Đảm bảo khung comment luôn có màu nền
    },
    textInput: {
      flex: 1,
      marginRight: 10,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 20,
      paddingHorizontal: 15,
      height: 40,
      backgroundColor: "#f9f9f9", // Màu nền của khung nhập liệu
    },
  
    contentContainer: {
      flexDirection: "column",
      flex: 1,
      backgroundColor: "#f0f0f0",
      borderRadius: 10,
      padding: 10,
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
  
    replyInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      marginLeft: 50, // Canh lề cho input reply
    },
    replyInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 20,
      padding: 10,
      marginRight: 10,
    },
    sendButton: {
      color: "#007BFF",
      fontWeight: "bold",
    },
    replyContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
      marginLeft: 50,
    },
    replyContent: {
      marginLeft: 10,
    },
    replyText: {
      color: "#333",
    },
  });
  export default styles;