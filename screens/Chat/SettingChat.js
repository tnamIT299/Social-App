import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { handleColorChange } from "../../cache/cacheColor";
import { supabase } from "../../data/supabaseClient";
import { blockUser, unblockUser } from "./BlockFn";
const Stack = createStackNavigator();

const SettingChatTab = ({ route, navigation }) => {
  const { avatar, name, uid, receiverId, senderId } = route.params;
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#a0e7ff");
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkIfBlocked = async () => {
      const { data, error } = await supabase
        .from("BlockedList")
        .select("id")
        .eq("blocker_id", senderId)
        .eq("blocked_id", receiverId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Lỗi kiểm tra trạng thái chặn:", error);
      } else {
        setIsBlocked(!!data); // Nếu có dữ liệu thì set là true
      }
    };

    checkIfBlocked();
  }, [senderId, receiverId]);

  const toggleBlock = async () => {
    if (isBlocked) {
      // Bỏ chặn
      const success = await unblockUser(senderId, receiverId);
      if (success) {
        setIsBlocked(false);
      }
    } else {
      // Chặn
      const success = await blockUser(senderId, receiverId);
      if (success) {
        setIsBlocked(true);
        Alert.alert("Thành công", "Đã chặn người dùng.");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image source={{ uri: avatar }} style={styles.profileImage} />
          <Text style={styles.profileName}>{name}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("Profile", {
              screen: "ProfileTab",
              params: {
                userId: uid,
              },
            })
          }
        >
          <FontAwesome6 name="user" size={24} color="black" />
          <Text style={styles.actionButtonText}>Trang cá nhân</Text>
        </TouchableOpacity>
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
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome6 name="palette" size={24} color="black" />
          <Text style={styles.optionText}>Chủ đề</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <FontAwesome6 name="a" size={24} color="black" />
          <Text style={styles.optionText}>Biệt danh</Text>
        </TouchableOpacity>
      </View>

      {/* Other Actions */}
      <View style={styles.otherActions}>
        <Text style={styles.sectionTitle}>Hành động khác</Text>
        <TouchableOpacity
          style={styles.option}
          onPress={() =>
            navigation.navigate("SearchMessage", { receiverId, senderId })
          }
        >
          <FontAwesome6 name="magnifying-glass" size={24} color="black" />
          <Text style={styles.optionText}>Tìm kiếm tin nhắn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <FontAwesome6 name="trash" size={24} color="black" />
          <Text style={styles.optionTextDelete}>
            Xoá toàn bộ cuộc hội thoại
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={toggleBlock}>
          <FontAwesome6
            name={isBlocked ? "user-check" : "user-slash"}
            size={24}
            color="black"
          />
          <Text style={isBlocked ? styles.optionText : styles.optionTextDelete}>
            {isBlocked ? "Bỏ chặn" : "Chặn"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Color Selection Modal */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.colorOptionsContainer}>
              <Text style={styles.modalTitle}>Chọn chủ đề</Text>
              <View style={styles.colorOptions}>
                {[
                  "#FF5733",
                  "#33FF57",
                  "#3357FF",
                  "#FF33A1",
                  "#A1FF33",
                  "#A0E7FF",
                ].map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.colorOption, { backgroundColor: color }]}
                    onPress={() =>
                      handleColorChange(
                        color,
                        setSelectedColor,
                        setModalVisible,
                        navigation,
                        uid,
                        avatar,
                        name
                      )
                    }
                  />
                ))}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

const SettingChatStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingChatTab"
        component={SettingChatTab}
        options={({ navigation }) => ({
          headerTitle: "Tuỳ chỉnh",
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

export default SettingChatStack;
