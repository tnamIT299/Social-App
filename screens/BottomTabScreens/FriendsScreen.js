import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from "../../data/supabaseClient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const FriendRequest = ({ avatar, name, onAccept, onDelete }) => (
  <View style={styles.requestContainer}>
    <Image source={{ uri: avatar }} style={styles.avatar} />
    <View style={styles.requestInfo}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.buttonText}>Xác nhận</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.buttonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const FriendListItem = ({ avatar, name }) => (
  <View style={styles.requestContainer}>
    <Image source={{ uri: avatar }} style={styles.avatar} />
    <View style={styles.requestInfo}>
      <Text style={styles.name}>{name}</Text>
    </View>
  </View>
);

const SentInvitationItem = ({ avatar, name, onRevoke }) => (
  <View style={styles.requestContainer}>
    <Image source={{ uri: avatar }} style={styles.avatar} />
    <View style={styles.requestInfo}>
      <Text style={styles.name}>{name}</Text>
      <TouchableOpacity style={styles.revokeButton} onPress={onRevoke}>
        <Text style={styles.buttonText}>Thu hồi yêu cầu</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const FriendSuggestion = ({ avatar, name, onAddFriend, onRemove, onUndo }) => {
  const [isFriendAdded, setIsFriendAdded] = useState(false);

  const handleAddFriend = () => {
    onAddFriend();
    setIsFriendAdded(true); // Switch to Undo button
  };

  const handleUndo = () => {
    onUndo();
    setIsFriendAdded(false); // Switch back to Add/Remove buttons
  };

  return (
    <View style={styles.requestContainer}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.buttonsContainer}>
          {isFriendAdded ? (
            <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
              <Text style={styles.buttonText}>Hoàn tác</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddFriend}
              >
                <Text style={styles.buttonText}>Thêm bạn bè</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
                <Text style={styles.buttonText}>Gỡ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const FriendsScreen = () => {
  const [activeSection, setActiveSection] = useState("requests"); // Trạng thái mặc định là 'requests'
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFriendList, setShowFriendList] = useState(false);
  const [showSentInvitations, setShowSentInvitations] = useState(false);
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
    // Lấy dữ liệu phiên đăng nhập hiện tại
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session || !session.user) {
      console.error("Không có thông tin phiên đăng nhập.");
      return;
    }

    const currentUserId = session.user.id;

    // Lấy danh sách các mối quan hệ kết bạn đã được chấp nhận và lời mời kết bạn từ người dùng hiện tại
    const { data: friendships, error: friendshipsError } = await supabase
      .from("Friendship")
      .select("requester_id, receiver_id, status")
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (friendshipsError) {
      console.error("Lỗi khi lấy dữ liệu bạn bè:", friendshipsError);
      return;
    }

    // Lấy danh sách ID của những người đã là bạn hoặc đã gửi/nhận lời mời kết bạn
    const friendIds = friendships
      .filter((f) => f.status === "accepted")
      .map((f) => [f.requester_id, f.receiver_id])
      .flat()
      .filter((id) => id !== currentUserId);

    const pendingRequestsIds = friendships
      .filter((f) => f.status === "pending")
      .map((f) => [f.requester_id, f.receiver_id])
      .flat()
      .filter((id) => id !== currentUserId);

    // Tạo danh sách ID cần loại bỏ
    const idsToExclude = [...new Set([...friendIds, ...pendingRequestsIds])];

    // Truy vấn để lấy gợi ý kết bạn
    let query = supabase
      .from("User")
      .select("uid, name, avatar")
      .neq("uid", currentUserId) // Loại bỏ người dùng hiện tại khỏi gợi ý
      .limit(10);

    // Loại bỏ những người đã là bạn hoặc đã gửi/nhận lời mời kết bạn
    if (idsToExclude.length > 0) {
      query = query.not("uid", "in", idsToExclude);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Lỗi khi lấy dữ liệu gợi ý kết bạn:", error);
    } else {
      setSuggestions(
        data.map((user) => ({
          id: user.uid,
          avatar: user.avatar || "https://via.placeholder.com/150",
          name: user.name,
        }))
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

  const handleSendFriendRequest = async (receiverId) => {
    // Lấy dữ liệu phiên đăng nhập hiện tại
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) {
      console.error("Người dùng hiện tại không tồn tại.");
      return;
    }

    // Kiểm tra xem người dùng đã gửi lời mời kết bạn tới người nhận chưa
    const { data: existingRequests, error: existingRequestsError } =
      await supabase
        .from("Friendship")
        .select("*")
        .eq("requester_id", currentUserId)
        .eq("receiver_id", receiverId)
        .eq("status", "pending");

    if (existingRequestsError) {
      console.error(
        "Lỗi khi kiểm tra yêu cầu kết bạn hiện tại:",
        existingRequestsError
      );
      return;
    }

    if (existingRequests.length > 0) {
      console.log("Lời mời kết bạn đã được gửi đến người nhận.");
      return;
    }

    // Kiểm tra xem người dùng đã là bạn với người nhận chưa
    const { data: friendshipsByUser, error: friendshipsByUserError } =
      await supabase
        .from("Friendship")
        .select("*")
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .or(`requester_id.eq.${receiverId},receiver_id.eq.${receiverId}`);

    if (friendshipsByUserError) {
      console.error(
        "Lỗi khi kiểm tra tình trạng kết bạn hiện tại:",
        friendshipsByUserError
      );
      return;
    }

    if (friendshipsByUser.length > 0) {
      console.log(
        "Người dùng đã là bạn hoặc đã gửi lời mời kết bạn đến người nhận."
      );
      return;
    }

    // Kiểm tra và xóa lời mời kết bạn nếu đã có ở phía người nhận
    const {
      data: existingReceivedRequests,
      error: existingReceivedRequestsError,
    } = await supabase
      .from("Friendship")
      .select("*")
      .eq("requester_id", receiverId)
      .eq("receiver_id", currentUserId)
      .eq("status", "pending");

    if (existingReceivedRequestsError) {
      console.error(
        "Lỗi khi kiểm tra yêu cầu kết bạn của người nhận:",
        existingReceivedRequestsError
      );
      return;
    }

    if (existingReceivedRequests.length > 0) {
      const { error: deleteRequestError } = await supabase
        .from("Friendship")
        .delete()
        .eq("requester_id", receiverId)
        .eq("receiver_id", currentUserId)
        .eq("status", "pending");

      if (deleteRequestError) {
        console.error(
          "Lỗi khi xóa lời mời kết bạn của người nhận:",
          deleteRequestError
        );
        return;
      }
    }

    // Gửi lời mời kết bạn
    const { error: insertError } = await supabase.from("Friendship").insert({
      requester_id: currentUserId,
      receiver_id: receiverId,
      status: "pending",
    });

    if (insertError) {
      console.error("Lỗi khi gửi lời mời kết bạn:", insertError);
    } else {
      console.log("Lời mời kết bạn đã được gửi thành công.");
      fetchSuggestions();
      fetchSentInvitations();
    }
  };

  const handleRemoveFriendSuggestion = async (userId) => {
    setSuggestions(
      suggestions.filter((suggestion) => suggestion.id !== userId)
    );
  };

  const handleUndoAddFriend = async (receiverId) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) return;
      // Lấy ID của yêu cầu kết bạn từ cơ sở dữ liệu
      const { data: friendshipRequests, error: friendshipError } =
        await supabase
          .from("Friendship")
          .select("id")
          .eq("requester_id", currentUserId)
          .eq("receiver_id", receiverId)
          .eq("status", "pending");

      if (friendshipError) {
        throw new Error(
          `Lỗi khi lấy yêu cầu kết bạn: ${friendshipError.message}`
        );
      }

      if (friendshipRequests.length === 0) {
        console.log("Yêu cầu kết bạn không tìm thấy.");
        return;
      }

      const friendshipId = friendshipRequests[0].id;

      // Cập nhật giao diện người dùng ngay lập tức
      setSuggestions(
        suggestions.map((suggestion) =>
          suggestion.id === receiverId
            ? { ...suggestion, isFriendAdded: false }
            : suggestion
        )
      );

      // Thực hiện thao tác xóa trong cơ sở dữ liệu để hủy yêu cầu kết bạn
      const { error: deleteError } = await supabase
        .from("Friendship")
        .delete()
        .eq("id", friendshipId);

      if (deleteError) {
        throw new Error(`Lỗi khi hoàn tác thêm bạn bè: ${deleteError.message}`);
      }
    } catch (error) {
      // Nếu có lỗi, hiển thị thông báo lỗi và hoàn tác thay đổi trên giao diện
      console.error(error.message);
      setSuggestions(
        suggestions.map((suggestion) =>
          suggestion.id === receiverId
            ? { ...suggestion, isFriendAdded: true }
            : suggestion
        )
      );
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    const { error } = await supabase
      .from("Friendship")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (error) {
      console.error("Lỗi khi chấp nhận lời mời kết bạn:", error);
    } else {
      fetchFriendRequests();
      fetchFriendList();
    }
  };

  const handleDeleteFriendRequest = async (requestId) => {
    const { error } = await supabase
      .from("Friendship")
      .delete()
      .eq("id", requestId);

    if (error) {
      console.error("Lỗi khi xóa lời mời kết bạn:", error);
    } else {
      fetchFriendRequests();
    }
  };

  const handleRevokeInvitation = async (receiverId) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) {
      console.error("Người dùng hiện tại không tồn tại.");
      return;
    }

    // Lấy ID của yêu cầu kết bạn từ cơ sở dữ liệu
    const { data: friendshipRequests, error: friendshipError } = await supabase
      .from("Friendship")
      .select("id")
      .eq("requester_id", currentUserId)
      .eq("receiver_id", receiverId)
      .eq("status", "pending");

    if (friendshipError) {
      console.error("Lỗi khi lấy yêu cầu kết bạn:", friendshipError);
      return;
    }

    if (friendshipRequests.length === 0) {
      console.log("Yêu cầu kết bạn không tìm thấy.");
      return;
    }

    const friendshipId = friendshipRequests[0].id;

    // Xóa yêu cầu kết bạn trong cơ sở dữ liệu
    const { error: deleteError } = await supabase
      .from("Friendship")
      .delete()
      .eq("id", friendshipId);

    if (deleteError) {
      console.error("Lỗi khi thu hồi yêu cầu kết bạn:", deleteError);
    } else {
      // Cập nhật lại danh sách lời mời đã gửi
      fetchSentInvitations();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Bạn bè</Text>
        <Icon name="search-outline" size={30} color="black" style={styles.icon}/>
      </View>

      <ScrollView 
        horizontal={true}
        style={styles.buttonContainer}
        showsHorizontalScrollIndicator={false} // Hides the scroll indicator for a cleaner look
      >
        <View style={{flexDirection:'row', maxHeight:40}}>
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
              onAccept={() => handleAcceptFriendRequest(request.id)}
              onDelete={() => handleDeleteFriendRequest(request.id)}
            />
          ))}
        {activeSection === "suggestions" &&
          suggestions.map((suggestion) => (
            <FriendSuggestion
              key={suggestion.id}
              avatar={suggestion.avatar}
              name={suggestion.name}
              onAddFriend={() => handleSendFriendRequest(suggestion.id)}
              onRemove={() => handleRemoveFriendSuggestion(suggestion.id)}
              onUndo={() => handleUndoAddFriend(suggestion.id)}
            />
          ))}
        {activeSection === "friendList" &&
          friendList.map((friend) => (
            <FriendListItem
              key={friend.id}
              avatar={friend.avatar}
              name={friend.name}
            />
          ))}
        {activeSection === "sentInvitations" &&
          sentInvitations.map((invitation) => (
            <SentInvitationItem
              key={invitation.id}
              avatar={invitation.avatar}
              name={invitation.name}
              onRevoke={() => handleRevokeInvitation(invitation.id)}
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
    maxHeight:60
  },
  buttonStyle: {
    backgroundColor: "#00BFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: "#000", // Add shadow for better visual effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Shadow for Android
  },
  buttonText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
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
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
  },
  undoButton: {
    backgroundColor: "#FFC107",
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  removeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
  },
  invitationStatus: {
    fontSize: 14,
    color: "#888",
  },
  revokeButton: {
    backgroundColor: "#FFC107",
    padding: 10,
    borderRadius: 5,
  },
});

export default FriendsScreen;
