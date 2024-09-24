import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const FriendListItem = ({ avatar, name }) => {
  return (
    <View style={styles.requestContainer}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
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
});

export default FriendListItem;
