import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from "../../data/supabaseClient";
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const NotificationsReelScreenTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); // Dùng để điều hướng

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = await supabase.auth.getUser();

        if (!user?.data?.user) {
          setLoading(false);
          return;
        }

        const userId = user.data.user.id;

        const { data, error } = await supabase
          .from('Notification_Reel')
          .select('*')
          .eq('uid', userId)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching notifications:', error);
          setLoading(false);
          return;
        }

        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (nid) => {
    try {
      const { error } = await supabase
        .from('Notification_Reel')
        .update({ read: true })
        .eq('nid', nid);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.nid === nid ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error('Error in markAsRead:', err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read ? styles.read : styles.unread]}
      onPress={() => markAsRead(item.nid)}
    >
      <Text style={styles.notificationText}>{item.notification}</Text>
      <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={30} color="black" style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Thông báo Reel</Text>
      </View> */}

      {/* Danh sách thông báo */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.nid.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications available</Text>
          </View>
        }
      />
    </View>
  );
};

const NotificationsReelScreenStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NotificationsReelScreenTab"
        component={NotificationsReelScreenTab}
        options={({ navigation }) => ({
          headerTitle: "Thông báo Reel",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2F95DC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <Icon
              name="arrow-back"
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
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom : 20,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  unread: {
    borderColor: 'red',
    backgroundColor: '#ffe6e6',
  },
  read: {
    borderColor: 'gray',
    backgroundColor: '#f9f9f9',
  },
  notificationText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default NotificationsReelScreenStack;
