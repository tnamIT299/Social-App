import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import {
  handleAcceptFriendRequest,
  handleDeleteFriendRequest,
} from "./FriendFunction";

const FriendRequest = ({
  avatar,
  name,
  requestId,
  fetchFriendRequests,
  fetchFriendList,
  setRequestCount,
}) => {
  const onAccept = async () => {
    try {
      await handleAcceptFriendRequest(
        requestId,
        fetchFriendRequests,
        fetchFriendList,
        setRequestCount
      );
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const onDelete = async () => {
    try {
      await handleDeleteFriendRequest(
        requestId,
        fetchFriendRequests,
        setRequestCount
      );
    } catch (error) {
      console.error("Error deleting friend request:", error);
    }
  };

  return (
    <View style={styles.requestContainer}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.buttonText}>Xác nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.buttonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
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
  acceptButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
  },
});

export default FriendRequest;
