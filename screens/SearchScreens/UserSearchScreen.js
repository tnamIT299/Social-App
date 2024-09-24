import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
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
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    height: 40,
    marginBottom: 20,
    borderWidth: 1,
    padding: 10,
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
