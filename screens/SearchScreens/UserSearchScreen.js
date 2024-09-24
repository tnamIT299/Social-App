import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient"; // Giả định bạn đã cấu hình Supabase client

const UserSearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (searchQuery) {
      fetchUsers(searchQuery);
    } else {
      setUsers([]); // Khi không có query thì không hiển thị người dùng nào
    }
  }, [searchQuery]);

  const fetchUsers = async (query) => {
    try {
      // Truy vấn người dùng từ Supabase dựa trên từ khóa tìm kiếm
      let { data, error } = await supabase
        .from("User")
        .select("uid, name, avatar")
        .ilike("name", `%${query}%`); // Tìm kiếm người dùng với tên chứa từ khóa (case-insensitive)

      if (error) {
        console.error("Lỗi khi lấy danh sách người dùng:", error);
      } else {
        // Cập nhật danh sách người dùng
        setUsers(data);
      }
    } catch (error) {
      console.error("Lỗi kết nối Supabase:", error);
    }
  };

  const handleAddOrRemove = (id, added) => {
    // Placeholder function để xử lý thêm hoặc xóa bạn bè
    const updatedUsers = users.map((user) => {
      if (user.uid === id) {
        return { ...user, added: !added };
      }
      return user;
    });
    setUsers(updatedUsers);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.boxSearch}
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid.toString()}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Text>{item.name}</Text>
              <TouchableOpacity
                style={item.added ? styles.removeButton : styles.addButton}
                onPress={() => handleAddOrRemove(item.uid, item.added)}
              >
                <Text>{item.added ? "Xoá" : "Thêm"}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    paddingTop: 45, // Để tạo khoảng cách từ trên cùng
    justifyContent: "center", // Căn giữa ngang
    alignItems: "center", // Căn giữa dọc
    paddingHorizontal: 15,
  },
  boxSearch: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 40,
    width: "90%",
    alignSelf: "center", // Căn giữa thanh tìm kiếm
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
  },
  addButton: {
    backgroundColor: "blue",
    padding: 10,
  },
  removeButton: {
    backgroundColor: "red",
    padding: 10,
  },
});

export default UserSearchScreen;
