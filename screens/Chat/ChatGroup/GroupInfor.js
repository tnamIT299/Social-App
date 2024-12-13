import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

const GroupInforTab = ({ route, navigation }) => {
  const { groupIcon, groupName, groupId } = route.params;
  const [friendList, setFriendList] = useState([]);
  const [activeSection, setActiveSection] = useState("requests");
  const [isModalVisible, setModalVisible] = useState(false);

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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image source={{ uri: groupIcon }} style={styles.profileImage} />
          <Text style={styles.profileName}>{groupName}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="notifications-off" size={24} color="black" />
          <Text style={styles.actionButtonText}>Tắt thông báo</Text>
        </TouchableOpacity>
      </View>

      {/* Customization Section */}
      <View style={styles.customizationSection}>
        <Text style={styles.sectionTitle}>Tuỳ chỉnh</Text>
        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            navigation.navigate("EditGroup", {
              screen: "EditGroupTab",
              params: {
                groupIcon: groupIcon,
                groupName: groupName,
                groupId: groupId,
              },
            })
          }
        >
          <FontAwesome6 name="pen-to-square" size={24} color="black" />
          <Text style={styles.optionText}>Chỉnh sửa nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            navigation.navigate("MemberGroup", {
              screen: "MemberGroupTab",
              params: {
                groupId: groupId,
              },
            })
          }
        >
          <FontAwesome6 name="users" size={24} color="black" />
          <Text style={styles.optionText}>Thành viên</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() =>navigation.navigate("AddMember")}>
          <FontAwesome6 name="user-plus" size={24} color="black" />
          <Text style={styles.optionText}>Thêm thành viên</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <FontAwesome6 name="magnifying-glass" size={24} color="black" />
          <Text style={styles.optionText}>Tìm kiếm tin nhắn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <FontAwesome6 name="trash" size={24} color="black" />
          <Text style={styles.optionText}>Xoá nhóm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const GroupInforStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GroupInforTab"
        component={GroupInforTab}
        options={({ navigation }) => ({
          headerTitle: "Thông tin nhóm",
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
  header: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  profileInfo: {
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    color: "#000",
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  actionButton: {
    alignItems: "center",
  },
  actionButtonText: {
    color: "#000",
    marginTop: 5,
  },
  customizationSection: {
    padding: 15,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 18,
    marginBottom: 10,
  },
  option: {
    paddingVertical: 10,
    borderBottomColor: "#333",
    flexDirection: "row",
  },
  optionText: {
    color: "#000",
    fontSize: 18,
    marginStart: 10,
  },
  optionTextDelete: {
    color: "red",
    fontSize: 18,
    marginStart: 10,
  },
  otherActions: {
    padding: 15,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  colorOptionsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  colorOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  colorOption: {
    width: 50,
    height: 50,
    margin: 5,
    borderRadius: 25,
  },
});

export default GroupInforStack;
