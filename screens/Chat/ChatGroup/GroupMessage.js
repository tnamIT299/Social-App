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
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../data/supabaseClient";
import {
  sendMessageWithImage,
  editMessage,
  deleteMessage,
} from "../../../server/GroupMessageService";
import { getUserId } from "../../../data/getUserData";
import {
  pickImage,
  launchGallery,
  launchCamera,
  removeImage,
} from "../imagePickerHelper";
import * as ImagePicker from "expo-image-picker";
import styles from "./style";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
dayjs.extend(relativeTime);
dayjs.locale("vi");
const GroupMessage = ({ route }) => {
  const { groupIcon, groupName, groupId } = route.params;
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [senderId, setSenderId] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [senderNames, setSenderNames] = useState({}); // State để lưu tên người gửi theo sender_id
  const [editingMessageId, setEditingMessageId] = useState(null); // ID of the comment being edited
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getUserId();
      setSenderId(userId);
      setUserId(userId);
    };
    fetchUserId();
  }, []);

  const handleOpenModal = (event, message) => {
    const { pageY, pageX } = event.nativeEvent;
    const windowWidth = Dimensions.get("window").width;

    setModalPosition({
      top: pageY - 50,
      right: windowWidth - pageX + 20,
    });
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const fetchMessages = async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from("GroupMessage")
        .select("*")
        .eq("groupid", groupId)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error fetching group messages:", error);
        return;
      }

      setMessages(data);
    } catch (error) {
      console.error("Unexpected error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [groupId]);

  // Hook lắng nghe realtime tin nhắn mới
  useEffect(() => {
    if (!senderId || !groupId) return;

    const messageChannel = supabase
      .channel("realtime-group-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "GroupMessage" },
        (payload) => {
          const newMessage = payload.new;

          if (newMessage.groupid === groupId) {
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages, newMessage].sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
              );
              return updatedMessages;
            });

            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "GroupMessage" },
        (payload) => {
          const deletedMessage = payload.old;

          if (deletedMessage.groupid === groupId) {
            setMessages((prevMessages) =>
              prevMessages.filter((message) => message.id !== deletedMessage.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [senderId, groupId]);

  // Lấy tên người gửi (sender_name) từ bảng User khi tin nhắn được tải
  useEffect(() => {
    const fetchSenderNames = async () => {
      const senderIds = [...new Set(messages.map((msg) => msg.sender_id))];
      const { data, error } = await supabase
        .from("User")
        .select("uid, name")
        .in("uid", senderIds);

      if (error) {
        console.error("Error fetching sender names:", error);
      } else {
        const senderNames = data.reduce((acc, user) => {
          acc[user.uid] = user.name;
          return acc;
        }, {});
        setSenderNames(senderNames);
      }
    };

    if (messages.length > 0) {
      fetchSenderNames();
    }
  }, [messages]);

  const getLocalISOString = () => {
    const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
    const localDate = new Date(new Date().getTime() + localTimeOffset);
    return localDate.toISOString();
  };
const handleEditMessage = async (messageId) => {
    if (newMessage.trim() === "") {
      Alert.alert("Lỗi", "Nội dung tin nhắn không được để trống.");
      return;
    }

    try {
      const { success, message: resultMessage } = await editMessage(
        messageId,
        newMessage,
        fetchMessages
      );

      if (success) {
        setEditingMessageId(null); 
        setNewMessage("");
      } else {
        Alert.alert("Lỗi", resultMessage || "Không thể chỉnh sửa tin nhắn.");
      }
    } catch (error) {
      console.error("Lỗi khi chỉnh sửa tin nhắn:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi chỉnh sửa tin nhắn.");
    }
  };
  // Hàm render tin nhắn
  const renderMessage = ({ item }) => {
    const isSender = item.sender_id === senderId;
    const formattedTime = dayjs(item.timestamp).fromNow();

    return (
      <TouchableOpacity
        onLongPress={(event) => {
          if (isSender) {
            handleOpenModal(event, item);
          }
        }}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.messageContainer,
            isSender ? styles.senderContainer : styles.receiverContainer,
          ]}
        >
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
                isSender ? [styles.senderBubble] : [styles.receiverBubble],
              ]}
            >
              <Text style={styles.senderName}>
                {senderNames[item.sender_id]}
              </Text>
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
                <View
                  style={[
                    styles.messageText,
                    isSender ? styles.senderText : styles.receiverText,
                  ]}
                >
                  <Text>{item.content}</Text>
                </View>
              )}
            </View>

            {/* Hiển thị thời gian gửi tin nhắn */}
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const sendMessage = async () => {
    try {
      // Kiểm tra nếu tin nhắn văn bản không rỗng và không có hình ảnh
      if (
        newMessage.trim() !== "" &&
        (!selectedImages || selectedImages.length === 0)
      ) {
        const { error } = await supabase.from("GroupMessage").insert([
          {
            groupid: groupId,
            sender_id: senderId,
            content: newMessage,
            timestamp: getLocalISOString(),
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
          groupid: groupId,
          sender_id: senderId,
          image_url: selectedImages,
          timestamp: getLocalISOString(),
        };

        // Gửi tin nhắn với hình ảnh
        const success = await sendMessageWithImage(messageDetails);
        if (!success) {
          return Alert.alert("Error", "Error sending message with image");
        }
      }

      // Nếu có cả tin nhắn văn bản và hình ảnh, gửi cả hai
      if (newMessage.trim() !== "") {
        const { error } = await supabase.from("GroupMessage").insert([
          {
            groupid: groupId,
            sender_id: senderId,
            content: newMessage,
            timestamp: getLocalISOString(),
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
          <Image source={{ uri: groupIcon }} style={styles.headerAvatar} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{groupName}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Icon
                name="videocam-outline"
                size={30}
                color="black"
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("GroupInfor", {
                  screen: "GroupInforTab",
                  params: {
                    groupIcon: groupIcon,
                    groupName: groupName,
                    groupId: groupId,
                  },
                })
              }
            >
              <Icon
                name="alert-circle-outline"
                size={30}
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
          keyExtractor={(item, index) => `${item.id}-${item.timestamp}`} // Kết hợp id và timestamp làm key
          style={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
                { top: modalPosition.top, right: modalPosition.right },
              ]}
            >
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  if (!selectedMessage.image_url) {
                     setEditingMessageId(selectedMessage.id); // Đặt tin nhắn đang chỉnh sửa
                     setNewMessage(selectedMessage.content); // Đặt nội dung chỉnh sửa vào ô nhập
                     setModalVisible(false); // Đóng modal
                  } else {
                    Alert.alert(
                      "Lỗi",
                      "Không thể chỉnh sửa tin nhắn dạng hình ảnh."
                    );
                  }
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={24}
                  color="black"
                  style={styles.iconModal}
                />
                <Text style={styles.optionText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  if (selectedMessage) {
                    deleteMessage(selectedMessage.id, fetchMessages);
                    setModalVisible(false);
                  }
                }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="black"
                  style={styles.iconModal}
                />
                <Text style={styles.optionText}>Xoá</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color="black"
                  style={styles.iconModal}
                />
                <Text style={styles.optionText}>Huỷ</Text>
              </TouchableOpacity>
              {/* Add more options as needed */}
            </View>
          </TouchableOpacity>
        </Modal>

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
                  onPress={() =>
                    removeImage(
                      selectedImages[0],
                      setSelectedImages,
                      selectedImages
                    )
                  }
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
                      onPress={() =>
                        removeImage(imageUri, setSelectedImages, selectedImages)
                      }
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
            placeholder={
              editingMessageId ? "Chỉnh sửa tin nhắn..." : "Nhập tin nhắn..."
            }
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() =>
              pickImage(
                () => launchGallery(setSelectedImages, selectedImages),
                () => launchCamera(setSelectedImages, selectedImages)
              )
            }
            disabled={!!editingMessageId} // Không cho chọn ảnh khi đang chỉnh sửa
          >
            <Icon
              name="add-circle"
              size={30}
              color="blue"
              style={styles.iconSend}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={
              editingMessageId
                ? () => handleEditMessage(editingMessageId)
                : sendMessage
            }
          >
            <Icon
              name={editingMessageId ? "checkmark-circle-outline" : "send"}
              size={30}
              color="blue"
              style={styles.iconSend}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default GroupMessage;
