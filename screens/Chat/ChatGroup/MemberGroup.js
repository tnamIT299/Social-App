import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../../data/supabaseClient";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const MemberGroupTab = ({ route }) => {
  const { groupId } = route.params;
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [members, setMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Lấy danh sách từ bảng Participant
        const { data: participants, error: participantError } = await supabase
          .from("Participant")
          .select("Uid, role")
          .eq("groupid", groupId);

        if (participantError) {
          console.error("Error fetching participants:", participantError);
          return;
        }

        // Lấy user hiện tại
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;

        if (!currentUserId) {
          console.error("Không thể xác định user hiện tại.");
          return;
        }

        // Lấy vai trò của user hiện tại
        const currentUser = participants.find(
          (participant) => participant.Uid === currentUserId
        );

        setCurrentUserRole(currentUser?.role || "member");

        // Lấy thông tin từ bảng User
        const userIds = participants.map((participant) => participant.Uid);
        const { data: users, error: userError } = await supabase
          .from("User")
          .select("uid, name, avatar")
          .in("uid", userIds);

        if (userError) {
          console.error("Error fetching users:", userError);
          return;
        }

        // Kết hợp dữ liệu Participant và User
        const memberList = participants.map((participant) => {
          const user = users.find((user) => user.uid === participant.Uid);
          return {
            name: user?.name || "Unknown",
            avatar: user?.avatar || "https://via.placeholder.com/50",
            uid: user?.uid,
            role: participant.role,
          };
        });

        setMembers(memberList);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const handleOpenModal = (event, member) => {
    const { pageY, pageX } = event.nativeEvent;
    const windowWidth = Dimensions.get("window").width;

    setModalPosition({
      top: pageY + 10,
      right: windowWidth - pageX - 10,
    });
    setSelectedMember(member); // Lưu thành viên được chọn
    setModalVisible(true);
  };

  const removeMember = async (groupId, userId) => {
    try {
      const { error } = await supabase
        .from("Participant")
        .delete()
        .eq("groupid", groupId)
        .eq("Uid", userId);
  
      if (error) {
        console.error("Lỗi khi xoá thành viên:", error);
        Alert.alert("Không thể xóa thành viên", error.message);
        return false;
      }
  
      Alert.alert("Thành công", "Đã xoá thành viên khỏi nhóm");
      return true;
    } catch (error) {
      console.error("Lỗi không mong đợi:", error);
      Alert.alert("Lỗi không mong đợi", error.message);
      return false;
    }
  };
  const handleRemoveMember = async (member) => {
    const confirmed = await new Promise((resolve) =>
      Alert.alert(
        "Xác nhận",
        `Bạn có chắc chắn muốn xóa ${member.name} khỏi nhóm?`,
        [
          { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
          { text: "Xóa", style: "destructive", onPress: () => resolve(true) },
        ]
      )
    );
  
    if (confirmed) {
      const success = await removeMember(groupId, member.uid);
      if (success) {
        // Cập nhật lại danh sách thành viên sau khi xóa
        setMembers((prevMembers) =>
          prevMembers.filter((m) => m.uid !== member.uid)
        );
      }
    }
  };
  
  
  const grantAdminRights = async (member) => {
    try {
      const { error } = await supabase
        .from("Participant")
        .update({ role: "admin" })
        .eq("groupid", groupId)
        .eq("Uid", member.uid);

      if (error) {
        console.error("Lỗi khi cấp quyền admin:", error);
        Alert.alert("Lỗi", "Không thể cấp quyền quản trị viên.");
      } else {
        Alert.alert("Thành công", `${member.name} đã được cấp quyền quản trị viên.`);
        setModalVisible(false);

        // Cập nhật danh sách thành viên
        setMembers((prevMembers) =>
          prevMembers.map((m) =>
            m.uid === member.uid ? { ...m, role: "admin" } : m
          )
        );
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi không mong muốn.");
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải danh sách thành viên...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {members.length > 0 ? (
        members.map((member, index) => (
          <View key={index} style={styles.memberItem}>
            <Image
              source={{ uri: member.avatar }}
              style={styles.memberAvatar}
            />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>
                {member.role === "admin" ? "Quản trị viên" : "Thành viên"}
              </Text>
            </View>
            {/* Hiển thị icon nếu user hiện tại là admin */}
            {currentUserRole === "admin" && member.role !== "admin" && (
              <TouchableOpacity
                onPress={(event) => handleOpenModal(event, member)}
              >
                <Icon
                  name="ellipsis-vertical-outline"
                  size={30}
                  color="black"
                  style={styles.icon}
                />
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <Text>Không có thành viên trong nhóm.</Text>
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { top: modalPosition.top, right: modalPosition.right },
            ]}
          >
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => grantAdminRights(selectedMember)}
            >
              <Text style={styles.optionText}>Cấp quyền quản trị viên</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleRemoveMember(selectedMember)}
            >
              <Text style={styles.optionText}>Xoá khỏi nhóm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const MemberGroupStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MemberGroupTab"
        component={MemberGroupTab}
        options={({ navigation }) => ({
          headerTitle: "Thành viên nhóm",
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
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  memberRole: {
    fontSize: 14,
    color: "#666",
  },
  modalOverlay: {
    bottom: 20,
    flex: 1,
    justifyContent: "flex-start",
  },
  modalContent: {
    position: "absolute",
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 20,
    width: 190,
    zIndex: 999,
  },
  optionItem: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  optionText: {
    color: "black",
    fontSize: 15,
    marginLeft: 10,
  },
});

export default MemberGroupStack;
