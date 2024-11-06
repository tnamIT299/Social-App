import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  handleSendFriendRequest,
  handleUndoAddFriend,
  handleRemoveFriendSuggestion,
} from "./FriendFunction";

const FriendSuggestion = ({
  avatar,
  name,
  receiverId,
  fetchSuggestions,
  fetchSentInvitations,
  userId, // Thêm userId như là prop
  suggestions, // Thêm suggestions như là prop
  setSuggestions, // Thêm setSuggestions như là prop
}) => {
  const [isFriendAdded, setIsFriendAdded] = useState(false);
  const navigation = useNavigation();

  const handleAddFriend = async () => {
    try {
      await handleSendFriendRequest(
        receiverId,
        fetchSuggestions,
        fetchSentInvitations
      );
      setIsFriendAdded(true); // Chuyển sang nút Hoàn tác
    } catch (error) {
      console.error("Lỗi khi thêm bạn:", error);
    }
  };

  const handleUndo = async () => {
    try {
      await handleUndoAddFriend(receiverId, suggestions, setSuggestions);
      setIsFriendAdded(false); // Chuyển lại về nút Thêm/Ẩn
    } catch (error) {
      console.error("Lỗi khi hoàn tác thêm bạn:", error);
    }
  };

  const handleRemove = async () => {
    try {
      handleRemoveFriendSuggestion(userId, suggestions, setSuggestions); // Đã loại bỏ requestId
    } catch (error) {
      console.error("Lỗi khi xóa gợi ý bạn:", error);
    }
  };

  const goToProfileScreen = () => {
    navigation.navigate('Profile', { uid: receiverId }); // Truyền receiverId làm uid
  };

  return (
    <View style={styles.requestContainer}>
      <TouchableOpacity style={styles.userInfo} onPress={goToProfileScreen}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </TouchableOpacity>
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.buttonsContainer}>
          {isFriendAdded ? (
            <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
              <Text style={styles.buttonText}>Hoàn tác</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddFriend}
              >
                <Text style={styles.buttonText}>Thêm bạn bè</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemove}
              >
                <Text style={styles.buttonText}>Ẩn</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
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
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  undoButton: {
    backgroundColor: "#FFC107",
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  removeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
  },
});

export default FriendSuggestion;
