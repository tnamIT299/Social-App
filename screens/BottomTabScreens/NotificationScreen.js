import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient";

const NotificationItem = ({
  actorName,
  actorAvatar,
  action,
  receiverName,
  postTitle,
  time,
}) => {
  return (
    <View style={styles.notificationContainer}>
      {/* Avatar người thực hiện hành động */}
      <Image source={{ uri: actorAvatar }} style={styles.avatar} />

      {/* Nội dung thông báo */}
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.actorName}>{actorName}</Text> {action}
          <Text style={styles.receiverName}> {receiverName}</Text>:
          <Text style={styles.postTitle}>{postTitle}</Text>
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>

      {/* Biểu tượng tùy chọn */}
      <Icon name="ellipsis-horizontal" size={20} color="#999" />
    </View>
  );
};

const NotificationScreen = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm lấy thông báo từ Supabase
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Notification")
        .select("*")
        .eq("uid", userId) // Lọc thông báo theo uid
        .order("timesstamp", { ascending: false }); // Sắp xếp thông báo theo thời gian mới nhất

      if (error) throw error;
      setNotifications(data);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Thông Báo</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Icon
              name="search-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066ff" style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.nid}
          renderItem={({ item }) => (
            <NotificationItem
              actorName={item.related_uid}
              actorAvatar="https://via.placeholder.com/50" // Thay bằng URL avatar thật nếu có
              action={item.notification_type}
              receiverName="Bạn" // Người nhận thông báo là chính người dùng
              postTitle={item.Post?.pTitle || ""}
              time={new Date(item.timeStamp).toLocaleString()}
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
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0066ff",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 5,
  },
  loader: {
    flex: 1,
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
  actorName: {
    fontWeight: "bold",
    color: "#FFF",
  },
  receiverName: {
    fontWeight: "bold",
    color: "#FFD700",
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
