import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  FriendListItem,
  FriendRequest,
  FriendSuggestion,
  SentInvitationItem,
} from "../FriendScreens";

const FriendsScreen = () => {
  const [activeSection, setActiveSection] = useState("requests"); // Trạng thái mặc định là 'requests'
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      fetchFriendRequests();
    }, [])
  );

  useEffect(() => {
    switch (activeSection) {
      case "suggestions":
        fetchSuggestions();
        break;
      case "friendList":
        fetchFriendList();
        break;
      case "sentInvitations":
        fetchSentInvitations();
        break;
      default:
        break;
    }
  }, [activeSection]);

  const fetchFriendRequests = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) {
      console.error("Người dùng hiện tại không tồn tại.");
      return;
    }

    const { data, error } = await supabase
      .from("Friendship")
      .select("*, requester:requester_id(name, avatar)")
      .eq("receiver_id", currentUserId)
      .eq("status", "pending")
      .not("requester_id", "eq", currentUserId);

    if (error) {
      console.error("Lỗi khi lấy lời mời kết bạn:", error);
    } else {
      setRequests(
        data.map((req) => ({
          id: req.id,
          avatar: req.requester.avatar || "https://via.placeholder.com/150",
          name: req.requester.name,
        }))
      );
    }
  };

  const fetchSuggestions = async () => {
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

      // Lấy danh sách bạn bè và các yêu cầu kết bạn (cả người gửi và người nhận)
      const { data: friendships, error: friendshipsError } = await supabase
        .from("Friendship")
        .select("requester_id, receiver_id, status")
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (friendshipsError) throw friendshipsError;

      // Tạo danh sách các ID cần loại trừ (bạn bè và các yêu cầu kết bạn đã gửi)
      let excludedIds = friendships
        .filter((friend) => friend.status !== "rejected") // Loại trừ các yêu cầu đã bị từ chối
        .map((friend) =>
          friend.requester_id === currentUserId
            ? friend.receiver_id
            : friend.requester_id
        );

      // Lấy danh sách những người đã gửi lời mời kết bạn đến người dùng hiện tại
      const { data: pendingRequests, error: pendingRequestsError } =
        await supabase
          .from("Friendship")
          .select("requester_id")
          .eq("receiver_id", currentUserId)
          .eq("status", "pending");

      if (pendingRequestsError) throw pendingRequestsError;

      // Thêm ID của những người đã gửi lời mời kết bạn đến người dùng vào danh sách loại trừ
      const pendingRequestIds = pendingRequests.map(
        (request) => request.requester_id
      );
      excludedIds = excludedIds.concat(pendingRequestIds);

      // Thêm ID của người dùng hiện tại vào danh sách loại trừ
      excludedIds.push(currentUserId);

      // Truy vấn gợi ý kết bạn, loại bỏ những người đã là bạn bè hoặc đã gửi yêu cầu kết bạn
      const { data: suggestions, error: suggestionsError } = await supabase
        .from("User")
        .select("*")
        .not("uid", "in", `(${excludedIds.join(",")})`);

      if (suggestionsError) throw suggestionsError;

      console.log("Gợi ý kết bạn:", suggestions);
      // Cập nhật danh sách gợi ý lên UI
      setSuggestions(
        suggestions.map((user) => ({
          id: user.uid,
          avatar: user.avatar || "https://via.placeholder.com/150", // Avatar mặc định nếu không có
          name: user.name,
        }))
      );
    } catch (error) {
      console.error(
        "Lỗi khi lấy dữ liệu gợi ý kết bạn:",
        error.message || error
      );
    }
  };

  const fetchFriendList = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("Friendship")
      .select(
        "*, receiver:receiver_id(name, avatar), requester:requester_id(name, avatar)"
      )
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .eq("status", "accepted");

    if (error) {
      console.error("Lỗi khi lấy danh sách bạn bè:", error);
    } else {
      setFriendList(
        data.map((item) => ({
          id:
            item.requester_id === currentUserId
              ? item.receiver_id
              : item.requester_id,
          avatar:
            item.requester_id === currentUserId
              ? item.receiver.avatar || "https://via.placeholder.com/150"
              : item.requester.avatar || "https://via.placeholder.com/150",
          name:
            item.requester_id === currentUserId
              ? item.receiver.name
              : item.requester.name,
        }))
      );
    }
  };

  const fetchSentInvitations = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) return;

    // Lấy danh sách các ID người nhận từ bảng Friendship
    const { data: friendshipData, error: friendshipError } = await supabase
      .from("Friendship")
      .select("receiver_id")
      .eq("requester_id", currentUserId)
      .eq("status", "pending");

    if (friendshipError) {
      console.error("Lỗi khi lấy danh sách người nhận:", friendshipError);
      return;
    }

    // Lấy danh sách các ID người nhận
    const receiverIds = friendshipData.map((item) => item.receiver_id);

    // Nếu không có người nhận, kết thúc hàm
    if (receiverIds.length === 0) {
      setSentInvitations([]);
      return;
    }

    // Truy vấn bảng User để lấy thông tin chi tiết của người nhận
    const { data: usersData, error: usersError } = await supabase
      .from("User")
      .select("uid, name, avatar")
      .in("uid", receiverIds);

    if (usersError) {
      console.error("Lỗi khi lấy thông tin người nhận:", usersError);
    } else {
      // Tạo danh sách lời mời đã gửi
      setSentInvitations(
        usersData.map((user) => ({
          id: user.uid,
          avatar: user.avatar || "https://via.placeholder.com/150",
          name: user.name,
        }))
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Bạn bè</Text>
        <Icon
          name="search-outline"
          size={30}
          color="black"
          style={styles.icon}
        />
      </View>

      <ScrollView
        horizontal={true}
        style={styles.buttonContainer}
        showsHorizontalScrollIndicator={false} // Hides the scroll indicator for a cleaner look
      >
        <View style={{ flexDirection: "row", maxHeight: 40 }}>
          <TouchableOpacity
            style={styles.buttonStyle}
            onPress={() => setActiveSection("friendList")}
          >
            <Text style={styles.buttonText}>Danh sách bạn bè</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonStyle}
            onPress={() => setActiveSection("requests")}
          >
            <Text style={styles.buttonText}>Lời mời kết bạn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonStyle}
            onPress={() => setActiveSection("suggestions")}
          >
            <Text style={styles.buttonText}>Gợi ý</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonStyle}
            onPress={() => setActiveSection("sentInvitations")}
          >
            <Text style={styles.buttonText}>Yêu cầu đã gửi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView style={styles.scrollContainer}>
        {activeSection === "requests" &&
          requests.map((request) => (
            <FriendRequest
              key={request.id}
              avatar={request.avatar}
              name={request.name}
              requestId={request.id}
              fetchFriendRequests={fetchFriendRequests}
              fetchFriendList={fetchFriendList}
            />
          ))}
        {activeSection === "suggestions" &&
          suggestions.map((suggestion) => (
            <FriendSuggestion
              key={suggestion.id}
              avatar={suggestion.avatar}
              name={suggestion.name}
              receiverId={suggestion.id}
              fetchSuggestions={fetchSuggestions}
              fetchSentInvitations={fetchSentInvitations}
              userId={suggestion.id}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
            />
          ))}
        {activeSection === "friendList" &&
          friendList.map((friend) => (
            <FriendListItem
              key={friend.id}
              avatar={friend.avatar}
              name={friend.name}
              friendId={friend.id}
              fetchFriendList={fetchFriendList}
            />
          ))}
        {activeSection === "sentInvitations" &&
          sentInvitations.map((invitation) => (
            <SentInvitationItem
              key={invitation.id}
              avatar={invitation.avatar}
              name={invitation.name}
              receiverId={invitation.id}
              fetchSentInvitations={fetchSentInvitations}
            />
          ))}
      </ScrollView>
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
    marginHorizontal: 10,
    paddingHorizontal: 20,
    paddingVertical: 5,
    shadowColor: "#000", // Add shadow for better visual effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Shadow for Android
  },
});

export default FriendsScreen;
