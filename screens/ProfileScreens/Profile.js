import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useNavigation, useRoute, useFocusEffect  } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from '../../data/supabaseClient';
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();
const ProfileTab = () => {
  const route = useRoute();
  const { userId } = route.params; // Lấy uid từ params
  const [username, setUsername] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState("https://via.placeholder.com/150");
  const [coverUrl, setCoverUrl] = useState("https://via.placeholder.com/400x300");
  const [phone, setPhone] = useState('Loading...');
  const [email, setEmail] = useState('Loading...');
  const [job, setJob] = useState('Loading...');
  const [address, setAddress] = useState('Loading...');
  const [workplace, setWorkplace] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFriend, setIsFriend] = useState(false); // Khởi tạo isFriend là false ban đầu
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const navigation = useNavigation();

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from('User')
      .select('avatar, name, cover, phone, email, job, address, workplace')
      .eq('uid', userId)
      .single();

    if (error) {
      console.error("Error fetching user data: ", error);
    } else {
      setUsername(data.name || 'Unknown User');
      setAvatarUrl(data.avatar || "https://via.placeholder.com/150");
      setCoverUrl(data.cover || "https://via.placeholder.com/400x300");
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setJob(data.job || '');
      setAddress(data.address || '');
      setWorkplace(data.workplace || '');
    }

    const { data: friendshipsByCurrentUser } = await supabase
      .from("Friendship")
      .select("*")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (friendshipsByCurrentUser && friendshipsByCurrentUser.length > 0) {
      setIsFriend(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData(); // Tải dữ liệu lần đầu khi trang được render
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData(); // Gọi lại khi màn hình được focus
    }, [userId])
  );

  const handleOpenModal = (event) => {
    const { pageY, pageX } = event.nativeEvent;
    const windowWidth = Dimensions.get('window').width;

    setModalPosition({
      top: pageY + 10,
      right: windowWidth - pageX - 10,
    });
    setModalVisible(true);
  };
  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.profileSection}>
          <View style={styles.headerSection}>
            <Image
              source={{ uri: coverUrl }}
              style={styles.coverImage}
            />
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
            <View style={styles.usernameIconContainer}>
              {userId === currentUserId && ( // Kiểm tra xem uid có trùng với currentUserId không
                <TouchableOpacity style={styles.iconRight} onPress={(event) => handleOpenModal(event)}>
                  <Ionicons name="ellipsis-horizontal" size={24} backgroundcolor="black" />
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
              <View style={[styles.modalContent, { top: modalPosition.top, right: modalPosition.right }]}>
                <TouchableOpacity style={styles.optionItem}  onPress={() => navigation.navigate('EditProfileScreen',{uid})}>
                  <Ionicons name="create-outline" size={24} color="black" style={styles.iconButton} />
                  <Text style={styles.optionText}>Chỉnh sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="search-outline" size={24} color="black" style={styles.iconButton} />
                  <Text style={styles.optionText}>Tìm kiếm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={() => setModalVisible(false)}>
                  <Ionicons name="log-out-outline" size={24} color="black" style={styles.iconButton} />
                  <Text style={styles.optionText}>Cancel</Text>
                </TouchableOpacity>
                {/* Add more options as needed */}
              </View>
            </TouchableOpacity>
          </Modal>
          {/* Phần chứa biểu tượng */}
          {userId !== currentUserId && ( // Kiểm tra xem uid có khác với uid của người dùng hiện tại không
            <View style={styles.iconContainer}>
              {isFriend ? ( // Kiểm tra xem đã kết bạn chưa
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="people-outline" size={24} color="black" />
                  <Text>Bạn bè</Text>
                </TouchableOpacity> // Hiển thị nhãn "Là bạn bè"
              ) : (
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="person-add" size={24} color="black" />
                  <Text>Thêm bạn bè</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="chatbubble-ellipses" size={24} color="black" />
                <Text>Nhắn tin</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.info}>Thông tin</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.text}>Điện thoại: {phone}</Text>
              <Text style={styles.text}>Email: {email}</Text>
              <Text style={styles.text}>Địa chỉ: {address}</Text>
              <Text style={styles.text}>Công việc: {job}</Text>
              <Text style={styles.text}>Nơi làm việc: {workplace}</Text>
            </View>
          </View>
        </View>
      )}

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
              onPress={() => navigation.goBack()}
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
    backgroundColor: '#fff',
    padding: 10,
  },
  headerBack: {
    marginTop: 10,
    marginBottom: 10,
  },
  profileSection: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    position: 'relative',
  },
  usernameIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the content horizontally
    width: '100%',
    marginTop: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, // Take up remaining space
  },
  iconRight: {
    position: 'absolute',
    right: 15, // Adjust as needed for padding
    top: 30,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    width: 150,
    zIndex: 999, // Make sure it's on top
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  optionText: {
    color: 'black',
    fontSize: 14,
    marginLeft: 10,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'absolute',
    top: 130,
    left: '50%',
    marginLeft: -50,
    borderWidth: 2,
    borderColor: '#000000',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginLeft: 10,
  },
  info: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoSection: {
    padding: 20,
  },
  infoContainer: {
    alignItems: 'flex-start',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  iconButton: {
    alignItems: 'center',
  },
  optionList: {
    padding: 20,
  },
  optionButton: {
    paddingVertical: 10,
  },
  text:{
    paddingBottom : 5,
  }
});

export default ProfileStack;
