import React, { useEffect, useState } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { supabase } from "../../data/supabaseClient";
import Icon from "react-native-vector-icons/FontAwesome6";
import { createStackNavigator } from "@react-navigation/stack";
import { saveToCache, fetchFromCache } from "../../cache/cacheConversation";

const Stack = createStackNavigator();

// Bộ nhớ tạm để lưu thông tin người dùng (để tránh truy vấn lặp lại)
const nameCache = {};

const MessageSummaryTab = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredConversations, setFilteredConversations] =
    useState(conversations);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Kiểm tra dữ liệu từ cache
        const cachedConversations = await fetchFromCache(
          `conversations_${userId}`
        );
        if (cachedConversations) {
          setConversations(cachedConversations);
          setLoading(false); // Hiển thị giao diện ngay
        }

        // Tiếp tục tải dữ liệu từ Supabase
        const messages = await fetchLastMessages(userId);
        const enrichedMessages = await enrichMessagesWithUserInfo(
          messages,
          userId
        );

        // Lưu dữ liệu vào state và cache
        setConversations(enrichedMessages);
        await saveToCache(`conversations_${userId}`, enrichedMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  useEffect(() => {
    const subscription = supabase
      .channel("user_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "User" },
        (payload) => {
          const updatedUser = payload.new;
          // Cập nhật thông tin tên và avatar nếu userId này đã hiển thị
          setConversations((prevConversations) =>
            prevConversations.map((conversation) =>
              conversation.partnerId === updatedUser.uid
                ? {
                    ...conversation,
                    partnerName: updatedUser.name,
                    partnerAvatar: updatedUser.avatar,
                  }
                : conversation
            )
          );

          // Cập nhật cache
          if (nameCache[updatedUser.uid]) {
            nameCache[updatedUser.uid] = {
              name: updatedUser.name,
              avatar: updatedUser.avatar,
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchLastMessages = async (userId) => {
    const { data, error } = await supabase
      .from("Message")
      .select("sender_id, receiver_id, content, image_url, created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    // Phân nhóm tin nhắn theo người gửi
    const groupedConversations = {};
    data.forEach((message) => {
      const partnerId =
        message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!groupedConversations[partnerId]) {
        groupedConversations[partnerId] = message;
      }
    });

    return Object.values(groupedConversations);
  };

  const enrichMessagesWithUserInfo = async (messages, userId) => {
    return Promise.all(
      messages.map(async (message) => {
        const partnerId =
          message.sender_id === userId
            ? message.receiver_id
            : message.sender_id;
        if (!nameCache[partnerId]) {
          nameCache[partnerId] = await fetchPartnerInfo(partnerId);
        }
        return {
          ...message,
          partnerId,
          partnerName: nameCache[partnerId].name,
          partnerAvatar: nameCache[partnerId].avatar,
        };
      })
    );
  };

  const fetchPartnerInfo = async (partnerId) => {
    const { data, error } = await supabase
      .from("User")
      .select("name, avatar")
      .eq("uid", partnerId)
      .single();

    if (error) {
      console.error("Error fetching partner info:", error);
      return { name: "Unknown User", avatar: null };
    }

    const userInfo = {
      name: data.name || "Unknown User",
      avatar: data.avatar || null,
    };
    return userInfo;
  };
  const handleSearch = (text) => {
    setSearchText(text);

    if (text === "") {
      // Không lọc, giữ nguyên dữ liệu gốc
      setFilteredConversations(conversations);
    } else {
      // Lọc dữ liệu dựa trên từ khóa
      const filtered = conversations.filter((item) =>
        item.partnerName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  };

  const renderItem = ({ item }) => {
    const isImage = item.image_url !== null;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() =>
          navigation.navigate("Message", {
            uid: item.partnerId,
            name: item.partnerName,
            avatar: item.partnerAvatar,
          })
        }
      >
        <View style={styles.avatarContainer}>
          {item.partnerAvatar ? (
            <Image source={{ uri: item.partnerAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.userId}>{item.partnerName}</Text>
          <Text style={styles.message}>
            {isImage
              ? item.sender_id === userId
                ? "Bạn: Đã gửi hình ảnh"
                : "Đã gửi hình ảnh"
              : item.sender_id === userId
              ? `Bạn: ${item.content}`
              : item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* Danh sách tin nhắn */}
      <FlatList
        data={searchText === "" ? conversations : filteredConversations}
        keyExtractor={(item) =>
          `${item.sender_id}_${item.receiver_id}_${item.created_at}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={() =>
          navigation.navigate("AddGroup", {
            screen: "AddGroupTab",
            params: {
              userId: userId,
            },
          })
        }
      >
        <Icon name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const MessageSummaryStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MessageSummaryTab"
        component={MessageSummaryTab}
        options={({ navigation }) => ({
          headerTitle: "Tin nhắn",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2F95DC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <Icon
              name="chevron-left"
              size={20}
              onPress={() => navigation.goBack()}
              style={{ color: "#FFFFFF", marginLeft: 20 }}
            ></Icon>
          ),

          headerRight: () => (
            <Icon
              name="users"
              size={25}
              onPress={() => navigation.navigate("GroupList")}
              style={{ color: "#FFFFFF", marginRight: 20 }}
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
  },
  searchContainer: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchInput: {
    backgroundColor: "#fff",
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#333",
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  avatarContainer: {
    marginRight: 10,
  },
  createGroupButton: {
    position: "absolute",
    bottom: 16, // Cố định khoảng cách từ cạnh dưới
    right: 16, // Cố định khoảng cách từ cạnh phải
    backgroundColor: "#2F95DC",
    width: 60,
    height: 60,
    borderRadius: 30, // Làm nút tròn
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Đổ bóng trên Android
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 40,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 40,
    backgroundColor: "#ccc",
  },
  textContainer: {
    flex: 1,
  },
  userId: {
    fontSize: 18,
    fontWeight: "bold",
  },
  message: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MessageSummaryStack;