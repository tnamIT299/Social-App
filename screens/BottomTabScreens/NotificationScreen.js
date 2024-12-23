import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { getUserId } from "../../data/getUserData";
import { supabase } from "../../data/supabaseClient";
import dayjs from "dayjs";
import { handlePostDetailScreen } from "../PostScreens/PostFunctions";
import { useNavigation } from "@react-navigation/native";

const NotificationItem = ({
  actorAvatar,
  postTitle,
  time,
  postId,
  navigation,
}) => {
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
        <Icon name="ellipsis-horizontal" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );
};

const NotificationScreen = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Hàm lấy thông báo từ Supabase
  const fetchNotifications = async () => {
    try {
      const userId = await getUserId();
      setLoading(true);
      const { data, error } = await supabase
        .from("Notification")
        .select("*")
        .eq("uid", userId) // Lọc thông báo theo uid
        .order("timestamp", { ascending: false }); // Sắp xếp thông báo theo thời gian mới nhất

      if (error) throw error;

      // Lấy thêm thông tin avatar của người thực hiện hành động
      const notificationsWithAvatar = await Promise.all(
        data.map(async (notification) => {
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
          data={notifications}
          keyExtractor={(item) => item.nid.toString()} // Đảm bảo rằng keyExtractor trả về chuỗi
          renderItem={({ item }) => (
            <NotificationItem
              postId={item.post_id}
              navigation={navigation}
              actorAvatar={item.actorAvatar}
              postTitle={item.notification || ""}
              time={dayjs(item.timestamp).fromNow()}
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
    backgroundColor: "#1E1E1E",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 22,
  },
  postTitle: {
    color: "#00BFFF",
    fontWeight: "bold",
  },
  time: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 5,
  },
});

export default NotificationScreen;
