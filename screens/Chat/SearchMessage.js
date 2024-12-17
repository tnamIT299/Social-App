import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const SearchMessage = ({ route }) => {
  const { senderId, receiverId } = route.params;
  console.log("senderId", senderId);
  const [searchText, setSearchText] = useState("");
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userNames, setUserNames] = useState({});
  const navigation = useNavigation();

  // Lấy tên người dùng từ bảng User
  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const { data, error } = await supabase
          .from("User")
          .select("uid, name")
          .in("uid", [senderId, receiverId]); // Lấy tên của cả sender và receiver

        if (error) {
          console.error("Error fetching user names:", error);
          return;
        }

        const names = {};
        data.forEach((user) => {
          names[user.uid] = user.name || "Unknown User";
        });

        setUserNames(names);
      } catch (err) {
        console.error("Error fetching user names:", err);
      }
    };

    fetchUserNames();
  }, [senderId, receiverId]);

  // Fetch all messages between the two users
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("Message")
          .select("*")
          .or(
            `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
          )
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }

        setMessages(data);
        setFilteredMessages(data); // Hiển thị tất cả tin nhắn ban đầu
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [senderId, receiverId]);

  // Lọc tin nhắn dựa trên từ khóa
  const handleSearch = (text) => {
    setSearchText(text);

    if (text === "") {
      setFilteredMessages(messages); // Hiển thị tất cả nếu không có từ khóa
    } else {
      const filtered = messages.filter(
        (msg) =>
          msg.content && // Kiểm tra msg.content không phải null
          msg.content.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMessages(filtered); // Lọc và cập nhật danh sách tin nhắn
    }
  };

  // Hiển thị từng tin nhắn
  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.messageSender}>
        {item.sender_id === senderId
          ? `Bạn`
          : userNames[receiverId] || "Loading..."}
      </Text>
      <Text style={styles.messageContent}>
        {item.content || "Tin nhắn hình ảnh"}
      </Text>
      <Text style={styles.messageTimestamp}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Icon
          name="chevron-back-outline"
          onPress={navigation.goBack}
          size={24}
          color="#aaa"
          style={styles.backIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tin nhắn..."
          value={searchText}
          onChangeText={handleSearch}
        />
        <Icon name="search" size={24} color="#aaa" style={styles.searchIcon} />
      </View>

      {/* Danh sách tin nhắn */}
      {loading ? (
        <Text>Đang tải tin nhắn...</Text>
      ) : (
        <FlatList
          data={searchText === "" ? messages : filteredMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>Không tìm thấy tin nhắn.</Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#333",
  },
  searchIcon: {
    marginLeft: 10,
  },
  backIcon: {
    marginRight: 10,
  },
  listContainer: {
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  messageSender: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  messageContent: {
    fontSize: 16,
    marginBottom: 5,
  },
  messageTimestamp: {
    fontSize: 12,
    color: "#666",
  },
  emptyMessage: {
    textAlign: "center",
    marginTop: 20,
    color: "#aaa",
  },
});

export default SearchMessage;
