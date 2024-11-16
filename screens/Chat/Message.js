import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import {
  sendMessageWithImage,
  deleteMessage,
} from "../../server/MessageService";
import { supabase } from "../../data/supabaseClient";
import { getUserId } from "../../data/getUserData";
import * as ImagePicker from "expo-image-picker";
import styles from "./style";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt
dayjs.extend(relativeTime);
dayjs.locale("vi");

const Message = ({ route }) => {
  const navigation = useNavigation();
  const { avatar, name, uid } = route.params;
  const [senderId, setSenderId] = useState("");
  const [userId, setuUerId] = useState("");
  const [lastOnline, setLastOnline] = useState(null);
  const [onlinestatus, setOnlineStatus] = useState(null);
  const [receiverId, setReceiverId] = useState(uid);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const flatListRef = useRef(null);

  // Lấy senderId từ getUserId khi component mount
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getUserId();
      setuUerId(userId);
      setSenderId(userId);
    };
    fetchUserId();
  }, []);

  // Lấy lastOnline từ receiverId khi component mount
  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("User") // giả sử bảng của bạn là User
        .select("onlinestatus, lastOnline")
        .eq("uid", uid)
        .single();

      if (error) {
        console.error("Error fetching last online:", error);
      } else {
        setLastOnline(data?.lastOnline);
        setOnlineStatus(data?.onlinestatus);
      }
    };

    fetchStatus();
  }, [uid]);

  // Fetch messages khi senderId hoặc receiverId thay đổi
  const fetchMessages = async () => {
    if (!senderId || !receiverId) return;

    const { data, error } = await supabase
      .from("Message")
      .select("*")
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data);
    }
  };

  useEffect(() => {
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

  const pickImage = async () => {
    const options = [
      { text: "Chọn Thư viện", onPress: () => launchGallery() },
      { text: "Chụp ảnh", onPress: () => launchCamera() },
      { text: "Hủy", onPress: () => {}, style: "cancel" },
    ];

    Alert.alert("Chọn ảnh", "Bạn muốn chọn ảnh từ đâu?", options);
  };

  const launchGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      // Thêm ảnh mới vào mảng selectedImages
      setSelectedImages([...selectedImages, pickerResult.assets[0].uri]);
    } else {
      console.log("No image selected or picker was canceled");
    }
  };

  const launchCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera is required!");
      return;
    }

    let cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!cameraResult.canceled && cameraResult.assets.length > 0) {
      // Thêm ảnh mới vào mảng selectedImages
      setSelectedImages([...selectedImages, cameraResult.assets[0].uri]);
    } else {
      console.log("No image taken or camera was canceled");
    }
  };

  const removeImage = (uri) => {
    // Hàm để xóa ảnh khỏi danh sách selectedImages
    const filteredImages = selectedImages.filter(
      (imageUri) => imageUri !== uri
    );
    setSelectedImages(filteredImages);
  };

  const sendMessage = async () => {
    try {
      // Kiểm tra nếu tin nhắn văn bản không rỗng và không có hình ảnh
      if (
        newMessage.trim() !== "" &&
        (!selectedImages || selectedImages.length === 0)
      ) {
        const { error } = await supabase.from("Message").insert([
          {
            sender_id: senderId,
            receiver_id: receiverId,
            content: newMessage,
            created_at: getLocalISOString(),
          },
        ]);

        if (error) {
          console.error("Error sending text message:", error);
          return Alert.alert("Error", "Failed to send text message");
        }

        setNewMessage(""); // Reset nội dung tin nhắn sau khi gửi thành công
        return; // Kết thúc hàm nếu chỉ gửi tin nhắn văn bản
      }

      // Kiểm tra nếu có hình ảnh
      if (selectedImages && selectedImages.length > 0) {
        const messageDetails = {
          sender_id: senderId,
          receiver_id: receiverId,
          image_url: selectedImages,
          created_at: getLocalISOString(),
        };

        // Gửi tin nhắn với hình ảnh
        const success = await sendMessageWithImage(messageDetails);
        if (!success) {
          return Alert.alert("Error", "Error sending message with image");
        }
      }

      // Nếu có cả tin nhắn văn bản và hình ảnh, gửi cả hai
      if (newMessage.trim() !== "") {
        const { error } = await supabase.from("Message").insert([
          {
            sender_id: senderId,
            receiver_id: receiverId,
            content: newMessage,
            created_at: getLocalISOString(),
          },
        ]);

        if (error) {
          console.error("Error sending text message:", error);
          return Alert.alert("Error", "Failed to send text message");
        }

        setNewMessage(""); // Reset nội dung tin nhắn sau khi gửi thành công
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", `Unexpected error: ${error.message}`);
    }
  };

  const renderMessage = ({ item }) => {
    const isSender = item.sender_id === senderId;
    const formattedTime = dayjs(item.created_at).fromNow();

    return (
      <TouchableOpacity
        onLongPress={() =>
          deleteMessage(item.id, item.sender_id, userId, fetchMessages)
        }
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.messageContainer,
            isSender ? styles.senderContainer : styles.receiverContainer,
          ]}
        >
          {/* Hiển thị avatar nếu là người nhận */}
          {!isSender && (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          )}
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
              {/* Kiểm tra nếu tin nhắn có hình ảnh */}
              {item.image_url ? (
                Array.isArray(JSON.parse(item.image_url)) &&
                JSON.parse(item.image_url).length > 0 ? (
                  JSON.parse(item.image_url).map((image, index) => (
                    <Image
                      key={index}
                      style={styles.messageImage}
                      source={{ uri: image }}
                    />
                  ))
                ) : (
                  <Image
                    style={styles.messageImage}
                    source={{ uri: JSON.parse(item.image_url)[0] }}
                  />
                )
              ) : (
                /* Hiển thị nội dung tin nhắn nếu không có hình ảnh */
                <Text
                  style={[
                    styles.messageText,
                    isSender ? styles.senderText : styles.receiverText,
                  ]}
                >
                  {item.content}
                </Text>
              )}
            </View>
            {/* Hiển thị thời gian gửi tin nhắn */}
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{name}</Text>
            <Text style={styles.lastActiveText}>
              {onlinestatus === "online"
                ? "Đang hoạt động"
                : `Hoạt động ${dayjs(lastOnline).fromNow()}`}
            </Text>
          </View>
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
            <TouchableOpacity onPress={() => navigation.navigate("SettingChat")}>
            <Icon
              name="ellipsis-horizontal-outline"
              size={25}
              color="black"
              style={styles.icon}
            />
            </TouchableOpacity>
            
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
          // Alternatively, you could use onLayout or onScroll to trigger scroll if needed
        />

        {selectedImages.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            {selectedImages.length === 1 ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: selectedImages[0] }}
                  style={styles.selectedImage}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeImage(selectedImages[0])}
                >
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                style={styles.multiImageContainer}
              >
                {selectedImages.map((imageUri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.multiSelectedImage}
                    />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeImage(imageUri)}
                    >
                      <Text style={styles.deleteButtonText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
          />

          <TouchableOpacity onPress={pickImage}>
            <Icon
              name="add-circle"
              size={30}
              color="blue"
              style={styles.iconSend}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={sendMessage}>
            <Icon name="send" size={30} color="blue" style={styles.iconSend} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Message;
