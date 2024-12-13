import React, { useEffect, useState } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { createStackNavigator } from "@react-navigation/stack";
import { createGroup } from "../../../server/GroupService";

const Stack = createStackNavigator();

const AddMemberTab = () => {
  return (
    <View>
      <Text>AddMember</Text>
    </View>
  )
};
const AddMemberStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddMemberTab"
        component={AddMemberTab}
        options={({ navigation }) => ({
          headerTitle: "Thêm thành viên",
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

export default AddMemberStack