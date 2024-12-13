import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../data/supabaseClient";
import { updateGroupInfor } from "../../../server/GroupService";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const MemberGroupTab = ({ route }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Lấy danh sách từ bảng Participant
        const { data: participants, error: participantError } = await supabase
          .from("Participant")
          .select("Uid, role")
          .eq("groupid", groupId);

        if (participantError) {
          console.error("Error fetching participants:", participantError);
          return;
        }

        const userIds = participants.map((participant) => participant.Uid);

        // Lấy thông tin từ bảng User
        const { data: users, error: userError } = await supabase
          .from("User")
          .select("uid, name, avatar")
          .in("uid", userIds);

        if (userError) {
          console.error("Error fetching users:", userError);
          return;
        }

        // Kết hợp dữ liệu Participant và User
        const memberList = participants.map((participant) => {
          const user = users.find((user) => user.uid === participant.Uid);
          return {
            name: user?.name || "Unknown",
            avatar: user?.avatar || "https://via.placeholder.com/50",
            role: participant.role,
          };
        });

        setMembers(memberList);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải danh sách thành viên...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {members.length > 0 ? (
        members.map((member, index) => (
          <View key={index} style={styles.memberItem}>
            <Image
              source={{ uri: member.avatar }}
              style={styles.memberAvatar}
            />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              
              <Text style={styles.memberRole}>
                {member.role === "admin" ? "Quản trị viên" : "Thành viên"}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text>Không có thành viên trong nhóm.</Text>
      )}
    </ScrollView>
  );
};

const MemberGroupStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MemberGroupTab"
        component={MemberGroupTab}
        options={({ navigation }) => ({
          headerTitle: "Thành viên nhóm",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2F95DC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <Icon
              name="chevron-back-outline"
              size={20}
              onPress={() => navigation.goBack()}
              style={{ color: "#FFFFFF", marginLeft: 20 }}
            ></Icon>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  memberRole: {
    fontSize: 14,
    color: "#666",
  },
});

export default MemberGroupStack;
