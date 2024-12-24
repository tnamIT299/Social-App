import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { getUserId } from "../../data/getUserData";
import { supabase } from "../../data/supabaseClient";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { handlePostDetailScreen } from "../PostScreens/PostFunctions";
import { useNavigation } from "@react-navigation/native";

const NotificationItem = ({
  actorAvatar,
  postTitle,
  time,
  postId,
  navigation,
  nid,
  onDelete,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  // Hàm xử lý xóa thông báo
  const handleDeleteNotification = async () => {
    try {
      const { error } = await supabase
        .from("Notification")
        .delete()
        .eq("nid", nid); // Xóa thông báo dựa trên nid

      if (error) throw error;

      // Gọi callback để cập nhật danh sách thông báo
      onDelete(nid);
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
      Alert.alert("Lỗi", "Không thể xóa thông báo. Vui lòng thử lại.");
    }
  };

  return (
    <TouchableOpacity
      onPress={() => handlePostDetailScreen(navigation, postId)}
    >
      <View style={styles.notificationContainer}>
        {/* Avatar người thực hiện hành động */}
        <Image source={{ uri: actorAvatar }} style={styles.avatar} />

        {/* Nội dung thông báo */}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.postTitle}>{postTitle}</Text>
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        {/* Biểu tượng tùy chọn */}
        <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
          <Icon name="ellipsis-horizontal" size={20} color="#999" />
        </TouchableOpacity>

        {/* Menu tùy chọn */}
        {showOptions && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                Alert.alert(
                  "Xác nhận",
                  "Bạn có chắc chắn muốn xóa thông báo này?",
                  [
                    { text: "Hủy", style: "cancel" },
                    { text: "Xóa", onPress: handleDeleteNotification },
                  ]
                );
                setShowOptions(false); // Ẩn menu sau khi thực hiện
              }}
            >
              <Text style={styles.optionText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const NotificationScreen = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Hàm xóa thông báo khỏi danh sách
  const handleDeleteNotification = (nid) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.nid !== nid)
    );
  };

  // Hàm lấy thông báo từ Supabase
  const fetchNotifications = async () => {
    try {
      const userId = await getUserId();
      setLoading(true);

      // Lấy danh sách thông báo từ Supabase
      const { data, error } = await supabase
        .from("Notification")
        .select("*")
        .eq("uid", userId)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      // Lọc thông báo: Loại bỏ những thông báo mà uid === related_uid
      const filteredNotifications = data.filter(
        (notification) => notification.uid !== notification.related_uid
      );

      // Lấy thêm thông tin avatar của người thực hiện hành động
      const notificationsWithAvatar = await Promise.all(
        filteredNotifications.map(async (notification) => {
          const { data: userData, error: userError } = await supabase
            .from("User")
            .select("avatar")
            .eq("uid", notification.related_uid)
            .single();

          if (userError) {
            console.error("Lỗi khi lấy thông tin người dùng:", userError);
            return null;
          }

          return {
            ...notification,
            actorAvatar: userData?.avatar || "https://via.placeholder.com/150",
          };
        })
      );

      // Lọc các thông báo có dữ liệu hợp lệ
      setNotifications(notificationsWithAvatar.filter(Boolean));
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Thông báo</Text>
        <Icon
          name="search-outline"
          size={30}
          color="black"
          style={styles.icon}
        />
      </View>

      {/* Loading indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066ff" style={styles.loader} />
      ) : (
        <FlatList
          style={{ marginBottom: 70 }}
          data={notifications}
          keyExtractor={(item) => item.nid.toString()}
          renderItem={({ item }) => (
            <NotificationItem
              postId={item.post_id}
              navigation={navigation}
              actorAvatar={item.actorAvatar}
              postTitle={item.notification || ""}
              time={dayjs(item.timestamp).fromNow()}
              nid={item.nid}
              onDelete={handleDeleteNotification}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.infoText}>Bạn chưa có thông báo nào.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0066ff",
  },
  scrollContainer: {
    flex: 1,
  },
  buttonContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    maxHeight: 60,
  },
  buttonStyle: {
    backgroundColor: "#00BFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginVertical: 20,
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
    borderRadius: 10,
  },
  notificationText: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 22,
  },
  postTitle: {
    color: "#000",
  },
  time: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 5,
  },
  optionsMenu: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  optionButton: {
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    color: "#FF0000",
  },
});

export default NotificationScreen;
