import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  avatarContainer: {
    position: "relative", // Container để định vị statusDot
    marginRight: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  headerTextContainer: {
    flexDirection: "column",
    flex: 0.8,
  },
  lastActiveText: {
    fontSize: 11,
    marginLeft: 5,
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
    fontSize: 16,
    marginLeft: 5,
  },
  headerIcons: {
    flexDirection: "row",
    flex: 0.7,
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
    //backgroundColor: "#a0e7ff",
    marginRight: 10,
  },
  receiverBubble: {
    //backgroundColor: "#a0e7ff",
    marginLeft: 10,
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    paddingVertical: 10,
  },
  senderText: {
    color: "#000",
  },
  receiverText: {
    color: "#333",
  },
  timeText: {
    fontSize: 12,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 5,
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
    borderRadius: 10,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  blockedMessageContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  blockedText: {
    fontSize: 13,
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  unblockButton: {
    padding: 10,
    backgroundColor: "#2F95DC",
    borderRadius: 5,
    marginTop: 10,
  },
  unblockText: {
    color: "#fff",
    fontWeight: "bold",
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
  statusDot: {
    position: "absolute",
    width: 15,
    height: 15,
    borderRadius: 7,
    bottom: 2, 
    right: 2,
    borderWidth: 2, 
    borderColor: "#fff",
  },
});

export default styles;
