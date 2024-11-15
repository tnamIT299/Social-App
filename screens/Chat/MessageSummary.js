import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import {supabase} from "../../data/supabaseClient";

const fetchLastMessages = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('Message')
        .select('sender_id, receiver_id, content, image_url, created_at')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
  
      // Nhóm các tin nhắn theo đối tác trò chuyện
      const conversations = {};
      data.forEach((message) => {
        const partnerId =
          message.sender_id === userId ? message.receiver_id : message.sender_id;
        if (!conversations[partnerId]) {
          conversations[partnerId] = message;
        }
      });
  
      return Object.values(conversations);
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  };
  
  const MessageSummary = () => {
    const route = useRoute();
    const { userId } = route.params; // Nhận userId từ route params
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchData = async () => {
        const messages = await fetchLastMessages(userId);
        setConversations(messages);
        setLoading(false);
      };
      fetchData();
    }, [userId]);
  
    const renderItem = ({ item }) => {
      const isImage = item.image_url != null;
      const partnerId =
        item.sender_id === userId ? item.receiver_id : item.sender_id;
  
      return (
        <View style={styles.itemContainer}>
          <Text style={styles.userId}>Đoạn hội thoại với: {partnerId}</Text>
          <Text style={styles.message}>
            {isImage ? 'Đã gửi 1 hình ảnh' : 'Đã gửi bạn 1 tin nhắn'}
          </Text>
        </View>
      );
    };
  
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }
  
    return (
      <FlatList
        data={conversations}
        keyExtractor={(item) =>
          `${item.sender_id}_${item.receiver_id}_${item.created_at}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    );
  };
  
  const styles = StyleSheet.create({
    listContainer: {
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    itemContainer: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    userId: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    message: {
      fontSize: 14,
      color: '#666',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  
  export default MessageSummary;