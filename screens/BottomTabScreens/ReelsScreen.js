import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Modal, TextInput, Alert, Button,Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../../data/supabaseClient";
import Icon from 'react-native-vector-icons/Ionicons';
import { Video } from 'expo-av';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt
import Slider from '@react-native-community/slider'; // Thêm Slider
import styles from './style/styleReel';
const { width, height } = Dimensions.get('window');
dayjs.extend(relativeTime);
dayjs.locale("vi");

const ReelsScreen = () => {
  const route = useRoute();
  const { UserReelid, setUserReelid } = route.params || {};
  const { ProfileId } = route.params || {};
  const [reels, setReels] = useState([]);
  const [user, setUser] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const videoRefs = useRef([]);
  const [playingVideos, setPlayingVideos] = useState({});
  const [muted, setMuted] = useState({});
  const [durations, setDurations] = useState({});
  const [sliderValue, setSliderValue] = useState({}); // Giá trị slider
  const [currentTime, setCurrentTime] = useState({}); // Thêm trạng thái currentTime
  const [likedReels, setLikedReels] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false); // Trạng thái hiển thị Modal
  const [selectedReel, setSelectedReel] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  // 1. Fetch dữ liệu từ Supabase

  const fetchReels = async (UserReelid = null) => {
    try {
      // Tạo query cơ bản
      let query = supabase.from('Reels').select('*').eq("permission", "cộng đồng");

      if (UserReelid) {
        // Nếu có UserReelid, lọc chỉ reel có reelid khớp
        query = query.eq('reelid', UserReelid);
      } else {
        // Nếu không có UserReelid, sắp xếp theo số lượt thích
        query = query.order('reellike', { ascending: false });
      }

      // Thực thi query
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reels:', error.message);
        return;
      }

      // Cập nhật state reels
      setReels(data || []);
    } catch (err) {
      console.error('Unexpected error fetching reels:', err);
    }
  };
  // Fetch trạng thái Like của từng Reel
  const fetchLikedReels = async () => {
    try {
      const user = await supabase.auth.getUser(); // Lấy user đang đăng nhập
      const { data, error } = await supabase
        .from('ReelLike')
        .select('reelid')
        .eq('uid', user.data.user.id);

      if (error) throw error;

      const likedReelsMap = {};
      data.forEach((like) => {
        likedReelsMap[like.reelid] = true;
      });
      setLikedReels(likedReelsMap);
    } catch (err) {
      console.error('Error fetching liked reels:', err);
    }
  };

  // Hàm lấy tất cả comment theo reelid
  const fetchComments = async (reelid) => {
    try {
      // Bước 1: Lấy tất cả comment từ bảng 'ReelComment'
      const { data: comments, error: commentsError } = await supabase
        .from('ReelComment')
        .select('*')
        .eq('reelid', reelid)
        .order('created_at', { ascending: true }); // Sắp xếp bình luận theo thời gian tăng dần

      if (commentsError) {
        console.error('Error fetching comments:', commentsError.message);
        return [];
      }

      // Bước 2: Lấy thông tin người dùng cho mỗi comment (dựa vào uid)
      const commentsWithUserInfo = await Promise.all(
        comments.map(async (comment) => {
          const { data: userData, error: userError } = await supabase
            .from('User') // Bảng chứa thông tin người dùng
            .select('name, avatar')
            .eq('uid', comment.uid)
            .single(); // Dùng single() vì chỉ có một người dùng cho mỗi uid

          if (userError) {
            console.error('Error fetching user data:', userError.message);
            return {
              ...comment,
              userName: '',
              userAvatar: '',
            };
          }

          return {
            ...comment,
            userName: userData.name || '', // Thêm tên người dùng
            userAvatar: userData.avatar || '', // Thêm avatar người dùng
          };
        })
      );

      // Bước 3: Tổ chức dữ liệu theo cấu trúc phân cấp (Tree Structure)
      const commentMap = {};
      const rootComments = [];

      // Xây dựng map với id của từng comment
      commentsWithUserInfo.forEach((comment) => {
        comment.replies = []; // Thêm danh sách reply cho mỗi comment
        commentMap[comment.id] = comment;

        // Nếu comment có reply, gắn vào danh sách reply của comment gốc
        if (comment.reply) {
          const parentComment = commentMap[comment.reply];
          if (parentComment) {
            parentComment.replies.push(comment);
          } else {
            console.warn(`Không tìm thấy comment gốc cho reply ID: ${comment.id}`);
          }
        } else {
          // Nếu không có reply, đây là comment gốc
          rootComments.push(comment);
        }
      });

      // Trả về danh sách comment gốc với cấu trúc phân cấp
      return rootComments;
    } catch (err) {
      console.error('Unexpected error fetching comments:', err);
      return [];
    }
  };

  const fetchUser = async () => {
    try {
      const userIds = reels.map((reel) => reel.uid);
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .in('uid', userIds);

      if (error) {
        console.error('Error fetching users:', error.message);
        return;
      }
      setUser(data || []);
    } catch (err) {
      console.error('Unexpected error fetching users:', err);
    }
  };
  // Hàm lấy số lượng thông báo chưa đọc
  const fetchUnreadNotificationCount = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('Notification_Reel')
        .select('nid', { count: 'exact' }) // Lấy số lượng thông báo
        .eq('uid', userId) // Người nhận thông báo
        .eq('read', false); // Chỉ lấy thông báo chưa đọc

      if (error) {
        console.error('Error fetching unread notification count:', error);
        return 0; // Trả về 0 nếu có lỗi
      }

      return data.length; // Trả về số lượng thông báo chưa đọc
    } catch (err) {
      console.error('Error in fetchUnreadNotificationCount:', err);
      return 0; // Trả về 0 nếu xảy ra lỗi
    }
  };


  // 2. Xử lý hành động người dùng

  // Handle Like/Unlike
  const sendLikeNotification = async (reel, userId, userName) => {
    try {
      // Kiểm tra nếu uid và related_uid trùng nhau thì không tạo thông báo
      if (reel.uid === userId) {
        console.log("Không cần tạo thông báo vì người thực hiện like là chủ sở hữu Reel.");
        return;
      }

      const { data, error } = await supabase
        .from('Notification_Reel')
        .insert([
          {
            nid: generateUniqueId(),
            uid: reel.uid, // Người sở hữu Reel
            notification: `${userName} đã thích Reel của bạn`, // Nội dung thông báo
            reelid: reel.reelid, // ID của Reel (đảm bảo dùng đúng tên trường)
            related_uid: userId, // ID của người thực hiện like
            notification_type: 'like', // Loại thông báo
            timestamp: new Date().toISOString(), // Thời gian tạo thông báo
          },
        ]);

      if (error) {
        console.error("Error sending like notification: ", error);
      } else {
        console.log("Notification sent: ", data);
      }
    } catch (err) {
      console.error("Error in sendLikeNotification: ", err);
    }
  };

  const handleLike = async (reel) => {
    const user = await supabase.auth.getUser();
    const reelId = reel.reelid;

    if (!user.data.user) {
      console.error("User not logged in");
      return;
    }

    if (likedReels[reelId]) {
      // Nếu đã like, chuyển sang unlike
      setLikedReels((prev) => ({ ...prev, [reelId]: false }));
      setReels((prevReels) =>
        prevReels.map((r) =>
          r.reelid === reelId ? { ...r, reellike: (r.reellike || 0) - 1 } : r
        )
      );

      try {
        const { error: deleteError } = await supabase
          .from('ReelLike')
          .delete()
          .eq('reelid', reelId)
          .eq('uid', user.data.user.id);

        if (deleteError) throw deleteError;

        // Xóa thông báo trong bảng Notification_Reel
        const { error: notificationError } = await supabase
          .from("Notification_Reel")
          .delete()
          .eq("reelid", reelId)
          .eq("related_uid", user.data.user.id)
          .eq("notification_type", "like");

        if (notificationError) throw notificationError;

        await supabase
          .from('Reels')
          .update({ reellike: reel.reellike - 1 })
          .eq('reelid', reelId);
      } catch (err) {
        console.error("Error updating likes:", err);

        // Rollback giao diện nếu xảy ra lỗi
        setLikedReels((prev) => ({ ...prev, [reelId]: true }));
        setReels((prevReels) =>
          prevReels.map((r) =>
            r.reelid === reelId ? { ...r, reellike: (r.reellike || 0) + 1 } : r
          )
        );
      }
    } else {
      // Nếu chưa like, chuyển sang like
      setLikedReels((prev) => ({ ...prev, [reelId]: true }));
      setReels((prevReels) =>
        prevReels.map((r) =>
          r.reelid === reelId ? { ...r, reellike: (r.reellike || 0) + 1 } : r
        )
      );

      try {
        const { error: insertError } = await supabase
          .from('ReelLike')
          .insert({
            id: generateUniqueId(),
            reelid: reelId,
            uid: user.data.user.id,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('name')
          .eq('uid', user.data.user.id)
          .single();

        if (userError) throw userError;

        const userName = userData.name;
        // Gọi hàm sendLikeNotification
        await sendLikeNotification(reel, user.data.user.id, userName);
        console.log(userName);

        await supabase
          .from('Reels')
          .update({ reellike: (reel.reellike || 0) + 1 })
          .eq('reelid', reelId);
      } catch (err) {
        console.error("Error updating likes:", err);

        // Rollback giao diện nếu xảy ra lỗi
        setLikedReels((prev) => ({ ...prev, [reelId]: false }));
        setReels((prevReels) =>
          prevReels.map((r) =>
            r.reelid === reelId ? { ...r, reellike: (r.reellike || 0) - 1 } : r
          )
        );
      }
    }
  };
  ;
  const sendCommentNotification = async (reel, userId, userName, id) => {
    try {
      // Kiểm tra nếu uid và related_uid trùng nhau thì không tạo thông báo
      if (reel.uid === userId) {
        console.log("Không cần tạo thông báo vì người thực hiện like là chủ sở hữu Reel.");
        return;
      }

      const { data, error } = await supabase
        .from('Notification_Reel')
        .insert([
          {
            nid: generateUniqueId(),
            uid: reel.uid, // Người sở hữu Reel
            notification: `${userName} đã bình luận Reel của bạn`, // Nội dung thông báo
            reelid: reel.reelid, // ID của Reel (đảm bảo dùng đúng tên trường)
            related_uid: userId, // ID của người thực hiện like
            notification_type: 'comment', // Loại thông báo
            timestamp: new Date().toISOString(), // Thời gian tạo thông báo
            commentid: id,
          },
        ]);

      if (error) {
        console.error("Error sending like notification: ", error);
      } else {
        console.log("Notification sent: ", data);
      }
    } catch (err) {
      console.error("Error in sendLikeNotification: ", err);
    }
  };
  const handleComment = async (reel, commentText) => {
    try {
      // Kiểm tra nếu commentText trống, không gửi comment
      if (!commentText.trim()) {
        alert('Comment không được để trống');
        return;
      }

      const user = await supabase.auth.getUser();
      const reelId = reel.reelid;

      // Kiểm tra nếu không có reelId hoặc không có user
      if (!reelId || !user || !user.data || !user.data.user || !user.data.user.id) {
        console.error('Thông tin người dùng hoặc reel không hợp lệ');
        return;
      }
      const id = generateUniqueId();
      const newComment = {
        id: id,
        reelid: reelId,
        uid: user.data.user.id,
        comment: commentText,
        created_at: new Date().toISOString(),
      };

      // Gửi comment lên cơ sở dữ liệu
      const { error: insertError } = await supabase
        .from('ReelComment')
        .insert(newComment);

      if (insertError) throw insertError;

      // Truy vấn thông tin người dùng (avatar và tên)
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('avatar, name')
        .eq('uid', user.data.user.id)
        .single();

      if (userError) throw userError;

      const updatedComment = {
        ...newComment,
        userAvatar: userData.avatar,
        userName: userData.name,
      };

      const userName = userData.name;
      // Gọi hàm sendCommentNotification
      await sendCommentNotification(reel, user.data.user.id, userName, id);
      console.log(userName);

      // Cập nhật comment vào selectedReel nếu selectedReel tồn tại
      if (selectedReel) {
        setSelectedReel((prevReel) => ({
          ...prevReel,
          comments: prevReel ? [...prevReel.comments, updatedComment] : [updatedComment],
        }));
      }

      // Cập nhật lại danh sách reels trong state sau khi cập nhật số lượng comment
      setReels((prevReels) => {
        return prevReels.map((prevReel) =>
          prevReel.reelid === reelId
            ? { ...prevReel, reelcomment: prevReel.reelcomment + 1 }
            : prevReel
        );
      });

      // Làm trống ô input sau khi gửi comment
      setCommentText('');
      console.log('Comment đã được thêm thành công!');
    } catch (err) {
      console.error('Lỗi khi thêm comment:', err);
    }
  };
  // Hàm đệ quy: Thêm reply vào danh sách comment
  const addReplyToComment = (comments, targetCommentId, updatedComment) => {
    return comments.map((currentComment) => {
      if (currentComment.id === targetCommentId) {
        return {
          ...currentComment,
          replies: [...(currentComment.replies || []), updatedComment], // Thêm reply vào mảng replies
        };
      }
      if (currentComment.replies && currentComment.replies.length > 0) {
        return {
          ...currentComment,
          replies: addReplyToComment(currentComment.replies, targetCommentId, updatedComment), // Đệ quy
        };
      }
      return currentComment;
    });
  };

  const handleSendReply = async (reel, replyText, comment) => {
    if (replyText.trim() === '') {
      alert('Vui lòng nhập câu trả lời.');
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      const reelId = reel.reelid;
      const id = generateUniqueId();
      // Tạo một comment mới
      const newComment = {
        id: id, // Tạo ID duy nhất cho comment
        reelid: reelId,         // ID của reel mà comment đang được thêm vào
        uid: user.data.user.id,      // ID người dùng hiện tại
        comment: replyText,     // Nội dung comment
        reply: comment.id,      // ID của comment gốc (để xác định reply)
        created_at: new Date().toISOString(), // Thời gian tạo comment
      };

      // Gửi comment lên cơ sở dữ liệu
      const { error: insertError } = await supabase.from('ReelComment').insert(newComment);
      if (insertError) throw insertError;

      // Truy vấn thông tin người dùng (avatar và tên)
      const { data: userData, error: userInfoError } = await supabase
        .from('User')
        .select('avatar, name')
        .eq('uid', user.data.user.id)
        .single();

      if (userInfoError || !userData) {
        throw new Error('Không thể lấy thông tin người dùng để cập nhật comment.');
      }

      // Thêm thông tin người dùng vào comment mới
      const updatedComment = {
        ...newComment,
        userAvatar: userData.avatar,
        userName: userData.name,
        replies: [], // Khởi tạo mảng replies rỗng
      };
      const userName = userData.name;
      // Gọi hàm sendCommentNotification
      await sendCommentNotification(reel, user.data.user.id, userName, id);
      console.log(userName);

      // Cập nhật selectedReel với reply mới
      setSelectedReel((prevReel) => ({
        ...prevReel,
        comments: addReplyToComment(prevReel.comments, comment.id, updatedComment),
      }));

      // Cập nhật lại danh sách reels trong state
      setReels((prevReels) =>
        prevReels.map((prevReel) =>
          prevReel.reelid === reelId
            ? { ...prevReel, reelcomment: prevReel.reelcomment + 1 }
            : prevReel
        )
      );

      // Làm trống ô input sau khi gửi bình luận
      setCommentText('');
      console.log('Reply đã được thêm thành công!');
    } catch (err) {
      console.error('Lỗi khi thêm reply:', err);
    }

    // Reset input và ẩn giao diện trả lời
    setReplyingCommentId(null); // Ẩn input trả lời
    setReplyText(''); // Reset nội dung trả lời
  };

  const handleDeleteComment = (reel, commentId) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa bình luận này và tất cả các trả lời liên quan?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              console.log("Xóa comment ID:", commentId);

              // Hàm đệ quy để thu thập tất cả comment ID (bao gồm replies)
              const collectAllCommentIds = (comments, targetId) => {
                let idsToDelete = [];
                comments.forEach((comment) => {
                  if (comment.id === targetId) {
                    idsToDelete.push(comment.id); // Thêm comment gốc vào danh sách xóa
                    if (comment.replies && comment.replies.length > 0) {
                      comment.replies.forEach((reply) => {
                        idsToDelete = idsToDelete.concat(
                          collectAllCommentIds(comment.replies, reply.id)
                        );
                      });
                    }
                  }
                });
                return idsToDelete;
              };

              // Thu thập tất cả ID comment cần xóa
              const allCommentIdsToDelete = collectAllCommentIds(
                selectedReel.comments,
                commentId
              );
              const numberOfDeletedComments = allCommentIdsToDelete.length;
              console.log("Số cmt bị xóa :", numberOfDeletedComments);

              // Xóa comment trên giao diện (UI)
              setSelectedReel((prevReel) => ({
                ...prevReel,
                comments: prevReel.comments.filter(
                  (comment) => !allCommentIdsToDelete.includes(comment.id)
                ),
                reelcomment:
                  prevReel.reelcomment - numberOfDeletedComments > 0
                    ? prevReel.reelcomment - numberOfDeletedComments
                    : 0, // Đảm bảo reelcomment không giảm xuống dưới 0
              }));

              setReels((prevReels) =>
                prevReels.map((prevReel) =>
                  prevReel.reelid === reel.reelid
                    ? {
                      ...prevReel,
                      reelcomment:
                        prevReel.reelcomment - numberOfDeletedComments > 0
                          ? prevReel.reelcomment - numberOfDeletedComments
                          : 0, // Trừ số comment đã xóa
                    }
                    : prevReel
                )
              );

              // **Xóa dữ liệu từ cơ sở dữ liệu**

              // Xóa các thông báo liên quan trong bảng Notification_Reel
              const { error: notificationError } = await supabase
                .from("Notification_Reel")
                .delete()
                .in("commentid", allCommentIdsToDelete); // Xóa bằng danh sách ID comment

              if (notificationError) {
                console.error(
                  "Lỗi khi xóa thông báo liên quan:",
                  notificationError
                );
                return;
              }

              // Xóa các comment liên quan trong bảng ReelComment
              const { error: deleteError } = await supabase
                .from("ReelComment")
                .delete()
                .in("id", allCommentIdsToDelete); // Xóa hàng loạt bằng danh sách ID

              if (deleteError) {
                console.error("Lỗi khi xóa comment:", deleteError);
                return;
              }

              console.log("Xóa comment và các thông báo liên quan thành công!");
            } catch (err) {
              console.error("Lỗi trong quá trình xóa comment:", err);
            }
          },
        },
      ]
    );
  };



  const handleDeleteReel = async (reel) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa reel này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              const result = await deleteReelAndRelatedData(reel);
              if (result.success) {
                alert(result.message); // Thông báo xóa thành công
                // Cập nhật giao diện, ví dụ: gọi lại danh sách reel
                setReels((prevReels) =>
                  prevReels.filter((item) => item.reelid !== reel.reelid) // Sửa `reel.reelid` thành `item.reelid`
                );
              } else {
                alert(result.message); // Thông báo lỗi
              }
            } catch (error) {
              console.error("Error in handleDeleteReel:", error);
              alert("Đã xảy ra lỗi khi xóa reel.");
            }
          },
        },
      ]
    );
  };

  const handlePlayPause = (index) => {
    const videoRef = videoRefs.current[index];
    const isPlaying = playingVideos[index];

    if (isPlaying) {
      videoRef.pauseAsync(); // Dừng video nếu đang phát
    } else {
      videoRef.playAsync(); // Phát video nếu không
    }

    // Cập nhật trạng thái của video
    setPlayingVideos((prev) => ({ ...prev, [index]: !isPlaying }));
  };

  const handleMuteUnmute = (index) => {
    const videoRef = videoRefs.current[index];
    const isMuted = muted[index];

    videoRef.setIsMutedAsync(!isMuted);
    setMuted((prev) => ({ ...prev, [index]: !isMuted }));
  };

  const handleVideoEnd = (index) => {
    setPlayingVideos((prev) => ({ ...prev, [index]: false }));
  };

  const openModal = async (reel) => {
    setSelectedReel(reel);
    setTimeout(() => {
      setIsModalVisible(true);
    }, 0); // Đặt một chút thời gian trễ để giảm tải UI

    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.pauseAsync();
        setPlayingVideos((prev) => ({ ...prev, [index]: false }));
      }
    });

    const comments = await fetchComments(reel.reelid);
    setSelectedReel(prevState => ({
      ...prevState,
      comments: comments,  // Lưu các comment vào state của Reel
    }));


  };

  const closeModal = async (reel) => {
    setIsModalVisible(false);
    const reelId = reel.reelid;
    const { data: commentCountData, error: countError } = await supabase
      .from("ReelComment")
      .select("*", { count: "exact" }) // Đếm số lượng comment
      .eq("reelid", reelId);

    if (countError) {
      throw countError;
    }

    const commentCount = commentCountData.length; // Lấy số lượng comment

    // Cập nhật số lượng comment vào bảng 'Reels'
    const { error: updateError } = await supabase
      .from("Reels")
      .update({ reelcomment: commentCount }) // Cập nhật số lượng comment
      .eq("reelid", reelId);

    if (updateError) {
      throw updateError;
    }
    setSelectedReel(null);
  };
  const handleReply = (comment) => {
    if (replyingCommentId === comment.id) {
      // Đang trả lời comment này -> ẩn input
      setReplyingCommentId(null);
      setReplyText(''); // Xóa nội dung trả lời
    } else {
      // Hiển thị input cho comment này
      setReplyingCommentId(comment.id);
      setReplyText(`@${comment.userName} `);
    }
  };


  // Hàm tua nhanh 5 giây
  const seekForward = (index) => {
    const videoRef = videoRefs.current[index];
    videoRef.getStatusAsync().then((status) => {
      const newPosition = Math.min(status.positionMillis + 5000, status.durationMillis);
      videoRef.setPositionAsync(newPosition);
    });
  };

  // Hàm tua lại 5 giây
  const seekBackward = (index) => {
    const videoRef = videoRefs.current[index];
    videoRef.getStatusAsync().then((status) => {
      const newPosition = Math.max(status.positionMillis - 5000, 0);
      videoRef.setPositionAsync(newPosition);
    });
  };

  // 3. Hiệu ứng giao diện

  const onViewableItemsChanged = ({ viewableItems }) => {
    const visibleIndexes = viewableItems.map((item) => item.index);
    const newPlayingVideos = {};

    videoRefs.current.forEach((video, index) => {
      if (visibleIndexes.includes(index)) {
        video.playAsync();
        newPlayingVideos[index] = true;
      } else {
        video.pauseAsync();
        newPlayingVideos[index] = false;
      }
    });

    setPlayingVideos(newPlayingVideos);
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const viewabilityConfigCallback = useRef(onViewableItemsChanged);

  // Hàm để load lại dữ liệu
  const handleReload = async () => {
    await fetchReels();
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
    fetchUser();
  };
  const handleLoad = async (index) => {
    const videoRef = videoRefs.current[index];
    if (videoRef) {
      const status = await videoRef.getStatusAsync();
      if (status.isLoaded) {
        const duration = status.durationMillis; // Thời lượng video (ms)
        const position = status.positionMillis; // Vị trí hiện tại (ms)
        setDurations((prev) => ({
          ...prev,
          [index]: duration,
        }));
        setCurrentTime((prev) => ({
          ...prev,
          [index]: position,
        }));
      }
    }
  };

  // 4. Hiệu ứng vòng đời

  useEffect(() => {
    const fetchData = async () => {
      const reelidFromNavigation = route.params?.UserReelid || null; // Nhận reelid từ navigation
      await fetchReels(reelidFromNavigation);
      await fetchLikedReels();
      const fetchNotifications = async () => {
        const user = await supabase.auth.getUser();

        if (!user.data.user) {
          console.error('User not logged in');
          return;
        }

        const userId = user.data.user.id;

        // Lấy số lượng thông báo chưa đọc
        const count = await fetchUnreadNotificationCount(userId);
        setNotificationCount(count);
      };

      fetchNotifications();

      // Lặp lại kiểm tra sau mỗi 30 giây (nếu cần)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
    };
    fetchData();
    const fetchCurrentUserId = async () => {
      // Giả sử là API trả về currentUserId
      const user = await supabase.auth.getUser();
      setCurrentUserId(user.data.user.id);
    };

    fetchCurrentUserId();
  }, []);

  useEffect(() => {
    fetchUser();
    reels.forEach((_, index) => handleLoad(index));
  }, [reels]);
  useEffect(() => {
    fetchReels(UserReelid);
  }, [UserReelid]);

  // Dừng tất cả video khi mất focus
  useFocusEffect(
    React.useCallback(() => {
      // Mỗi khi màn hình được focus, fetch lại dữ liệu
      fetchReels();

      // Dừng tất cả video khi chuyển sang trang khác
      return () => {
        videoRefs.current.forEach((video, index) => {
          if (video) {
            video.pauseAsync();
            setPlayingVideos((prev) => ({ ...prev, [index]: false }));
          }
        });
      };
    }, [])
  );

  // Hàm sinh ID duy nhất
  const generateUniqueId = () => {
    return Date.now().toString();
  };

  // Hàm lấy thời gian theo múi giờ địa phương
  const getLocalISOString = () => {
    const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
    const localDate = new Date(new Date().getTime() + localTimeOffset);
    return localDate.toISOString();
  };

  const formatNumber = (number) => {
    if (number < 1000) return number.toString(); // Dưới 1,000
    if (number < 1_000_000) return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'N'; // Từ 1,000 đến dưới 1 triệu
    if (number < 1_000_000_000) return (number / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'; // Từ 1 triệu đến dưới 1 tỷ
    return (number / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'; // Trên 1 tỷ
  };
  const deleteReelAndRelatedData = async (reel) => {
    try {
      // 1. Xóa dữ liệu từ bảng ReelComment
      const { error: commentError } = await supabase
        .from("ReelComment")
        .delete()
        .eq("reelid", reel.reelid);

      if (commentError) {
        console.error("Error deleting comments:", commentError);
        return { success: false, message: "Không thể xóa bình luận của reel." };
      }

      // 2. Xóa dữ liệu từ bảng ReelLike
      const { error: likeError } = await supabase
        .from("ReelLike")
        .delete()
        .eq("reelid", reel.reelid);

      if (likeError) {
        console.error("Error deleting likes:", likeError);
        return { success: false, message: "Không thể xóa lượt thích của reel." };
      }

      // 3. Xóa dữ liệu từ bảng Notification_Reel
      const { error: notificationError } = await supabase
        .from("Notification_Reel")
        .delete()
        .eq("reelid", reel.reelid);

      if (notificationError) {
        console.error("Error deleting notifications:", notificationError);
        return { success: false, message: "Không thể xóa thông báo của reel." };
      }

      // 4. Xóa file trong bucket
      const { error: storageError } = await supabase.storage
        .from("Reel_SocialApp") // Tên bucket
        .remove([reel.reelurl]); // Đường dẫn đến file

      if (storageError) {
        console.error("Error deleting file in bucket:", storageError);
        return { success: false, message: "Không thể xóa dữ liệu trong bucket." };
      }

      // 5. Xóa reel từ bảng Reel
      const { error: reelError } = await supabase
        .from("Reels")
        .delete()
        .eq("reelid", reel.reelid);

      if (reelError) {
        console.error("Error deleting reel:", reelError);
        return { success: false, message: "Không thể xóa reel." };
      }

      console.log(`Reel with ID ${reel.reelid} and related data have been deleted successfully.`);
      return { success: true, message: "Reel và tất cả thông tin liên quan đã được xóa thành công." };
    } catch (err) {
      console.error("Error in deleteReelAndRelatedData:", err);
      return { success: false, message: "Đã xảy ra lỗi khi xóa reel và các thông tin liên quan." };
    }
  };
  const handleGoBack = () => {
    if (setUserReelid) {
      setUserReelid(null); // Đặt lại UserReelid thành null
    }
    navigation.navigate("Profile", {
      screen: "ProfileTab", // Điều hướng đến ProfileTab
      params: {
        userId: ProfileId, // Truyền userId vào params
        activeSection: 'reel',
      },
    });
  };

  const handleGoProfile = (uid) => {
    navigation.navigate("Profile", {
      screen: "ProfileTab", // Điều hướng đến ProfileTab
      params: {
        userId: uid, // Truyền userId vào params
        activeSection: 'reel',
      },
    });
  };




  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Kiểm tra nếu chỉ có một reel */}
        {reels.length === 1 && (
          <TouchableOpacity onPress={handleGoBack}>
            {/* Hiển thị icon back */}
            <Icon name="arrow-back" size={30} color="black" />
          </TouchableOpacity>
        )}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Reels</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate("CreateReel")}>
            <Icon name="add-circle-outline" size={30} color="black" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationsReelScreen')}>
            <View>
              <Icon name="notifications-outline" size={30} color="black" style={styles.icon} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>{notificationCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReload}>
            <Icon name="reload" size={30} color="black" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Video List */}
      <FlatList
        ref={flatListRef}
        style={styles.list}
        data={reels}
        keyExtractor={(item) => item.reelid.toString()}
        renderItem={({ item, index }) => {
          const userItem = user.find((u) => u.uid === item.uid);

          return (
            <View style={styles.reelContainer}>
              {/* Video Player */}
              <TouchableOpacity onPress={() => handlePlayPause(index)}>
                <View style={styles.videoContainer}>
                  <Video
                    ref={(ref) => {
                      if (ref) videoRefs.current[index] = ref;
                    }}
                    source={{ uri: item.reelurl }}
                    style={styles.video}
                    resizeMode="contain"
                    isLooping
                    shouldPlay={playingVideos[index] || false}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded) {
                        setCurrentTime((prev) => ({
                          ...prev,
                          [index]: status.positionMillis,
                        }));
                        setSliderValue((prev) => ({
                          ...prev,
                          [index]: status.positionMillis / (status.durationMillis || 1),
                        }));
                        if (!status.isPlaying && playingVideos[index]) {
                          videoRefs.current[index]?.playAsync();
                        }
                      }
                    }}
                    onLoad={() => handleLoad(index)}
                    onEnd={() => handleVideoEnd(index)}
                  />

                  {/* Play/Pause Controls */}
                  {!playingVideos[index] && (
                    <>
                      <TouchableOpacity
                        style={styles.playPauseButton}
                        onPress={() => handlePlayPause(index)}
                      >
                        <Icon name="play-circle" size={80} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.seekButton}
                        onPress={() => seekBackward(index)}
                      >
                        <Icon name="play-back-outline" size={40} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.seekButton1}
                        onPress={() => seekForward(index)}
                      >
                        <Icon name="play-forward-outline" size={40} color="white" />
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Volume Button */}
                  <TouchableOpacity
                    style={styles.volumeButton}
                    onPress={() => handleMuteUnmute(index)}
                  >
                    <Icon
                      name={muted[index] ? "volume-mute" : "volume-high"}
                      size={30}
                      color="white"
                    />
                  </TouchableOpacity>
                  {currentUserId === item.uid && (
                    <TouchableOpacity
                      style={{ position: 'absolute', right: 20, top: 20 }}
                      onPress={() => handleDeleteReel(item)}
                    >
                      <Icon
                        name="trash-outline"
                        size={25}
                        color="red"
                      />
                    </TouchableOpacity>
                  )}

                  {/* Slider */}
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={durations[index] || 1}
                    value={currentTime[index] || 0}
                    onSlidingComplete={async (value) => {
                      const videoRef = videoRefs.current[index];
                      if (videoRef) {
                        await videoRef.setPositionAsync(value);
                      }
                    }}
                    minimumTrackTintColor="#FFFFFF"
                    maximumTrackTintColor="#808080"
                  />

                  {/* Time Display */}
                  <View style={styles.timeContainer}>
                    <Text style={styles.slidertimeText}>
                      {currentTime[index]
                        ? new Date(currentTime[index]).toISOString().substr(14, 5)
                        : "00:00"}
                    </Text>
                    <Text style={styles.slidertimeText}>/</Text>
                    <Text style={styles.slidertimeText}>
                      {durations[index]
                        ? new Date(durations[index]).toISOString().substr(14, 5)
                        : "00:00"}
                    </Text>
                  </View>

                  {/* User Actions */}
                  {userItem && (
                    <>
                      <View style={styles.actionsContainer}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openModal(item)}
                        >
                          <Icon name="chatbubble-outline" size={30} color="white" />
                          <Text style={styles.commentCount}>
                            {formatNumber(item.reelcomment || 0)}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleLike(item)}
                        >
                          <Icon
                            name={likedReels[item.reelid] ? "heart" : "heart-outline"}
                            size={30}
                            color={likedReels[item.reelid] ? "red" : "white"}
                          />
                          <Text style={styles.likeCount}>
                            {formatNumber(item.reellike || 0)}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleGoProfile(item.uid)}>
                          <Image
                            source={{
                              uri:
                                userItem.avatar ||
                                "https://via.placeholder.com/150",
                            }}
                            style={styles.avatar}
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => handleGoProfile(item.uid)}>
                        <Text style={styles.reelname}>{userItem.name}</Text>
                      </TouchableOpacity>
                      <Text style={styles.reelDesc}>{item.reeldesc}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
              {/* Modal for Comments */}
              {selectedReel && (
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={isModalVisible}
                  onRequestClose={closeModal}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Comments</Text>
                      <TouchableOpacity
                        onPress={() => closeModal(selectedReel)}
                        style={styles.closeButton}
                      >
                        <Icon name="close" size={35} color="black" />
                      </TouchableOpacity>

                      {/* Render danh sách comment và reply */}
                      <FlatList
                        data={selectedReel.comments || []}
                        style={{ marginTop: 20 }}
                        keyExtractor={(comment) => comment.id.toString()}
                        renderItem={({ item }) => {
                          const renderReplies = (replies, depth) =>
                            replies.map((reply) => (
                              <View
                                key={reply.id}
                                style={{ marginLeft: depth * 30, marginBottom: 10 }}
                              >
                                <View style={styles.commentContainer}>
                                  <Image
                                    source={{
                                      uri: reply.userAvatar || "https://via.placeholder.com/150",
                                    }}
                                    style={styles.avatar}
                                  />
                                  <View style={styles.comment}>
                                    <Text style={styles.userName}>{reply.userName}</Text>
                                    <Text style={styles.commentText}>{reply.comment}</Text>
                                    {currentUserId === reply.uid && (
                                      <TouchableOpacity
                                        style={{ position: "absolute", right: 10, bottom: 10 }}
                                        onPress={() =>
                                          handleDeleteComment(selectedReel, reply.id)
                                        }
                                      >
                                        <Icon
                                          name="trash-outline"
                                          size={20}
                                          color="red"
                                        />
                                      </TouchableOpacity>
                                    )}
                                    <View style={styles.rowContainer}>
                                      <Text style={styles.timeText}>
                                        {dayjs(reply.created_at).fromNow()}
                                      </Text>
                                      <TouchableOpacity onPress={() => handleReply(reply)}>
                                        <Text style={styles.replyText}>Trả lời</Text>
                                      </TouchableOpacity>
                                    </View>

                                    {replyingCommentId === reply.id && (
                                      <View style={styles.replyInputContainer}>
                                        <TextInput
                                          style={styles.replyInput}
                                          placeholder="Nhập câu trả lời..."
                                          value={replyText}
                                          onChangeText={setReplyText}
                                        />
                                        <TouchableOpacity
                                          style={styles.closeInputButton}
                                          onPress={() => setReplyingCommentId(null)}
                                        >
                                          <Text style={styles.closeButtonText}>Đóng</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.sendButton}
                                          onPress={() =>
                                            handleSendReply(selectedReel, replyText, reply)
                                          }
                                        >
                                          <Icon name="send" size={20} color="white" />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                </View>
                                {reply.replies && renderReplies(reply.replies, depth + 1)}
                              </View>
                            ));

                          return (
                            <View key={item.id} style={{ marginBottom: 10 }}>
                              {/* Bình luận gốc */}
                              <View style={styles.commentContainer}>
                                <Image
                                  source={{
                                    uri: item.userAvatar || "https://via.placeholder.com/150",
                                  }}
                                  style={styles.avatar}
                                />
                                <View style={styles.comment}>
                                  <Text style={styles.userName}>{item.userName}</Text>
                                  <Text style={styles.commentText}>{item.comment}</Text>
                                  {currentUserId === item.uid && (
                                    <TouchableOpacity
                                      style={{ position: "absolute", right: 10, bottom: 10 }}
                                      onPress={() => handleDeleteComment(selectedReel, item.id)}
                                    >
                                      <Icon
                                        name="trash-outline"
                                        size={20}
                                        color="red"
                                      />
                                    </TouchableOpacity>
                                  )}
                                  <View style={styles.rowContainer}>
                                    <Text style={styles.timeText}>
                                      {dayjs(item.created_at).fromNow()}
                                    </Text>
                                    <TouchableOpacity onPress={() => handleReply(item)}>
                                      <Text style={styles.replyText}>Trả lời</Text>
                                    </TouchableOpacity>
                                  </View>

                                  {replyingCommentId === item.id && (
                                    <View style={styles.replyInputContainer}>
                                      <TextInput
                                        style={styles.replyInput}
                                        placeholder="Nhập câu trả lời..."
                                        value={replyText}
                                        onChangeText={setReplyText}
                                      />
                                      <TouchableOpacity
                                        style={styles.closeInputButton}
                                        onPress={() => setReplyingCommentId(null)}
                                      >
                                        <Text style={styles.closeButtonText}>Đóng</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={styles.sendButton}
                                        onPress={() =>
                                          handleSendReply(selectedReel, replyText, item)
                                        }
                                      >
                                        <Icon name="send" size={20} color="white" />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              </View>

                              {/* Render replies */}
                              {item.replies && renderReplies(item.replies, 1)}
                            </View>
                          );
                        }}
                      />

                      {/* Input thêm comment */}
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="Add a comment..."
                          value={commentText}
                          onChangeText={setCommentText}
                        />
                        <TouchableOpacity
                          style={styles.submitButton}
                          onPress={() => handleComment(selectedReel, commentText)}
                        >
                          <Icon name="send" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>

              )}
            </View>
          );
        }}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={viewabilityConfigCallback.current}
        pagingEnabled={true}
        snapToAlignment="start"
        snapToInterval={height * 0.85 + 80}
        decelerationRate="fast"
      />
    </SafeAreaView>
  );
};

export default ReelsScreen;
