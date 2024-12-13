import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const SearchMessagesTab = ({ route }) => {
  const { groupId } = route.params; // Lấy `groupId` từ tham số
  const [searchText, setSearchText] = useState("");
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Fetch all messages in the group
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        // Truy vấn bảng GroupMessage để lấy tin nhắn
        const { data: messagesData, error: messagesError } = await supabase
          .from("GroupMessage")
          .select("*")
          .eq("groupid", groupId)
          .order("timestamp", { ascending: true });
  
        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return;
        }
  
        // Lấy danh sách `sender_id` duy nhất từ tin nhắn
        const senderIds = [...new Set(messagesData.map((msg) => msg.sender_id))];
  
        // Truy vấn bảng User để lấy thông tin người dùng
        const { data: usersData, error: usersError } = await supabase
          .from("User")
          .select("uid, name")
          .in("uid", senderIds);
  
        if (usersError) {
          console.error("Error fetching user data:", usersError);
          return;
        }
  
        // Kết hợp tin nhắn với thông tin người dùng
        const enrichedMessages = messagesData.map((msg) => {
          const user = usersData.find((user) => user.uid === msg.sender_id);
          return {
            ...msg,
            senderName: user ? user.name : "Người dùng không xác định",
          };
        });
  
        setMessages(enrichedMessages);
        setFilteredMessages(enrichedMessages); // Hiển thị tất cả tin nhắn ban đầu
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMessages();
  }, [groupId]);
  

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
      <Text style={styles.messageSender}>{item.senderName}</Text>
      <Text style={styles.messageContent}>
        {item.content || "Tin nhắn hình ảnh"}
      </Text>
      <Text style={styles.messageTimestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );
  


  return (
    <SafeAreaView style={styles.container}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
      <Icon name="chevron-back-outline" onPress={navigation.goBack} size={24} color="#aaa" style={styles.backIcon} />
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
          data={ searchText === "" ? messages : filteredMessages}
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

export default SearchMessagesTab;
