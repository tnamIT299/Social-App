import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getUserName, getUserAvatar } from "../../data/getUserData";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../data/supabaseClient"; // Giả định bạn đã cấu hình Supabase client
import {
  FriendSuggestion,
  SentInvitationItem,
  FriendListItem,
  FriendRequest,
} from "../FriendScreens";

const UserSearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [requests, setRequests] = useState([]);

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

      // Lấy thông tin người dùng hiện tại
      const Name = await getUserName();
      setUserName(Name);
      const Avatar = await getUserAvatar();
      setUserAvatar(Avatar);

      // Truy vấn người dùng từ Supabase dựa trên từ khóa tìm kiếm
      let { data: userData, error: userError } = await supabase
        .from("User")
        .select("uid, name, avatar")
        .ilike("name", `%${query}%`);

      if (userError) {
        console.error("Lỗi khi lấy danh sách người dùng:", userError);
        return;
      }

      // Kiểm tra nếu kết quả tìm kiếm chỉ có một người và đó là chính bạn
      if (userData.length === 1 && userData[0].uid === currentUserId) {
        setUsers([
          {
            id: userData[0].uid,
            name: userData[0].name,
            avatar: userData[0].avatar || "https://via.placeholder.com/150",
            relationship: "self",
          },
        ]);
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
          .select("requester_id, User!requester_id(uid, name, avatar)")
          .eq("receiver_id", currentUserId)
          .eq("status", "pending");

      if (pendingRequestsError) throw pendingRequestsError;

      // Lấy danh sách những người dùng hiện tại đã gửi lời mời kết bạn
      const { data: sentRequests, error: sentRequestsError } = await supabase
        .from("Friendship")
        .select("receiver_id, User!receiver_id(uid, name, avatar)")
        .eq("requester_id", currentUserId)
        .eq("status", "pending");

      if (sentRequestsError) throw sentRequestsError;

      // Tạo danh sách ID đã gửi và nhận lời mời
      const pendingRequestIds = pendingRequests.map(
        (request) => request.requester_id
      );
      const sentRequestIds = sentRequests.map((request) => request.receiver_id);

      // Phân loại người dùng theo mối quan hệ
      const results = userData.map((user) => {
        // Kiểm tra xem người dùng có phải bạn bè không (status "accepted")
        const isFriend = friendships.some(
          (friend) =>
            friend.status === "accepted" &&
            ((friend.requester_id === user.uid &&
              friend.receiver_id === currentUserId) ||
              (friend.receiver_id === user.uid &&
                friend.requester_id === currentUserId))
        );

        const isPending = pendingRequestIds.includes(user.uid);
        const isSentInvitation = sentRequestIds.includes(user.uid);

        return {
          id: user.uid,
          name: user.name,
          avatar: user.avatar || "https://via.placeholder.com/150",
          relationship: isFriend
            ? "friend"
            : isPending
            ? "pending"
            : isSentInvitation
            ? "sent"
            : "none",
        };
      });

      // Cập nhật danh sách người dùng lên UI
      setUsers(results);

      // Phân loại người dùng
      const friends = results.filter((user) => user.relationship === "friend");
      const pending = pendingRequests.map((request) => ({
        id: request.requester_id,
        name: request.User.name,
        avatar: request.User.avatar || "https://via.placeholder.com/150",
      }));
      const sent = sentRequests.map((request) => ({
        id: request.receiver_id,
        name: request.User.name,
        avatar: request.User.avatar || "https://via.placeholder.com/150",
      }));
      const none = results
        .filter((user) => user.relationship === "none")
        .filter((user) => user.id !== currentUserId);

      setFriendList(friends);
      setSentInvitations(sent);
      setRequests(pending);
      setSuggestions(none);
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
            {users.some((user) => user.relationship === "self") && (
              <View>
                <Text style={styles.sectionTitle}>Bạn</Text>
                <View style={styles.requestContainer}>
                  <Image
                    source={{
                      uri: userAvatar || "https://via.placeholder.com/150",
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.name}>{userName}</Text>
                  </View>
                </View>
              </View>
            )}

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

            {requests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
                {requests.map((request) => (
                  <FriendRequest
                    key={request.id}
                    avatar={request.avatar}
                    name={request.name}
                    requestId={request.id}
                    fetchFriendRequests={fetchUsers}
                    fetchFriendList={fetchUsers}
                  />
                ))}
              </>
            )}

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
  requestContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  requestInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UserSearchScreen;
