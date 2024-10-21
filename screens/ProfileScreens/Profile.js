import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../data/supabaseClient';

const Profile = () => {
  const route = useRoute();
  const { uid } = route.params; // Lấy uid từ params
  const [username, setUsername] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState("https://via.placeholder.com/150");
  const [coverUrl, setCoverUrl] = useState("https://via.placeholder.com/400x200");
  const [phone, setPhone] = useState('Loading...');
  const [email, setEmail] = useState('Loading...');
  const [job, setJob] = useState('Loading...');
  const [address, setAddress] = useState('Loading...');
  const [workplace, setWorkplace] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFriend, setIsFriend] = useState(false); // Khởi tạo isFriend là false ban đầu
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser(); // Lấy user hiện tại

      setCurrentUserId(user.id); // Lưu uid của người dùng hiện tại
      const { data, error } = await supabase
        .from('User')
        .select('avatar, name, cover, phone, email, job, address, workplace')
        .eq('uid', uid)
        .single();

      if (error) {
        console.error("Error fetching user data: ", error);
      } else {
        setUsername(data.name || 'Unknown User');
        setAvatarUrl(data.avatar || "https://via.placeholder.com/150");
        setCoverUrl(data.cover || "https://via.placeholder.com/400x200");
        setPhone(data.phone || 'N/A');
        setEmail(data.email || 'N/A');
        setJob(data.job || 'N/A');
        setAddress(data.address || 'N/A');
        setWorkplace(data.workplace || 'N/A');
      }

      // Kiểm tra xem người dùng hiện tại có là bạn hay không
      const { data: friendshipsByCurrentUser } = await supabase
        .from("Friendship")
        .select("*")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);

      if (friendshipsByCurrentUser.length > 0) {
        setIsFriend(true);
      }
      setLoading(false);
    };
    
    fetchUserData();
  }, [uid]);

  const handleUnfriend = async () => {
    // Thực hiện hủy kết bạn tại đây
    const { data, error } = await supabase
      .from("Friendship")
      .delete()
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);

    if (error) {
      console.error("Error unfriending:", error);
    } else {
      setIsFriend(false);
    }
    setConfirmVisible(false); // Đóng hộp thoại xác nhận
    setDialogVisible(false); // Đóng hộp thoại chính
  };

  const handleUnfriendDialog = () => {
    setConfirmVisible(true); // Mở hộp thoại xác nhận
  };

  const renderOptions = () => {
    return (
      <View style={styles.optionList}>
        <TouchableOpacity style={styles.optionButton} onPress={handleUnfriendDialog}>
          <Text style={styles.optionText}>Hủy kết bạn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => setDialogVisible(false)}>
          <Text style={styles.optionText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.headerBack}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back-outline" size={25} color="black" />
      </TouchableOpacity>

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
            <Text style={styles.username}>{username}</Text>
          </View>
          {/* Phần chứa biểu tượng */}
          {uid !== currentUserId && ( // Kiểm tra xem uid có khác với uid của người dùng hiện tại không
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
              <Text>Điện thoại: {phone}</Text>
              <Text>Email: {email}</Text>
              <Text>Địa chỉ: {address}</Text>
              <Text>Công việc: {job}</Text>
              <Text>Nơi làm việc: {workplace}</Text>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 70,
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
  },
  info: {
    fontSize: 20,
    fontWeight: 'bold',
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
  optionText: {
    fontSize: 16,
  },
});

export default Profile;
