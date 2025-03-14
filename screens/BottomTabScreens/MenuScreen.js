import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../data/supabaseClient";

const MenuScreen = ({ navigation }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState("");
  const [uid, setUid] = useState("");

  useEffect(() => {
    const fetchUserAvatar = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from("User")
          .select("uid, avatar, name")
          .eq("uid", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data: ", error);
        } else {
          setUsername(data.name);
          setAvatarUrl(data.avatar);
          setUid(data.uid);
        }
      }
    };
    fetchUserAvatar();
  }, []);

  const getLocalISOString = () => {
    const localTimeOffset = 7 * 60 * 60 * 1000;
    const localDate = new Date(new Date().getTime() + localTimeOffset);
    return localDate.toISOString();
  };

  const handleAccount = () => {
    navigation.navigate("Account", { username, avatarUrl });
  };

  const handleSignOut = () => {
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        onPress: async () => {
          try {
            const {
              data: { user },
              error: fetchUserError,
            } = await supabase.auth.getUser();

            if (fetchUserError) {
              Alert.alert("Có lỗi xảy ra", fetchUserError.message);
              return;
            }

            if (user) {
              const { error: updateError } = await supabase
                .from("User")
                .update({
                  onlinestatus: null,
                  currentDevice: null,
                  lastOnline: getLocalISOString(),
                })
                .eq("uid", user.id);

              if (updateError) {
                Alert.alert(
                  "Có lỗi khi cập nhật thông tin người dùng",
                  updateError.message
                );
                return;
              }

              await supabase.auth.signOut();
              Alert.alert("Đăng xuất thành công");

              navigation.navigate("Login");
            }
          } catch (error) {
            Alert.alert("Có lỗi xảy ra", error.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Menu</Text>

      {/* Thông tin người dùng */}
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() =>
          navigation.navigate("Profile", {
            screen: "ProfileTab",
            params: {
              userId: uid,
              anonymusId:uid,
            },
          })
        }
      >
        <Image
          source={{
            uri: avatarUrl || "https://via.placeholder.com/150",
          }}
          style={styles.userImage}
        />
        <Text style={styles.userName}>{username}</Text>
      </TouchableOpacity>
      <ScrollView>
        {/* Danh sách mục menu */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("FriendsScreen")}>
          <Ionicons name="people-outline" size={24} color="#0066ff" />
          <Text style={styles.menuText}>Bạn bè</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="bookmark-outline" size={24} color="#0066ff" />
          <Text style={styles.menuText}>Bài viết đã lưu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MarketplaceScreen")}>
          <MaterialIcons name="storefront" size={24} color="#0066ff" />
          <Text style={styles.menuText}>Marketplace</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAccount}>
          <Ionicons name="settings-outline" size={24} color="#0066ff" />
          <Text style={styles.menuText}>Cài đặt tài khoản</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={24} color="#0066ff" />
          <Text style={styles.menuText}>Quyền riêng tư</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#0066ff" />
          <Text style={styles.menuText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 70,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0066ff",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
  },
});

export default MenuScreen;