import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  headerBack: {
    marginTop: 10,
    marginBottom: 5,
  },
  profileSection: {
    flex: 1,
  },
  headerSection: {
    alignItems: "center",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: 200,
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: "absolute",
    top: 160,
    left: "50%",
    marginLeft: -50,
    borderWidth: 2,
    borderColor: "#000000",
  },
  usernameIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the content horizontally
    width: "100%",
    marginTop: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1, // Take up remaining space
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 60,
    marginLeft: 10,
  },
  iconRight: {
    position: "absolute",
    right: 15, // Adjust as needed for padding
    top: 10,
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
    margin: 10,
    width: 150,
    zIndex: 999, // Make sure it's on top
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  optionText: {
    color: "black",
    fontSize: 14,
    marginLeft: 5,
  },
  info: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoSection: {
    padding: 10,
  },
  PostSection: {
    marginLeft: -10,
    marginRight: -10,
  },
  ReelSection: {
    marginLeft: 10,
    marginRight: 10,
  },
  infoContainer: {
    alignItems: "flex-start",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 10,
    paddingLeft: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "black",
  },
  iconModal: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "black",
  },
  optionList: {
    padding: 20,
  },
  optionButton: {
    paddingVertical: 10,
  },
  text: {
    paddingBottom: 5,
  },
  SectionContainer: {
    flexDirection: "row",
    marginBottom: 20,
    marginLeft: 10,
  },
  button: {
    marginRight: 5,
    paddingVertical: 5, // Tăng độ cao cho nút
    paddingHorizontal: 5, // Tăng độ rộng cho nút
    borderRadius: 5, // Bo tròn viền giống nút Android
    alignItems: "center", // Canh giữa văn bản trong nút
    justifyContent: "center", // Canh giữa văn bản trong nút
    elevation: 2, // Tạo hiệu ứng bóng đổ nhẹ (giống Android)
    shadowColor: "#000", // Màu bóng đổ
    shadowOpacity: 0.1, // Độ mờ của bóng
    shadowRadius: 5, // Độ mờ của bóng
    shadowOffset: { width: 0, height: 4 }, // Vị trí bóng
    width: 80, // Chiều rộng cố định
    height: 45, // Chiều cao cố định
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold", // Để in đậm hơn
  },
  reelsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Giữa các video
  },
  reelItem: {
    width: "32%", // Điều chỉnh kích thước của mỗi reel (sử dụng 48% để có 2 cột)
    alignItems: "center", // Căn giữa nội dung của mỗi reel
  },
  videoContainer: {
    width: "100%", // Đảm bảo container chiếm toàn bộ chiều rộng của reel
    height: 200, // Chiều cao container video
    backgroundColor: "black", // Nền đen cho phần còn trống
    justifyContent: "center",
    alignItems: "center", // Căn giữa video trong container
    marginBottom: 5, // Khoảng cách giữa video và tiêu đề
  },
  reelVideo: {
    width: "100%", // Đảm bảo video chiếm toàn bộ chiều rộng của item
    height: "100%", // Chiều cao video chiếm toàn bộ chiều cao của container
  },
  reelText: {
    textAlign: "center",
    marginTop: 5,
  },
  overlay: {
    position: "absolute",
    bottom: 10,
    padding: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reelInfoContainer: {
    flexDirection: "row",
    alignItems: "center", // Căn giữa icon và text
    margin: 5, // Khoảng cách giữa các dòng icon-text
  },
  reelInfo: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 5, // Khoảng cách giữa icon và text
  },
  postInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  postInput: {
    flex: 1,
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
});
  export default styles;