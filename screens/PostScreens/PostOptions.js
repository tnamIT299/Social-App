import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

const PostOptions = ({
  postId,
  isOwner, // Sử dụng isOwner để kiểm tra quyền sở hữu bài viết
  onEdit,
  onDelete,
  onSave,
  onHide,
  onPrivacyChange,
  currentUserId,
  userId,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const openOptions = () => setModalVisible(true);
  const closeOptions = () => setModalVisible(false);

  return (
    <View>
      {isOwner && (
        <TouchableOpacity onPress={openOptions}>
          <FontAwesome6 style={styles.ellipsis} name="ellipsis" size={20} />
        </TouchableOpacity>
      )}

      {/* Modal hiển thị các tùy chọn */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={closeOptions}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {isOwner ? (
              <>
                <TouchableOpacity onPress={onEdit}>
                  <Text style={styles.optionText}>Sửa bài viết</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete}>
                  <Text style={styles.optionText}>Xóa bài viết</Text>
                </TouchableOpacity>
                {/* Tùy chọn quyền riêng tư luôn hiển thị */}
                <TouchableOpacity onPress={() => onPrivacyChange("cộng đồng")}>
                  <Text style={styles.optionText}>
                    Quyền riêng tư: Công khai
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onPrivacyChange("bạn bè")}>
                  <Text style={styles.optionText}>Quyền riêng tư: Bạn bè</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onPrivacyChange("cá nhân")}>
                  <Text style={styles.optionText}>Quyền riêng tư: Cá nhân</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeOptions}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={onSave}>
                  <Text style={styles.optionText}>Lưu bài viết</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onHide}>
                  <Text style={styles.optionText}>Ẩn bài viết</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeOptions}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  ellipsis: {
    fontSize: 24,
    paddingHorizontal: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  optionText: {
    fontSize: 18,
    marginVertical: 10,
  },
  cancelText: {
    fontSize: 18,
    marginTop: 15,
    color: "red",
  },
});

export default PostOptions;
