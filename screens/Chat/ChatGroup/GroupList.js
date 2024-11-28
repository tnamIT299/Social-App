import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator } from "react-native";
import { supabase } from "../../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const GroupListTab = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState(null); // Lưu UID của người dùng hiện tại
  const [filteredGroups, setFilteredGroups] = useState([]); // Lưu nhóm đã được lọc

  useEffect(() => {
    // Lấy UID của người dùng hiện tại từ supabase.auth.getUser()
    const fetchUserUid = async () => {
      const { user, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        return;
      }
      if (user) {
        setUserUid(user.id);
      }
    };

    fetchUserUid();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!userUid) return; // Đợi cho đến khi có UID của người dùng

      try {
        // Lấy tất cả nhóm từ bảng Group
        const { data: groupsData, error: groupsError } = await supabase.from("Group").select("*");
        if (groupsError) {
          console.error("Lỗi khi lấy nhóm từ Supabase:", groupsError);
          return;
        }

        // Lọc các nhóm mà người dùng tham gia và có quyền admin hoặc member
        const filtered = [];
        for (let group of groupsData) {
          const { data: participantData, error: participantError } = await supabase
            .from("Participant")
            .select("role")
            .eq("groupid", group.groupid)
            .eq("Uid", userUid);

          if (participantError) {
            console.error("Lỗi khi lấy dữ liệu Participant:", participantError);
            continue;
          }

          console.log("Dữ liệu participant:", participantData); // Log dữ liệu để kiểm tra

          // Kiểm tra role là admin hoặc member
          const hasPermission = participantData.some(
            (participant) => participant.role === 'admin' || participant.role ==='member'
          );

          if (hasPermission) {
            filtered.push(group); // Thêm nhóm vào danh sách nếu có quyền
          }
        }

        setFilteredGroups(filtered); // Cập nhật danh sách nhóm đã lọc
        console.log("Các nhóm đã lọc:", filtered); // Log nhóm đã lọc

      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [userUid]); // Fetch nhóm mỗi khi UID người dùng thay đổi

  const renderGroup = ({ item }) => {
    // Giải mã dữ liệu icon của nhóm (nếu có nhiều ảnh)
    const groupIcon = item.groupicon ? JSON.parse(item.groupicon)[0] : null;

    return (
      <View style={styles.groupItem}>
        <View style={styles.avatarContainer}>
          {groupIcon ? (
            <Image source={{ uri: groupIcon }} style={styles.groupIcon} />
          ) : (
            <View style={styles.defaultIcon}>
              <Icon name="people" size={24} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupTitle}>{item.grouptitle}</Text>
        </View>
      </View>
    );
  };

  // if (loading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#0000ff" />
  //     </View>
  //   );
  // }

  return (
    <FlatList
      data={filteredGroups} // Hiển thị danh sách nhóm đã lọc
      keyExtractor={(item) => item.groupid.toString()} // Sử dụng groupid làm key
      renderItem={renderGroup}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const GroupListStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GroupListTab"
        component={GroupListTab}
        options={({ navigation }) => ({
          headerTitle: "Danh sách nhóm",
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
            ></Icon>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 10,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 15,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#ccc",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    alignContent: "center",
    textAlign: "center",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GroupListStack;
