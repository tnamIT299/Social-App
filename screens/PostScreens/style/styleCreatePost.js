import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#fff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    backButton: {
      fontSize: 18,
      color: "#007BFF",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    userInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    userName: {
      fontSize: 18,
      fontWeight: "bold",
    },
    postInput: {
      borderColor: "#ccc",
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      marginBottom: 20,
      height: 100,
      textAlignVertical: "top",
    },
    imagePickerButton: {
      backgroundColor: "#007BFF",
      padding: 10,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 20,
    },
    imagePickerText: {
      color: "#fff",
      fontSize: 16,
    },
    imagePreviewContainer: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      height: 200,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    selectedImage: {
      width: 200, // Đặt kích thước nhỏ hơn cho mỗi ảnh nếu hiển thị nhiều ảnh
      height: 200,
      borderRadius: 10,
      marginRight: 10,
    },
    noImageText: {
      color: "#ccc",
      fontSize: 16,
    },
    postButton: {
      backgroundColor: "#28a745",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
    postButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    },
    multiImageContainer: {
      flexDirection: "row", // Hiển thị ảnh theo hàng
      flexWrap: "wrap", // Cho phép bọc ảnh
      justifyContent: "space-between", // Căn giữa các ảnh
    },
    multiSelectedImage: {
      width: 100, // Chiều rộng cho mỗi ảnh
      height: 100, // Chiều cao tùy chọn
      marginBottom: 10, // Khoảng cách giữa các ảnh
    },
    imageWrapper: {
      position: "relative",
      marginRight: 10,
    },
    deleteButton: {
      position: "absolute",
      top: 5,
      right: 5,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 15,
      padding: 5,
    },
    deleteButtonText: {
      color: "white",
      fontWeight: "bold",
    },
  });
  export default styles;  