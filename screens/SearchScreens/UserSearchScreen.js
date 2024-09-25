import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../data/supabaseClient"; // Giả định bạn đã cấu hình Supabase client
import {
  FriendSuggestion,
  SentInvitationItem,
  FriendListItem,
} from "../FriendScreens";

const UserSearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);

  useEffect(() => {
    if (searchQuery) {
      fetchUsers(searchQuery);
    } else {
      setUsers([]); // Khi không có query thì không hiển thị người dùng nào
    }
  }, [searchQuery]);

  const fetchUsers = async (query) => {
    try {
      // Lấy dữ liệu người dùng hiện tại
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId) {
        console.error("Người dùng hiện tại không tồn tại.");
        return;
      }

      // Truy vấn người dùng từ Supabase dựa trên từ khóa tìm kiếm
      let { data: userData, error: userError } = await supabase
        .from("User")
        .select("uid, name, avatar")
        .ilike("name", `%${query}%`); // Tìm kiếm người dùng với tên chứa từ khóa (case-insensitive)

      if (userError) {
        console.error("Lỗi khi lấy danh sách người dùng:", userError);
        return;
      }

      // Lấy danh sách bạn bè và các yêu cầu kết bạn (cả người gửi và người nhận)
      const { data: friendships, error: friendshipsError } = await supabase
        .from("Friendship")
        .select("requester_id, receiver_id, status")
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (friendshipsError) throw friendshipsError;

      // Lấy danh sách những người đã gửi lời mời kết bạn đến người dùng hiện tại
      const { data: pendingRequests, error: pendingRequestsError } =
        await supabase
          .from("Friendship")
          .select("requester_id")
          .eq("receiver_id", currentUserId)
          .eq("status", "pending");

      if (pendingRequestsError) throw pendingRequestsError;

      // Tạo danh sách ID đã gửi lời mời
      const pendingRequestIds = pendingRequests.map(
        (request) => request.requester_id
      );

      // Phân loại người dùng theo mối quan hệ
      const results = userData.map((user) => {
        const isFriend = friendships.some(
          (friend) =>
            (friend.requester_id === user.uid &&
              friend.receiver_id === currentUserId) ||
            (friend.receiver_id === user.uid &&
              friend.requester_id === currentUserId)
        );

        const isPending = pendingRequestIds.includes(user.uid);

        return {
          id: user.uid,
          name: user.name,
          avatar: user.avatar || "https://via.placeholder.com/150", // Avatar mặc định nếu không có
          relationship: isFriend ? "friend" : isPending ? "pending" : "none", // "none" nếu không có mối quan hệ nào
        };
      });

      // Cập nhật danh sách người dùng lên UI
      setUsers(results);

      // Phân loại lại các danh sách
      const friends = results.filter((user) => user.relationship === "friend");
      const pending = results.filter((user) => user.relationship === "pending");
      const none = results.filter((user) => user.relationship === "none");

      setFriendList(friends);
      setSentInvitations(pending);
      setSuggestions(none); // Bạn có thể thay đổi nếu muốn tên "suggestions" cho những người không có mối quan hệ nào
    } catch (error) {
      console.error("Lỗi khi tìm kiếm người dùng:", error.message || error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={30}
            color="black"
            style={{ right: 12 }}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.boxSearch}
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView style={styles.scrollContainer}>
        {users.length === 0 && (
          <Text style={styles.noResultsText}>Không có kết quả nào.</Text>
        )}
        {users.length > 0 && (
          <>
            {friendList.length > 0 && (
              <Text style={styles.sectionTitle}>Bạn bè</Text>
            )}
            {friendList.map((friend) => (
              <FriendListItem
                key={friend.id}
                avatar={friend.avatar}
                name={friend.name}
                friendId={friend.id}
                fetchFriendList={fetchUsers}
              />
            ))}

            {sentInvitations.length > 0 && (
              <Text style={styles.sectionTitle}>Lời mời đã gửi</Text>
            )}
            {sentInvitations.map((invitation) => (
              <SentInvitationItem
                key={invitation.id}
                avatar={invitation.avatar}
                name={invitation.name}
                receiverId={invitation.id}
                fetchSentInvitations={fetchUsers}
              />
            ))}

            {suggestions.length > 0 && (
              <Text style={styles.sectionTitle}>Người lạ</Text>
            )}
            {suggestions.map((suggestion) => (
              <FriendSuggestion
                key={suggestion.id}
                avatar={suggestion.avatar}
                name={suggestion.name}
                receiverId={suggestion.id}
                fetchSuggestions={fetchUsers}
                fetchSentInvitations={fetchUsers}
                userId={suggestion.id}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    paddingTop: 45,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  boxSearch: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 40,
    width: "90%",
    alignSelf: "center",
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  noResultsText: {
    textAlign: "center",
    marginVertical: 20,
  },
});

export default UserSearchScreen;
