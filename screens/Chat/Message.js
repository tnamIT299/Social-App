import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import { getUserId } from "../../data/getUserData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt

const Message = ({ route }) => {
  const navigation = useNavigation();
  const { avatar, name, uid } = route.params;
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState(uid);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef(null);

  // Lấy senderId từ getUserId khi component mount
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getUserId();
      setSenderId(userId);
    };
    fetchUserId();
  }, []);

  // Fetch messages khi senderId hoặc receiverId thay đổi
  useEffect(() => {
    const fetchMessages = async () => {
      if (!senderId || !receiverId) return;

      const { data, error } = await supabase
        .from("Message")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        ) // Chỉ lấy tin nhắn giữa A và B hoặc B và A
        .order("created_at", { ascending: true }); // Sắp xếp tin nhắn theo thời gian

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data);
      }
    };

    fetchMessages();
  }, [senderId, receiverId]);

  // Đăng ký lắng nghe sự kiện realtime từ bảng messages
  useEffect(() => {
    if (!senderId || !receiverId) return;

    const messageChannel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message" },
        (payload) => {
          const newMessage = payload.new;

          // Chỉ thêm tin nhắn nếu đúng cặp `sender_id` và `receiver_id`
          if (
            (newMessage.sender_id === senderId &&
              newMessage.receiver_id === receiverId) ||
            (newMessage.sender_id === receiverId &&
              newMessage.receiver_id === senderId)
          ) {
            setMessages((prevMessages) =>
              [...prevMessages, newMessage].sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
              )
            );
            // Cuộn FlatList đến tin nhắn cuối cùng khi có tin nhắn mới
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [senderId, receiverId]);

  // Cuộn đến cuối danh sách khi tin nhắn được tải xong lần đầu tiên
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Hàm lấy thời gian theo múi giờ địa phương
  const getLocalISOString = () => {
    const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
    const localDate = new Date(new Date().getTime() + localTimeOffset);
    return localDate.toISOString();
  };

  const sendMessage = async () => {
    if (newMessage.trim() !== "") {
      const { error } = await supabase.from("Message").insert([
        {
          sender_id: senderId, // Người gửi
          receiver_id: receiverId, // Người nhận
          content: newMessage,
          created_at: getLocalISOString(),
        },
      ]);

      if (error) {
        console.error("Error sending message:", error);
      } else {
        setNewMessage("");
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isSender = item.sender_id === senderId;
    const formattedTime = dayjs(item.created_at).fromNow();

    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.senderContainer : styles.receiverContainer,
        ]}
      >
        {!isSender && <Image source={{ uri: avatar }} style={styles.avatar} />}
        <View
          style={[
            styles.messageBubbleContainer,
            isSender
              ? styles.senderBubbleContainer
              : styles.receiverBubbleContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isSender ? styles.senderBubble : styles.receiverBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isSender ? styles.senderText : styles.receiverText,
              ]}
            >
              {item.content}
            </Text>
          </View>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={15}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back-outline" size={25} color="black" />
          </TouchableOpacity>
          <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          <Text style={styles.headerTitle}>{name}</Text>
          <View style={styles.headerIcons}>
            <Icon
              name="call-outline"
              size={25}
              color="black"
              style={styles.icon}
            />
            <Icon
              name="videocam-outline"
              size={25}
              color="black"
              style={styles.icon}
            />
            <Icon
              name="ellipsis-horizontal-outline"
              size={25}
              color="black"
              style={styles.icon}
            />
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
          />

          <TouchableOpacity>
            <Icon name="add-circle" size={30} color="blue" style={styles.iconSend} />
          </TouchableOpacity>
          <TouchableOpacity onPress={sendMessage}>
            <Icon name="send" size={30} color="blue" style={styles.iconSend} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerBack: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 18,
    color: "#000",
  },
  headerIcons: {
    flexDirection: "row",
  },
  icon: {
    marginHorizontal: 10,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  senderContainer: {
    justifyContent: "flex-end",
  },
  receiverContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageBubbleContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    maxWidth: "80%",
  },
  senderBubbleContainer: {
    alignSelf: "flex-end",
  },
  receiverBubbleContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: "auto",
  },
  senderBubble: {
    backgroundColor: "#a0e7ff",
    marginRight: 10,
  },
  receiverBubble: {
    backgroundColor: "#e0e0e0",
    marginLeft: 10,
  },
  messageText: {
    fontSize: 16,
  },
  senderText: {
    color: "#000",
  },
  receiverText: {
    color: "#333",
  },
  timeText: {
    // Thêm class này để hiển thị thời gian
    fontSize: 12,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 5,
    marginRight: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
  },
  iconSend: {
    marginHorizontal: 5,
  },
});

export default Message;
