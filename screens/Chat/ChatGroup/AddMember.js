import React, { useEffect, useState, useCallback } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { supabase } from "../../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import { createStackNavigator } from "@react-navigation/stack";
import { FriendListItem } from "../../FriendScreens";
import { useFocusEffect } from "@react-navigation/native";
import FriendAddGroup from "../ChatGroup/MemberJoinGroup/FriendAddGroup";

const Stack = createStackNavigator();

const AddMemberTab = ({ route }) => {
  const { groupId } = route.params;
  console.log(groupId);
  const [activeSection, setActiveSection] = useState("friendList");
  const [friendList, setFriendList] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchFriendList();
    }, [])
  );

  const fetchFriendList = useCallback(async () => {
    setLoading(true); // Bắt đầu trạng thái tải
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;

    if (!currentUserId) {
      setLoading(false); // Dừng trạng thái tải
      return;
    }

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
      const friends = data.map((item) => ({
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
      }));
      setFriendList(friends);
    }

    setLoading(false); // Dừng trạng thái tải
  }, []); // useCallback để đảm bảo hàm không bị định nghĩa lại mỗi lần render

  useEffect(() => {
    // Dừng loading khi danh sách bạn bè được tải đầy đủ
    if (friendList.length > 0) {
      setLoading(false);
    }
  }, [friendList]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F95DC" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {activeSection === "friendList" &&
          friendList.map((friend) => (
            <FriendAddGroup
              key={friend.id}
              avatar={friend.avatar}
              name={friend.name}
              uid={friend.id}
              fetchFriendList={fetchFriendList}
              groupId={groupId}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const AddMemberStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddMemberTab"
        component={AddMemberTab}
        options={{
          headerTitle: "Thêm thành viên",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2F95DC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <Icon
              name="chevron-back-outline"
              size={20}
              onPress={() => navigation.goBack()}
              style={{ color: "#FFFFFF", marginLeft: 20 }}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AddMemberStack;
