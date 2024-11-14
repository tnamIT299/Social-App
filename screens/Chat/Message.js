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
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
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
  const [lastOnline, setLastOnline] = useState(null);
  const [receiverId, setReceiverId] = useState(uid);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const flatListRef = useRef(null);

  // Lấy senderId từ getUserId khi component mount
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getUserId();
      setSenderId(userId);
    };
    fetchUserId();
  }, []);

  // Lấy lastOnline từ receiverId khi component mount
  useEffect(() => {
    const fetchLastOnline = async () => {
      const { data, error } = await supabase
        .from("User") // giả sử bảng của bạn là User
        .select("lastOnline")
        .eq("uid", uid)
        .single();

      if (error) {
        console.error("Error fetching last online:", error);
      } else {
        setLastOnline(data?.lastOnline);
      }
    };

    fetchLastOnline();
  }, [uid]);

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

  const removeAllImages = () => {
    setSelectedImages([]); // Làm trống danh sách ảnh
  };

  const sendMessage = async (imageUrl) => {
    if (newMessage.trim() !== "") {
      const { error } = await supabase.from("Message").insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content: newMessage || "",
          image_url: imageUrl,
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
            {/* Kiểm tra nếu tin nhắn có image_url, hiển thị ảnh; nếu không, hiển thị nội dung */}
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.messageImage}
              />
            ) : (
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
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{name}</Text>
            <Text style={styles.lastActiveText}>
              Hoạt động {dayjs(lastOnline).fromNow()}
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
          ) : selectedImages.length > 1 ? (
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
                    onPress={() => removeAllImages()}
                  >
                    <Text style={styles.deleteButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

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
