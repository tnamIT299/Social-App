import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient";
import { Video } from 'expo-av';
import { createStackNavigator } from "@react-navigation/stack";
import PostScreen from "../PostScreens/PostScreen";
import { fetchPostsUser } from "../PostScreens/PostFunctions";
import { handleRemoveFriend } from "../FriendScreens/FriendFunction";
const Stack = createStackNavigator();
const ProfileTab = () => {
  const route = useRoute();
  const { userId } = route.params; // Lấy uid từ params
  const [username, setUsername] = useState("Loading...");
  const [avatarUrl, setAvatarUrl] = useState("https://via.placeholder.com/150");
  const [coverUrl, setCoverUrl] = useState(
    "https://via.placeholder.com/400x300"
  );
  const [phone, setPhone] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [job, setJob] = useState("Loading...");
  const [address, setAddress] = useState("Loading...");
  const [workplace, setWorkplace] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFriend, setIsFriend] = useState(false); // Khởi tạo isFriend là false ban đầu
  const [isFriendAdded, setIsFriendAdded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [reels, setReels] = useState([]);  // Dữ liệu các reel
  const [playingIndex, setPlayingIndex] = useState(null);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const [activeSection, setActiveSection] = useState('post'); // Trạng thái của mục đang hiển thị

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("User")
      .select("avatar, name, cover, phone, email, job, address, workplace")
      .eq("uid", userId)
      .single();

    if (error) {
      console.error("Error fetching user data: ", error);
    } else {
      setUsername(data.name || "Unknown User");
      setAvatarUrl(data.avatar || "https://via.placeholder.com/150");
      setCoverUrl(data.cover || "https://via.placeholder.com/400x300");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setJob(data.job || "");
      setAddress(data.address || "");
      setWorkplace(data.workplace || "");
    }

    const { data: friendships } = await supabase
      .from("Friendship")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (friendships && friendships.length > 0) {
      setIsFriend(true);
    }

    const { data: friendshipsByCurrentUser } = await supabase
      .from("Friendship")
      .select("*")
      .eq("status", "pending")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (friendshipsByCurrentUser && friendshipsByCurrentUser.length > 0) {
      setIsFriendAdded(true);
    }

    // Lấy dữ liệu reel của người dùng
    const { data: reels, error: reelError } = await supabase
      .from("Reels")
      .select("*")  // Lọc các trường bạn cần
      .eq("uid", userId);  // Lọc theo user_id

    if (reelError) {
      console.error("Error fetching reels: ", reelError);
    } else {
      setReels(reels);  // Lưu dữ liệu reels vào state
    }

    setLoading(false);
  };

  // Hàm tải bài viết của người dùng
  const loadPosts = async () => {
    try {
      setLoading(true);
      await fetchPostsUser(userId, setPosts, setLoading, setError);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu user và bài viết khi vào trang
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      loadPosts(); // Tải bài viết ngay khi màn hình được focus
      setModalVisible(false);
    }, [userId])
  );

  useEffect(() => {
    fetchUserData(); // Tải dữ liệu lần đầu khi trang được render 
  }, [userId]);

  useEffect(() => {
    // Kiểm tra nếu có tham số activeSection từ route.params
    if (route.params?.activeSection) {
      setActiveSection(route.params.activeSection); // Đặt activeSection theo giá trị truyền vào
    }
  }, [route.params?.activeSection]); // Chạy lại khi tham số activeSection thay đổi


  const handleOpenModal = (event) => {
    const { pageY, pageX } = event.nativeEvent;
    const windowWidth = Dimensions.get("window").width;

    setModalPosition({
      top: pageY + 10,
      right: windowWidth - pageX - 10,
    });
    setModalVisible(true);
  };

  const handleFriendModal = (event) => {

    const { pageY, pageX } = event.nativeEvent; // Lấy tọa độ của sự kiện
    const windowWidth = Dimensions.get("window").width; // Lấy chiều rộng cửa sổ

    // Tính toán vị trí modal
    setModalPosition({
      top: pageY + 10, // Vị trí của modal dưới nút bạn bè, có thể thay đổi giá trị tùy chỉnh
      left: pageX - 80, // Căn chỉnh modal về bên trái so với vị trí của nút
    });
    setFriendModalVisible(true);
  };

  const removeFriend = async () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn hủy kết bạn?",
      [
        {
          text: "Không",
          style: "cancel",
        },
        {
          text: "Có",
          onPress: async () => {
            try {
              const result = await handleRemoveFriend(userId);
              if (result.success) {
                Alert.alert("Thành công", "Đã xóa quan hệ bạn bè");
                setIsFriend(false);
                setFriendModalVisible(false);
                fetchUserData();
              } else {
                Alert.alert("Lỗi", result.error || "Đã xảy ra lỗi");
              }
            } catch (error) {
              Alert.alert("Lỗi", "Đã xảy ra lỗi khi xóa bạn bè");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const goToChatScreen = () => {
    navigation.navigate('Message', { avatar: avatarUrl, name: username, uid: userId });
  };

  const handleAddFriend = async () => {
    try {
      if (!currentUserId) {
        console.error("Người dùng hiện tại không tồn tại.");
        return;
      }

      // Kiểm tra xem người nhận có đã gửi lời mời kết bạn cho mình chưa
      const { data: receivedRequests } = await supabase
        .from("Friendship")
        .select("*")
        .eq("requester_id", userId)
        .eq("receiver_id", currentUserId)
        .eq("status", "pending");

      if (receivedRequests.length > 0) {
        // Nếu người nhận đã gửi lời mời kết bạn, thông báo cho người dùng
        console.log("Người này đã gửi lời mời kết bạn cho bạn.");
        alert("Người này đã gửi lời mời kết bạn cho bạn.");
        return;
      }

      // Kiểm tra xem người dùng đã gửi lời mời kết bạn cho người nhận chưa
      const { data: existingRequests } = await supabase
        .from("Friendship")
        .select("*")
        .eq("requester_id", currentUserId)
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (existingRequests.length > 0) {
        console.log("Lời mời kết bạn đã được gửi.");
        alert("Lời mời kết bạn đã được gửi.");
        return;
      }

      // Thêm lời mời kết bạn mới vào bảng Friendship với status là "pending"
      await supabase.from("Friendship").insert({
        requester_id: currentUserId,
        receiver_id: userId,
        status: "pending",
      });

      console.log("Lời mời kết bạn đã được gửi thành công.");
      alert("Lời mời kết bạn đã được gửi thành công.");
      setIsFriendAdded(true);

    } catch (error) {
      console.error("Đã xảy ra lỗi:", error.message || error);
    }
  };

  const handleUndo = async () => {
    try {
      const { error } = await supabase
        .from("Friendship")
        .delete()
        .match({
          requester_id: currentUserId,
          receiver_id: userId,
          status: "pending",
        });

      if (error) {
        throw error;
      }

      setIsFriendAdded(false);
      alert("Đã hoàn tác yêu cầu kết bạn.");
    } catch (error) {
      console.error("Lỗi khi hoàn tác thêm bạn:", error.message);
    }
  };
  const handleSectionChange = (section) => {
    setActiveSection(section);  // Cập nhật activeSection khi người dùng nhấn vào một nút
  };
  const handlePlayVideo = (index) => {
    setPlayingIndex(index);  // Cập nhật video đang phát
  };



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ marginBottom: 10 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <View style={styles.profileSection}>
            <View style={styles.headerSection}>
              <Image source={{ uri: coverUrl }} style={styles.coverImage} />
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <View style={styles.usernameIconContainer}>
                {userId === currentUserId && ( // Kiểm tra xem uid có trùng với currentUserId không
                  <TouchableOpacity
                    style={styles.iconRight}
                    onPress={(event) => handleOpenModal(event)}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={24}
                      backgroundcolor="black"
                    />
                  </TouchableOpacity>
                )}
                <Text style={styles.username}>{username}</Text>
              </View>
            </View>
            {/* Options Modal */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => setModalVisible(false)}
              >
                <View
                  style={[
                    styles.modalContent,
                    { top: modalPosition.top, right: modalPosition.right },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() =>
                      navigation.navigate("EditProfileScreen", {
                        screen: "EditProfileScreenTab",
                        params: {
                          uid: currentUserId,
                        },
                      })
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={24}
                      color="black"
                      style={styles.iconModal}
                    />
                    <Text style={styles.optionText}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={24}
                      color="black"
                      style={styles.iconModal}
                    />
                    <Text style={styles.optionText}>Cancel</Text>
                  </TouchableOpacity>
                  {/* Add more options as needed */}
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Friend Modal */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={friendModalVisible}
              onRequestClose={() => setFriendModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => setFriendModalVisible(false)}
              >
                <View
                  style={[
                    styles.modalContent,
                    { top: modalPosition.top, right: modalPosition.right },
                  ]}
                >
                  <TouchableOpacity style={styles.optionItem} onPress={removeFriend} >
                    <Ionicons
                      name="person-remove-outline"
                      size={24}
                      color="black"
                      style={styles.iconModal}
                    />
                    <Text style={styles.optionText}>Hủy kết bạn</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setFriendModalVisible(false)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color="black"
                      style={styles.iconModal}
                    />
                    <Text style={styles.optionText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
            {/* Phần chứa biểu tượng */}
            {userId !== currentUserId && ( // Kiểm tra xem uid có khác với uid của người dùng hiện tại không
              <View style={styles.iconContainer}>
                {isFriend ? ( // Kiểm tra xem đã kết bạn chưa
                  <TouchableOpacity style={styles.iconButton} onPress={handleFriendModal}>
                    <Ionicons name="people-outline" size={24} color="black" />
                    <Text style={styles.buttonText}>Bạn bè</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    {isFriendAdded ? ( // Nếu đã gửi lời mời kết bạn
                      <TouchableOpacity style={styles.iconButton} onPress={handleUndo}>
                        <Ionicons name="arrow-undo-outline" size={24} color="black" />
                        <Text style={styles.buttonText}>Hoàn tác</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={handleAddFriend}
                        >
                          <Ionicons name="person-add" size={24} color="black" />
                          <Text style={styles.buttonText}>Thêm bạn bè</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}
                <TouchableOpacity style={styles.iconButton} onPress={goToChatScreen} >
                  <Ionicons name="chatbubble-ellipses" size={24} color="black" />
                  <Text style={styles.buttonText} >Nhắn tin</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.info}>Thông tin</Text>
              <View style={styles.infoContainer}>
                <Text style={styles.text}>{phone ? `Điện thoại: ${phone}` : null}</Text>
                <Text style={styles.text}>{email ? `Email: ${email}` : null}</Text>
                <Text style={styles.text}>{address ? `Địa chỉ: ${address}` : null}</Text>
                <Text style={styles.text}>{job ? `Công việc: ${job}` : null}</Text>
                <Text style={styles.text}>{workplace ? `Nơi làm việc: ${workplace}` : null}</Text>

              </View>
            </View>
            <View style={styles.SectionContainer}>
              {/* Các nút để chuyển giữa các phần */}
              <TouchableOpacity onPress={() => handleSectionChange('post')} style={styles.button}>
                <Text style={styles.buttonText}>Bài viết</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSectionChange('reel')} style={styles.button}>
                <Text style={styles.buttonText}>Reel</Text>
              </TouchableOpacity>
            </View>

            {/* Hiển thị phần "Bài viết" */}
            {activeSection === 'post' && (
              <View style={styles.PostSection}>
                <ScrollView style={{ marginBottom: 30 }}>
                  <PostScreen
                    posts={posts}
                    loading={loading}
                    error={error}
                    userId={userId}
                    navigation={navigation}
                    setPosts={setPosts}
                    setLikedPosts={setLikedPosts}
                    setLoading={setLoading}
                    setError={setError}
                    fetchPostsUser={fetchPostsUser}
                  />
                </ScrollView>
              </View>
            )}
            {activeSection === 'reel' && (
              <View style={styles.ReelSection}>
                <ScrollView style={{ marginBottom: 30 }}>
                  <View style={styles.reelsContainer}>
                    {/* Hiển thị các Reel */}
                    {reels.map((item) => (
                      <TouchableOpacity
                        key={item.reelid}
                        style={styles.reelItem}
                        onPress={() => navigation.navigate('ReelsScreen', { UserReelid: item.reelid, ProfileId: userId })} // Gửi reelid tới ReelScreen
                      >
                        {/* Hiển thị video */}
                        <View style={styles.videoContainer}>
                          <Video
                            source={{ uri: item.reelurl }}
                            style={styles.reelVideo}
                            resizeMode="contain" // Đảm bảo video được co giãn vừa khung
                          />
                        </View>
                        <View style={styles.overlay}>
                          <View style={styles.reelInfoContainer}>
                            <Icon name="heart-outline" size={16} color="#fff" />
                            <Text style={styles.reelInfo}>{item.reellike}</Text>
                          </View>
                          <View style={styles.reelInfoContainer}>
                            <Icon name="chatbox-outline" size={16} color="#fff" />
                            <Text style={styles.reelInfo}>{item.reelcomment}</Text>
                          </View>
                        </View>
                        <Text style={styles.reelText}>{item.reeltitle}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}


          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileTab"
        component={ProfileTab}
        options={({ navigation }) => ({
          headerTitle: "Trang cá nhân",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2F95DC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <Icon
              name="chevron-back-outline"
              size={20}
              onPress={() => navigation.navigate('MenuScreen')}
              style={{ color: "#FFFFFF", marginLeft: 20 }}
            ></Icon>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 10,
    paddingLeft: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
  },
  iconModal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'black',
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
    flexDirection: 'row',
    marginBottom: 20,
    marginLeft: 10,
  },
  button: {
    marginRight: 5,
    paddingVertical: 5,  // Tăng độ cao cho nút
    paddingHorizontal: 5, // Tăng độ rộng cho nút
    borderRadius: 5,  // Bo tròn viền giống nút Android
    alignItems: 'center', // Canh giữa văn bản trong nút
    justifyContent: 'center', // Canh giữa văn bản trong nút
    elevation: 2, // Tạo hiệu ứng bóng đổ nhẹ (giống Android)
    shadowColor: '#000',  // Màu bóng đổ
    shadowOpacity: 0.1,  // Độ mờ của bóng
    shadowRadius: 5,  // Độ mờ của bóng
    shadowOffset: { width: 0, height: 4 },  // Vị trí bóng
    width: 80,  // Chiều rộng cố định
    height: 45,  // Chiều cao cố định
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold', // Để in đậm hơn
  },
  reelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Giữa các video
  },
  reelItem: {
    width: '18%',  // Điều chỉnh kích thước của mỗi reel (sử dụng 48% để có 2 cột)
    marginBottom: 10,
    alignItems: 'center', // Căn giữa nội dung của mỗi reel
  },
  videoContainer: {
    width: '100%',  // Đảm bảo container chiếm toàn bộ chiều rộng của reel
    height: 100,    // Chiều cao container video
    backgroundColor: 'black',  // Nền đen cho phần còn trống
    justifyContent: 'center',
    alignItems: 'center',  // Căn giữa video trong container
    marginBottom: 5, // Khoảng cách giữa video và tiêu đề
  },
  reelVideo: {
    width: '100%',  // Đảm bảo video chiếm toàn bộ chiều rộng của item
    height: '100%',  // Chiều cao video chiếm toàn bộ chiều cao của container
  },
  reelText: {
    textAlign: 'center',
    marginTop: 5,
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    padding: 15,
    borderRadius: 5,
    flexDirection: 'row', 
    alignItems: 'flex-start', 
  },
  reelInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',  // Căn giữa icon và text
    margin: 5,  // Khoảng cách giữa các dòng icon-text
  },
  reelInfo: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,  // Khoảng cách giữa icon và text
  },
});

export default ProfileStack;
