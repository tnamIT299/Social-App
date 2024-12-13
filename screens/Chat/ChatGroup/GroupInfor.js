import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { getUserId } from "../../../data/getUserData";
import { supabase } from "../../../data/supabaseClient";

const Stack = createStackNavigator();

const GroupInforTab = ({ route, navigation }) => {
  const { groupIcon, groupName, groupId } = route.params;
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await getUserId();
        console.log("User ID:", userId);
        setUserId(userId);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      }
    };
    fetchUserData();
  }, []);

  const leaveGroup = async (groupId, userId, navigation) => {
    try {
      // Hiển thị xác nhận trước khi rời nhóm
      Alert.alert(
        "Xác nhận rời nhóm",
        "Bạn có chắc chắn muốn rời nhóm này không? Hành động này không thể hoàn tác.",
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Rời nhóm",
            style: "destructive",
            onPress: async () => {
              try {
                // Xóa người dùng khỏi bảng Participant
                const { error } = await supabase
                  .from("Participant")
                  .delete()
                  .eq("groupid", groupId)
                  .eq("Uid", userId);

                if (error) {
                  console.error("Lỗi khi rời nhóm:", error);
                  Alert.alert(
                    "Lỗi",
                    "Không thể rời nhóm. Vui lòng thử lại sau."
                  );
                  return;
                }

                Alert.alert("Thành công", "Bạn đã rời nhóm.");
                navigation.navigate("MessageSummary", {
                  screen: "MessageSummaryTab",
                  params: {
                    userId: userId,
                  },
                })
              } catch (err) {
                console.error("Lỗi không xác định:", err);
                Alert.alert("Lỗi", "Đã xảy ra lỗi không xác định.");
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("Lỗi khi thực hiện chức năng rời nhóm:", err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi trong quá trình rời nhóm.");
    }
  };

  const checkAdminRoleAndDeleteGroup = async () => {
    try {
      // Kiểm tra vai trò trong bảng Participant
      const { data, error } = await supabase
        .from("Participant")
        .select("role")
        .eq("groupid", groupId)
        .eq("Uid", userId)
        .single();
  
      if (error) {
        console.error("Lỗi kiểm tra vai trò:", error);
        Alert.alert("Lỗi", "Không thể kiểm tra vai trò của bạn.");
        return;
      }
  
      if (data.role !== "admin") {
        Alert.alert("Thông báo", "Chỉ QTV mới có quyền xóa nhóm.");
        return;
      }
  
      // Hiển thị xác nhận trước khi xóa nhóm
      Alert.alert(
        "Xác nhận xóa nhóm",
        "Bạn có chắc chắn muốn xóa nhóm này không? Hành động này sẽ xóa tất cả dữ liệu liên quan và không thể hoàn tác.",
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Xóa",
            style: "destructive",
            onPress: async () => {
              try {
                // Xóa tất cả tin nhắn trong bảng GroupMessage
                const { error: messageDeleteError } = await supabase
                  .from("GroupMessage")
                  .delete()
                  .eq("groupid", groupId);
  
                if (messageDeleteError) {
                  console.error("Lỗi xóa tin nhắn trong nhóm:", messageDeleteError);
                  Alert.alert("Lỗi", "Không thể xóa tin nhắn trong nhóm.");
                  return;
                }
  
                // Xóa tất cả thành viên trong bảng Participant
                const { error: participantDeleteError } = await supabase
                  .from("Participant")
                  .delete()
                  .eq("groupid", groupId);
  
                if (participantDeleteError) {
                  console.error("Lỗi xóa thành viên trong nhóm:", participantDeleteError);
                  Alert.alert("Lỗi", "Không thể xóa thành viên trong nhóm.");
                  return;
                }
  
                // Xóa nhóm khỏi bảng Group
                const { error: groupDeleteError } = await supabase
                  .from("Group")
                  .delete()
                  .eq("groupid", groupId);
  
                if (groupDeleteError) {
                  console.error("Lỗi xóa nhóm:", groupDeleteError);
                  Alert.alert("Lỗi", "Không thể xóa nhóm.");
                  return;
                }
  
                Alert.alert("Thành công", "Nhóm và tất cả dữ liệu liên quan đã được xóa.");
                navigation.navigate("MessageSummary", {
                  screen: "MessageSummaryTab",
                  params: {
                    userId: userId,
                  },
                })
              } catch (transactionError) {
                console.error("Lỗi trong quá trình xóa:", transactionError);
                Alert.alert("Lỗi", "Đã xảy ra lỗi trong quá trình xóa.");
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("Lỗi không xác định:", err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi không xác định.");
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
        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            navigation.navigate("AddMember", {
              screen: "AddMemberTab",
              params: {
                groupId: groupId,
              },
            })
          }
        >
          <FontAwesome6 name="user-plus" size={24} color="black" />
          <Text style={styles.optionText}>Thêm thành viên</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("SearchMessagesTab", { groupId: groupId })}>
          <FontAwesome6 name="magnifying-glass" size={24} color="black" />
          <Text style={styles.optionText}>Tìm kiếm tin nhắn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={() => leaveGroup(groupId, userId, navigation)}
        >
          <FontAwesome6
            name="arrow-right-from-bracket"
            size={24}
            color="black"
          />
          <Text style={styles.optionText}>Rời nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={checkAdminRoleAndDeleteGroup}
        >
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
