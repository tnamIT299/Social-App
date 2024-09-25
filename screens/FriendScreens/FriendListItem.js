import React from "react";
import { View, Text, StyleSheet, Image, Button, Alert } from "react-native";
import { handleRemoveFriend } from "./FriendFunction";

const FriendListItem = ({ avatar, name, friendId, fetchFriendList }) => {
  // Hàm xử lý xóa quan hệ bạn bè
  const removeFriend = async () => {
    const result = await handleRemoveFriend(friendId);

    if (result.success) {
      Alert.alert("Thành công", "Đã xóa quan hệ bạn bè thành công");
      // Cập nhật lại danh sách bạn bè sau khi xóa thành công
      fetchFriendList();
    } else {
      console.error(result.error);
      Alert.alert(
        "Lỗi",
        result.error || "Đã xảy ra lỗi khi xóa quan hệ bạn bè"
      );
    }
  };

  return (
    <View style={styles.requestContainer}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
      </View>
      <Button title="Xóa" color="#FF0000" onPress={removeFriend} />
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

export default FriendListItem;
