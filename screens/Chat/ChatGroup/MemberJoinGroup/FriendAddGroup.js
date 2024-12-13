import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../../../data/supabaseClient";

const FriendAddGroup = ({ avatar, name, uid, fetchFriendList, groupId }) => {
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      fetchFriendList(); // Tải lại danh sách bạn bè khi màn hình được focus
    }, [fetchFriendList])
  );

  const addToGroup = async (userId, groupId) => {
    try {
      // Kiểm tra nếu đã tồn tại trong nhóm
      const { data: existingMember, error: checkError } = await supabase
        .from("Participant")
        .select("*")
        .eq("groupid", groupId)
        .eq("Uid", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Lỗi kiểm tra thành viên:", checkError);
        return Alert.alert("Lỗi", "Không thể kiểm tra thành viên.");
      }

      if (existingMember) {
        return Alert.alert("Thông báo", "Người dùng đã có trong nhóm.");
      }

      // Thêm thành viên vào bảng Participant
      const { error } = await supabase
        .from("Participant")
        .insert([{ groupid: groupId, Uid: userId, role: "member" }]);

      if (error) {
        console.error("Lỗi thêm thành viên:", error);
        return Alert.alert("Lỗi", "Không thể thêm thành viên vào nhóm.");
      }

      Alert.alert("Thành công", "Thành viên đã được thêm vào nhóm.");
      fetchFriendList(); // Làm mới danh sách bạn bè
    } catch (err) {
      console.error("Lỗi không xác định:", err);
      Alert.alert("Lỗi", "Đã xảy ra lỗi không xác định.");
    }
  };

  return (
    <View style={styles.requestContainer}>
      <TouchableOpacity style={styles.userInfo}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </TouchableOpacity>
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => addToGroup(uid, groupId)}>
          <Icon
            name="add-outline"
            size={30}
            color="black"
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  requestContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 30,
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

export default FriendAddGroup;
