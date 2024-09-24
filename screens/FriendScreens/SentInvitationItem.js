import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { handleRevokeInvitation } from "./FriendFunction";

const SentInvitationItem = ({
  avatar,
  name,
  receiverId,
  fetchSentInvitations,
}) => {
  const onRevoke = async () => {
    try {
      await handleRevokeInvitation(receiverId, fetchSentInvitations); // Gọi hàm hoàn tác lời mời
    } catch (error) {
      console.error("Lỗi khi thu hồi yêu cầu:", error);
    }
  };

  return (
    <View style={styles.requestContainer}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
        <TouchableOpacity style={styles.revokeButton} onPress={onRevoke}>
          <Text style={styles.buttonText}>Thu hồi yêu cầu</Text>
        </TouchableOpacity>
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
  revokeButton: {
    backgroundColor: "#FFC107",
    padding: 10,
    borderRadius: 5,
  },
});

export default SentInvitationItem;
