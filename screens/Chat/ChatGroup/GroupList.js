import React, { useState, useEffect } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { supabase } from "../../../data/supabaseClient";
import { getUserId } from "../../../data/getUserData";
import Icon from "react-native-vector-icons/Ionicons";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const GroupListTab = () => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState([]); // Danh sách nhóm
  const [loading, setLoading] = useState(true); // Trạng thái tải
  const [userUid, setUserUid] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredGroups, setFilteredGroups] = useState([]);

  // Lấy UID người dùng
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserId(); // Giả định hàm getUserId trả về UID từ Supabase
      setUserUid(id);
      console.log("User UID:", id); // Log UID để kiểm tra
    };
    fetchUserId();
  }, []);

  // Lấy danh sách nhóm mà người dùng tham gia
  useEffect(() => {
    const fetchGroups = async () => {
      if (!userUid) return; // Đợi cho đến khi UID của người dùng được thiết lập

      try {
        // Truy vấn Participant để lấy groupid
        const { data: participantData, error: participantError } =
          await supabase
            .from("Participant")
            .select("groupid")
            .eq("Uid", userUid)
            .in("role", ["admin", "member"]);

        if (participantError) {
          console.error("Participant query error:", participantError);
          return;
        }

        console.log("Participant Data:", participantData); // Log dữ liệu Participant

        const groupIds = participantData.map(
          (participant) => participant.groupid
        );

        if (groupIds.length === 0) {
          setGroups([]); // Nếu không có nhóm nào, trả về danh sách rỗng
          return;
        }

        // Truy vấn Group để lấy thông tin chi tiết
        const { data: groupsData, error: groupsError } = await supabase
          .from("Group")
          .select("*")
          .in("groupid", groupIds);

        if (groupsError) {
          console.error("Group query error:", groupsError);
          return;
        }

        console.log("Group Data:", groupsData); // Log dữ liệu Group

        setGroups(groupsData); // Lưu danh sách nhóm
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false); // Kết thúc trạng thái tải
      }
    };

    fetchGroups();
  }, [userUid]); // Chạy lại khi userUid thay đổi

  const renderGroup = ({ item }) => {
    const groupIcon = item.groupicon ? JSON.parse(item.groupicon)[0] : null;
    const groupName = item.grouptitle;
    const groupId = item.groupid;
    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() =>
          navigation.navigate("GroupMessage", { groupName, groupIcon, groupId })
        }
      >
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
      </TouchableOpacity>
    );
  };

  const handleSearch = (text) => {
    setSearchText(text);

    if (text === "") {
      setFilteredGroups(groups); // Nếu không có tìm kiếm, hiển thị tất cả nhóm
    } else {
      const filtered = groups.filter((item) =>
        item.grouptitle.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredGroups(filtered); // Lọc và cập nhật danh sách nhóm
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Không có nhóm nào để hiển thị.</Text>
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
      <FlatList
        data={searchText === "" ? groups : filteredGroups} 
        keyExtractor={(item) => item.groupid.toString()} 
        renderItem={renderGroup}
        contentContainerStyle={styles.listContainer}
      />
    </View>
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
  groupDescription: {
    fontSize: 14,
    color: "#555",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GroupListStack;
