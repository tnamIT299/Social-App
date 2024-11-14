import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      backgroundColor: "#fff",
      elevation: 2,
    },
    headerTextContainer: {
      flexDirection: "column",
    },
    lastActiveText: {
      fontSize: 12,
      marginLeft:10,
      color: "gray",
    },
    headerBack: {
      marginRight: 10,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    headerTitle: {
      marginLeft: 10,
      fontSize: 18,
      color: "red",
    },
    headerIcons: {
      flexDirection: "row",
    },
    icon: {
      marginHorizontal: 10,
    },
    messageList: {
      flex: 1,
      paddingHorizontal: 10,
    },
    messageContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
    },
    senderContainer: {
      justifyContent: "flex-end",
    },
    receiverContainer: {
      justifyContent: "flex-start",
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    messageBubbleContainer: {
      flexDirection: "column",
      alignItems: "flex-end",
      maxWidth: "80%",
    },
    senderBubbleContainer: {
      alignSelf: "flex-end",
    },
    receiverBubbleContainer: {
      alignSelf: "flex-start",
    },
    messageBubble: {
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      maxWidth: "auto",
    },
    senderBubble: {
      backgroundColor: "#a0e7ff",
      marginRight: 10,
    },
    receiverBubble: {
      backgroundColor: "#e0e0e0",
      marginLeft: 10,
    },
    messageText: {
      fontSize: 16,
    },
    messageImage: {
      width: 200,
      height: 200,
      borderRadius: 10,
    },
    senderText: {
      color: "#000",
    },
    receiverText: {
      color: "#333",
    },
    timeText: {
      // Thêm class này để hiển thị thời gian
      fontSize: 12,
      color: "#999",
      alignSelf: "flex-end",
      marginTop: 5,
      marginRight: 10,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      backgroundColor: "#fff",
      borderTopWidth: 1,
      borderTopColor: "#ddd",
    },
    input: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      paddingHorizontal: 15,
      backgroundColor: "#f0f0f0",
    },
    iconSend: {
      marginHorizontal: 5,
    },
    imagePreviewContainer: {
      flexDirection: "row",
      padding: 10,
      height: 100,
      width: "100%",
      marginBottom: 15,
    },
    imagePreviewWrapper: {
      position: "relative",
      marginRight: 10,
      
    },
    imagePreview: {
      width: 60,
      height: 60,
      borderRadius: 10,
    },
    deleteButton: {
      position: "absolute",
      top: 5,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 15,
      padding: 5,
    },
    deleteButtonText: {
      color: "white",
      fontWeight: "bold",
    },
    selectedImage: {
      width: 100, // Đặt kích thước nhỏ hơn cho mỗi ảnh nếu hiển thị nhiều ảnh
      height: 100,
      borderRadius: 10,
      marginRight: 10,
    },
    multiImageContainer: {
      flexDirection: "row",
      height: 100,
      width: 100,
    },
    multiSelectedImage: {
      width: 100, // Chiều rộng cho mỗi ảnh
      height: 100, // Chiều cao tùy chọn
      borderRadius:10,
    },
    imageWrapper: {
      position: "relative",
      marginRight: 10,
    },
  });

  export default styles;