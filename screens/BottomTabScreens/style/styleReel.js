import { StyleSheet, Dimensions } from "react-native";
const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    logoContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute', // Đặt logo ở vị trí tuyệt đối
      left: 0,
      right: 0,
    },
    logo: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#0066ff',
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginHorizontal: 5,
    },
    reloadButton: {
      marginLeft: 10,
    },
    list: {
      backgroundColor: 'black',
    },
    reelContainer: {
      marginBottom: 80,
    },
    videoContainer: {
      width: width,
      height: height * 0.85,
      position: 'relative',
    },
    video: {
      width: width,
      height: height * 0.85,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 50,
      marginVertical: -5,
      marginHorizontal: -10,
    },
    reelname: {
      position: 'absolute',
      fontSize: 20, // Kích thước chữ cho tiêu đề
      fontWeight: 'bold', // In đậm để nổi bật
      color: 'white', // Màu chữ
      textAlign: 'left', // Căn trái
      bottom: 130, // Cách đáy video một khoảng
      left: 10, // Căn lề bên trái
    },
    reelDesc: {
      fontSize: 16, // Kích thước chữ cho mô tả
      color: 'white', // Màu chữ
      textAlign: 'left', // Căn trái
      lineHeight: 20, // Dòng cách dòng (giúp nội dung dễ đọc)
      bottom: 130, // Cách đáy video một khoảng
      left: 10, // Căn lề bên trái
    },
    playPauseButton: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -25 }, { translateY: -25 }],
    },
    volumeButton: {
      position: 'absolute',
      top: 10,
      left: 10,
    },
    seekButton: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -80 }, { translateY: 0 }],
    },
    seekButton1: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: 70 }, { translateY: 0 }],
    },
    actionsContainer: {
      position: 'absolute',
      right: -10, // Căn sát mép phải (10px cách mép)
      top: '50%', // Vị trí ở giữa màn hình theo chiều dọc
      flexDirection: 'column',
      justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
      alignItems: 'center', // Căn giữa nội dung theo chiều ngang
      padding: 10,
    },
    actionButton: {
      marginHorizontal: 15,
      marginVertical: -55,
    },
    slider: {
      position: 'absolute',
      width: width,
      height: 40,
      bottom: -10,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginRight: 20,
      bottom: 40,
    },
    slidertimeText: {
      color: 'white',
      padding: 5,
    },
    separator: {
      marginHorizontal: 5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
    },
    likeCount: {
      color: 'white',
      fontSize: 14,
      textAlign: 'center',
    },
    commentCount: {
      color: 'white',
      fontSize: 14,
      textAlign: 'center',
    },
    commentHeader: {
      marginBottom: 10,
    },
    modalOverlay: {
      position: 'absolute', // Đảm bảo Modal nằm ở vị trí tuyệt đối
      bottom: 0, // Đặt Modal ở dưới cùng
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Màu nền mờ
      justifyContent: 'flex-end', // Căn giữa Modal theo chiều dọc ở dưới cùng
      alignItems: 'center', // Căn giữa Modal theo chiều ngang
      marginVertical: 80,
  
    },
    modalContent: {
      backgroundColor: 'white',
      width: width * 0.95, // Chiều rộng Modal chiếm toàn bộ chiều rộng màn hình
      height: height * 0.6, // Chiều cao chiếm 70% chiều cao màn hình
      padding: 10,
      borderRadius: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    commentContainer: {
      flexDirection: 'row', // Sắp xếp theo chiều ngang
      alignItems: 'center', // Căn giữa avatar và phần text
      marginBottom: 15, // Khoảng cách giữa các bình luận
    },
    comment: {
      flex: 1, // Đảm bảo phần bình luận chiếm toàn bộ không gian còn lại
      borderBottomWidth: 1, // Đường viền dưới nhẹ nhàng hơn
      borderBottomColor: '#eee', // Màu viền nhạt hơn
      backgroundColor: '#fff', // Nền sáng hơn
      borderRadius: 10, // Giảm bo góc để tạo sự chuyên nghiệp
      padding: 12, // Tăng padding để thoáng hơn
      shadowColor: '#000', // Tạo hiệu ứng đổ bóng
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2, // Hiệu ứng nổi trên Android
    },
    avatar: {
      width: 50, // Tăng kích thước avatar cho rõ hơn
      height: 50,
      borderRadius: 25, // Đảm bảo avatar tròn
      marginRight: 10, // Tăng khoảng cách với phần text
      borderWidth: 1, // Thêm viền để avatar nổi bật
      borderColor: '#ccc',
    },
    commentText: {
      fontSize: 15, // Tăng kích thước chữ
      color: '#444', // Màu chữ dễ đọc hơn
      marginBottom: 5, // Giữ khoảng cách giữa tên người dùng và nội dung
      lineHeight: 20, // Tăng khoảng cách dòng
    },
    userName: {
      fontWeight: '600', // Đậm nhẹ hơn
      fontSize: 16, // Giữ kích thước chữ
      color: '#222', // Đậm màu hơn để nổi bật
    },
    inputContainer: {
      flexDirection: 'row', // Đặt trường input và nút gửi trên cùng một hàng
      alignItems: 'center', // Căn giữa theo chiều dọc
      marginTop: 15,
      width: '100%',
    },
    commentInput: {
      height: 40,
      flex: 1, // Đảm bảo trường nhập chiếm toàn bộ không gian còn lại
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
    },
    submitButton: {
      backgroundColor: '#007bff',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginLeft: 10, // Khoảng cách giữa input và icon
    },
    closeButton: {
      position: 'absolute',
      top: 10, // Khoảng cách từ trên cùng
      left: width * 0.87, // Khoảng cách từ bên phải
      zIndex: 1, // Đảm bảo nút nằm trên các phần tử khác trong modal
      color: 'black', // Màu sắc của nút
    },
    rowContainer: {
      flexDirection: 'row', // Sắp xếp các phần tử theo hàng ngang
      alignItems: 'center', // Căn giữa theo chiều dọc
    },
    timeText: {
      fontSize: 12, // Kích thước chữ thời gian
      color: '#777', // Màu chữ cho thời gian (nhạt hơn)
    },
    replyText: {
      fontSize: 14, // Cỡ chữ giống timeText
      color: 'black', // Màu chữ (có thể chọn màu nhấn)
      right: -10,
    },
    replyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    replyInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontSize: 14,
      backgroundColor: '#fff',
    },
    closeInputButton: {
      marginLeft: 10,
      padding: 5,
      backgroundColor: '#f44336', // Màu đỏ để biểu thị đóng
      borderRadius: 5,
    },
    closeButtonText: {
      color: 'white',
      fontSize: 14,
    },
    sendButton: {
      marginLeft: 8,
      backgroundColor: '#007BFF',
      paddingLeft: 10,
      paddingRight: 10,
      marginRight: 20,
      paddingBottom: 5,
      paddingTop: 5,
      borderRadius: 8,
    },
    notificationBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: 'red',
      borderRadius: 15,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });
  export default styles;