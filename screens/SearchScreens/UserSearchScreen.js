import React, { useState, useEffect, useRef } from "react";
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
import { getUserId, getUserAvatar, getUserName } from "../../data/getUserData";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../data/supabaseClient"; // Make sure you have the correct supabase client
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
  const [Id, setId] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const performSearch = async () => {
      if (!searchQuery) {
        resetSearchState();
        return;
      }

      setIsSearching(true);

      try {
        await fetchUsers(searchQuery, isMounted);
      } catch (error) {
        console.error("Error searching users:", error.message || error);
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery]);

  const fetchUsers = async (query, isMounted) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userData = await fetchUserData(query, controller.signal);

      if (!isMounted || controller.signal.aborted) return;

      const relationships = await fetchUserRelationships(controller.signal);

      if (!isMounted || controller.signal.aborted) return;

      const results = processUserData(userData, relationships);

      if (isMounted) {
        updateUserState(results, relationships);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request aborted.");
      } else {
        //console.error("Error fetching users:", error.message || error);
      }
    }
  };

  const fetchUserData = async (query, signal) => {
    const { data, error } = await supabase
      .from("User")
      .select("uid, name, avatar")
      .ilike("name", `%${query}%`)
      .abortSignal(signal);

    if (error) throw error;
    return data;
  };

  const fetchUserRelationships = async (signal) => {
    const userId = await getUserId();
    setId(userId);
    const Avatar = await getUserAvatar();
    setUserAvatar(Avatar);
    const Name = await getUserName();
    setUserName(Name);
    try {
      const [friendshipsRes, pendingRequestsRes, sentRequestsRes] =
        await Promise.all([
          supabase
            .from("Friendship")
            .select("requester_id, receiver_id, status")
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .abortSignal(signal),
          supabase
            .from("Friendship")
            .select("requester_id, User!requester_id(uid, name, avatar)")
            .eq("receiver_id", userId)
            .eq("status", "pending")
            .abortSignal(signal),
          supabase
            .from("Friendship")
            .select("receiver_id, User!receiver_id(uid, name, avatar)")
            .eq("requester_id", userId)
            .eq("status", "pending")
            .abortSignal(signal),
        ]);

      const friendships = friendshipsRes.data || [];
      const pendingRequests = pendingRequestsRes.data || [];
      const sentRequests = sentRequestsRes.data || [];

      return { friendships, pendingRequests, sentRequests, userId };
    } catch (error) {
      console.error(
        "Error fetching user relationships:",
        error.message || error
      );
      return { friendships: [], pendingRequests: [], sentRequests: [], userId };
    }
  };

  const processUserData = (
    userData,
    { friendships, pendingRequests, sentRequests, userId }
  ) => {
    const pendingRequestIds = pendingRequests.map((req) => req.requester_id);
    const sentRequestIds = sentRequests.map((req) => req.receiver_id);

    // Process users matching the search query and relationships
    const processedData = userData.map((user) => {
      const isFriend = friendships.some(
        (f) =>
          f.status === "accepted" &&
          ((f.requester_id === user.uid && f.receiver_id === userId) ||
            (f.receiver_id === user.uid && f.requester_id === userId))
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

    // Only add the current user ('self') if the search query matches their name
    const currentUserData = {
      id: userId,
      name: userName,
      avatar: userAvatar || "https://via.placeholder.com/150",
      relationship: "self",
    };

    // Add current user to the results if the name matches the search query
    if (userName.toLowerCase().includes(searchQuery.toLowerCase())) {
      processedData.unshift(currentUserData);
    }

    return processedData;
  };

  const updateUserState = (
    results,
    { pendingRequests, sentRequests, userId }
  ) => {
    const friends = results.filter((user) => user.relationship === "friend");
    const pending = pendingRequests.map((req) => ({
      id: req.requester_id,
      name: req.User.name,
      avatar: req.User.avatar || "https://via.placeholder.com/150",
    }));
    const sent = sentRequests.map((req) => ({
      id: req.receiver_id,
      name: req.User.name,
      avatar: req.User.avatar || "https://via.placeholder.com/150",
    }));
    const none = results
      .filter((user) => user.relationship === "none")
      .filter((user) => user.id !== userId);

    setUsers(results);
    setFriendList(friends);
    setSentInvitations(sent);
    setRequests(pending);
    setSuggestions(none);
  };

  const resetSearchState = () => {
    setUsers([]);
    setIsSearching(false);
  };

  const goToProfileScreen = () => {
    navigation.navigate("Profile", {
      screen: "ProfileTab", // Tên tab bạn muốn điều hướng đến
      params: {
        userId: Id,
      },
    });
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
      {isSearching ? (
        <Text style={styles.searchingText}>Đang tìm kiếm...</Text>
      ) : (
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
                    <TouchableOpacity onPress={goToProfileScreen}>
                      <Image
                        source={{
                          uri: userAvatar || "https://via.placeholder.com/150", // Replace with actual current user's avatar
                        }}
                        style={styles.avatar}
                      />
                    </TouchableOpacity>
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
                  uid={friend.id}
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
      )}
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
