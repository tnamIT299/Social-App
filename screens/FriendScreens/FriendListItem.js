import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Button, Alert } from "react-native";
import { handleRemoveFriend } from "./FriendFunction";
import Message from "../Chat/Message";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/Ionicons';

const FriendListItem = ({ avatar, name, uid, fetchFriendList }) => {
  const navigation = useNavigation();
  // Hàm xử lý xóa quan hệ bạn bè
  const removeFriend = async () => {
    const result = await handleRemoveFriend(uid);

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

  const goToChatScreen = () => {
    navigation.navigate('Message', { avatar, name, uid });
  };
  const goToProfileScreen = () => {
    navigation.navigate('Profile', { uid });
  };


  return (
    <View style={styles.requestContainer}>
      <TouchableOpacity style={styles.userInfo} onPress={goToProfileScreen}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
        </TouchableOpacity>
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.buttonContainer}>
      <Icon name="chatbubble-ellipses-outline" size={30} color="black" style={styles.icon} onPress={goToChatScreen}/>
      <Icon name="close-circle-outline" size={30} color="red" style={styles.icon} onPress={removeFriend} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '25%',
    marginRight: 20,
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
