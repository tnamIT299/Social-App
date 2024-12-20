import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Dimensions, Modal, TextInput, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../../data/supabaseClient";
import Icon from 'react-native-vector-icons/Ionicons';
import { Video } from 'expo-av';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt
import Slider from '@react-native-community/slider'; // Thêm Slider


const { width, height } = Dimensions.get('window');
dayjs.extend(relativeTime);
dayjs.locale("vi");

const ReelsScreen = () => {
  const [reels, setReels] = useState([]);
  const [user, setUser] = useState([]);
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
  const navigation = useNavigation();


  // 1. Fetch dữ liệu từ Supabase

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('Reels')
        .select('*')
        .eq("permission", "cộng đồng");

      if (error) {
        console.error('Error fetching reels:', error.message);
        return;
      }
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
      // Bước 1: Lấy bình luận từ bảng 'ReelComment'
      const { data: comments, error: commentsError } = await supabase
        .from('ReelComment')
        .select('*')
        .eq('reelid', reelid)
        .order('created_at', { ascending: false }); // Sắp xếp bình luận theo thời gian

      if (commentsError) {
        console.error('Error fetching comments:', commentsError.message);
        return [];
      }

      // Bước 2: Lấy thông tin người dùng cho mỗi bình luận (dựa vào uid)
      const commentsWithUserInfo = await Promise.all(
        comments.map(async (comment) => {
          // Lấy thông tin người dùng từ bảng 'User' dựa trên uid của mỗi bình luận
          const { data: userData, error: userError } = await supabase
            .from('User')  // Giả sử bảng chứa thông tin người dùng là 'User'
            .select('name, avatar')  // Lấy name và avatar
            .eq('uid', comment.uid);  // Lọc theo uid

          if (userError) {
            console.error('Error fetching user data:', userError.message);
            return {
              ...comment,
              userName: '',
              userAvatar: '',
            };
          }

          // Trả về bình luận với thông tin người dùng (name và avatar)
          return {
            ...comment,
            userName: userData[0]?.name || '',  // Nếu không có dữ liệu người dùng, mặc định là ''
            userAvatar: userData[0]?.avatar || '',  // Nếu không có avatar, mặc định là ''
          };
        })
      );

      // Trả về danh sách bình luận đã được kết hợp với thông tin người dùng
      return commentsWithUserInfo;
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

  // 2. Xử lý hành động người dùng

  // Handle Like/Unlike
  const handleLike = async (reel) => {
    const user = await supabase.auth.getUser();
    const reelId = reel.reelid;

    // Tạm thời cập nhật giao diện ngay lập tức
    if (likedReels[reelId]) {
      // Đã like, chuyển sang unlike
      setLikedReels((prev) => ({ ...prev, [reelId]: false }));
      setReels((prevReels) =>
        prevReels.map((r) =>
          r.reelid === reelId ? { ...r, reellike: (r.reellike || 0) - 1 } : r
        )
      );

      // Gửi yêu cầu cập nhật database
      try {
        const { error: deleteError } = await supabase
          .from('ReelLike')
          .delete()
          .eq('reelid', reelId)
          .eq('uid', user.data.user.id);

        if (deleteError) throw deleteError;

        await supabase
          .from('Reels')
          .update({ reellike: reel.reellike - 1 })
          .eq('reelid', reelId);
      } catch (err) {
        console.error('Error updating likes:', err);

        // Rollback giao diện nếu xảy ra lỗi
        setLikedReels((prev) => ({ ...prev, [reelId]: true }));
        setReels((prevReels) =>
          prevReels.map((r) =>
            r.reelid === reelId ? { ...r, reellike: (r.reellike || 0) + 1 } : r
          )
        );
      }
    } else {
      // Chưa like, chuyển sang like
      setLikedReels((prev) => ({ ...prev, [reelId]: true }));
      setReels((prevReels) =>
        prevReels.map((r) =>
          r.reelid === reelId ? { ...r, reellike: (r.reellike || 0) + 1 } : r
        )
      );

      // Gửi yêu cầu cập nhật database
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

        await supabase
          .from('Reels')
          .update({ reellike: (reel.reellike || 0) + 1 })
          .eq('reelid', reelId);
      } catch (err) {
        console.error('Error updating likes:', err);

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

  const handleComment = async (reel, commentText) => {
    // Lấy thông tin người dùng hiện tại
    const user = await supabase.auth.getUser();
    const reelId = reel.reelid;

    // Kiểm tra nếu commentText trống, không gửi comment
    if (!commentText.trim()) {
      alert('Comment không được để trống');
      return;
    }

    // Tạo một comment mới (chưa có userAvatar và userName)
    const newComment = {
      id: generateUniqueId(),  // Tạo ID duy nhất cho comment
      reelid: reelId,          // ID của reel mà comment đang được thêm vào
      uid: user.data.user.id,  // ID người dùng hiện tại
      comment: commentText,    // Nội dung comment
      created_at: new Date().toISOString(), // Thời gian tạo comment
    };

    try {
      // Gửi comment lên cơ sở dữ liệu
      const { error: insertError } = await supabase
        .from('ReelComment') // Giả sử bảng 'ReelComment' chứa các comment
        .insert(newComment);

      // Nếu có lỗi trong quá trình insert, ném lỗi và thông báo
      if (insertError) throw insertError;

      // Truy vấn thông tin người dùng (avatar và tên)
      const { data: userData, error: userError } = await supabase
        .from('User') // Giả sử bạn có bảng 'Users' chứa thông tin người dùng
        .select('avatar, name')
        .eq('uid', user.data.user.id) // Tìm thông tin người dùng dựa trên ID
        .single();

      if (userError) {
        throw userError;
      }

      // Thêm comment vào danh sách bình luận trong selectedReel, bao gồm userAvatar và userName
      const updatedComment = {
        ...newComment, // Thêm các thông tin comment hiện tại
        userAvatar: userData.avatar, // Thêm avatar của người dùng
        userName: userData.name,   // Thêm tên người dùng
      };

      // Cập nhật lại selectedReel với comment mới
      setSelectedReel((prevReel) => ({
        ...prevReel,
        comments: [
          ...prevReel.comments,  // Giữ lại các comment cũ
          updatedComment,         // Thêm comment mới đã có đầy đủ thông tin
        ],
      }));

      // Cập nhật số lượng comment trong bảng 'Reel'
      const { error: updateError } = await supabase
        .from('Reels') // Cập nhật bảng 'Reels'
        .update({
          reelcomment: reel.reelcomment + 1, // Tăng số lượng comment lên 1
        })
        .eq('reelid', reelId); // Cập nhật dựa trên reelId

      if (updateError) {
        throw updateError;
      }

      // Làm trống ô input sau khi gửi bình luận
      setCommentText('');

      console.log('Comment đã được thêm thành công!');
    } catch (err) {
      console.error('Lỗi khi thêm comment:', err);
    }
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
    }, 10); // Đặt một chút thời gian trễ để giảm tải UI

    const comments = await fetchComments(reel.reelid);
    setSelectedReel(prevState => ({
      ...prevState,
      comments: comments,  // Lưu các comment vào state của Reel
    }));


  };

  const closeModal = () => {
    setIsModalVisible(false); // Đóng Modal
    setSelectedReel(null);
    handleReload();
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
  const handleReload = () => {
    fetchReels();
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
      await fetchReels();
      await fetchLikedReels();
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchUser();
  }, [reels]);

  // Dừng tất cả video khi mất focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Dừng tất cả video khi chuyển sang trang khác
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



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Reels</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate("CreateReel")}>
            <Icon name="add-circle-outline" size={30} color="black" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="search-outline" size={30} color="black" style={styles.icon} />
          </TouchableOpacity>
          {/* Thêm nút load lại */}
          <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
            <Icon name="reload" size={30} color="black" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={reels}
        keyExtractor={(item) => item.reelid.toString()}
        renderItem={({ item, index }) => {
          const userItem = user.find((u) => u.uid === item.uid);
          return (
            <View style={styles.reelContainer}>
              <TouchableOpacity onPress={() => handlePlayPause(index)}>
                <View style={styles.videoContainer}>
                  <Video
                    ref={(ref) => { videoRefs.current[index] = ref; }}
                    source={{ uri: item.reelurl }}
                    style={styles.video}
                    resizeMode='contain'
                    isLooping
                    shouldPlay={playingVideos[index] || false}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded) {
                        setCurrentTime((prev) => ({
                          ...prev,
                          [index]: status.positionMillis, // Thời gian hiện tại của video
                        }));
                        setSliderValue((prev) => ({
                          ...prev,
                          [index]: status.positionMillis / (status.durationMillis || 1), // Tỷ lệ %
                        }));
                        if (!status.isPlaying && playingVideos[index]) {
                          videoRefs.current[index].playAsync(); // Tự phát khi cần
                        }
                      }
                    }}


                    onLoad={() => handleLoad(index)}
                    onEnd={() => handleVideoEnd(index)}
                  />
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

                  <TouchableOpacity
                    style={styles.volumeButton}
                    onPress={() => handleMuteUnmute(index)}
                  >
                    <Icon
                      name={muted[index] ? 'volume-mute' : 'volume-high'}
                      size={30}
                      color="white"
                    />
                  </TouchableOpacity>

                  {userItem && (
                    <>
                      <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.actionButton}>
                          <Icon name="share-social-outline" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => openModal(item)}>
                          <Icon name="chatbubble-outline" size={30} color="white" />
                          <Text style={styles.commentCount}>{formatNumber(item.reelcomment || 0)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleLike(item)}
                        >
                          <Icon
                            name={likedReels[item.reelid] ? 'heart' : 'heart-outline'}
                            size={30}
                            color={likedReels[item.reelid] ? 'red' : 'white'}
                          />
                          <Text style={styles.likeCount}>{formatNumber(item.reellike || 0)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                          <Image source={{ uri: userItem.avatar || "https://via.placeholder.com/150" }} style={styles.avatar} />
                        </TouchableOpacity>

                      </View>
                      <Text style={styles.reelTitle}>{userItem.name}</Text>
                      <Text style={styles.reelDesc}>{item.reeldesc}</Text>
                    </>
                  )}
                  <TouchableOpacity>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={durations[index] || 1} // Tránh chia cho 0
                      value={currentTime[index] || 0} // Giá trị thời gian hiện tại
                      onSlidingComplete={async (value) => {
                        const videoRef = videoRefs.current[index];
                        if (videoRef) {
                          await videoRef.setPositionAsync(value); // Đặt vị trí mới
                        }
                      }}
                      minimumTrackTintColor="#FFFFFF"
                      maximumTrackTintColor="#808080"
                    />

                  </TouchableOpacity>

                  <View style={styles.timeContainer}>
                    <Text style={styles.slidertimeText}>
                      {currentTime[index] ? new Date(currentTime[index]).toISOString().substr(14, 5) : '00:00'}
                    </Text>
                    <Text style={styles.slidertimeText}>/</Text>
                    <Text style={styles.slidertimeText}>
                      {durations[index] ? new Date(durations[index]).toISOString().substr(14, 5) : '00:00'}
                    </Text>
                  </View>

                  {/* Modal hiển thị bình luận */}
                  {selectedReel && (
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={isModalVisible}
                      onRequestClose={closeModal}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <Text style={styles.modalTitle}>Bình luận về Reel</Text>
                          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                            <Icon name="close" size={35} color="black" />
                          </TouchableOpacity>
                          <FlatList
                            data={selectedReel.comments} // Giả sử bạn có phần comments trong Reel
                            style={{ marginTop: 20 }}
                            keyExtractor={(comment) => comment.id.toString()}
                            renderItem={({ item }) => (
                              <View style={styles.commentContainer}>
                                <Image
                                  source={{ uri: item.userAvatar || "https://via.placeholder.com/150" }}
                                  style={styles.avatar}
                                />
                                <View style={styles.comment}>
                                  <Text style={styles.userName}>{item.userName}</Text>
                                  <Text style={styles.commentText}>{item.comment}</Text>
                                  <Text style={styles.timeText}>{dayjs(item.created_at).fromNow()}</Text>
                                </View>
                              </View>
                            )}
                          />
                          <View style={styles.inputContainer}>
                            <TextInput
                              style={styles.commentInput}
                              placeholder="Thêm bình luận..."
                              value={commentText}
                              onChangeText={setCommentText} // Lưu giá trị nhập vào
                            />
                            {/* Nút gửi bình luận */}
                            <TouchableOpacity
                              style={styles.submitButton}
                              onPress={() => handleComment(selectedReel, commentText)} // Gọi hàm handleComment khi gửi bình luận
                            >
                              <Icon name="send" size={20} color="white" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>
                  )}
                </View>
              </TouchableOpacity>
            </View >
          );
        }}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={viewabilityConfigCallback.current}
      />
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066ff',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 5,
  },
  reloadButton: {
    marginLeft: 10,
  },
  list: {
    backgroundColor: 'black',
  },
  reelContainer: {
    marginBottom: 80,
  },
  videoContainer: {
    width: width,
    height: height * 0.85,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 50,
    marginVertical: -5,
    marginHorizontal: -10,
  },
  reelTitle: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    padding: 5,
    borderRadius: 5,
    marginVertical: 130,
    marginHorizontal: 10,
  },
  reelDesc: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    padding: 5,
    marginTop: 10,
    marginVertical: 40,
    marginHorizontal: 10,
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  volumeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  seekButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: 0 }],
  },
  seekButton1: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: 70 }, { translateY: 0 }],
  },
  actionsContainer: {
    position: 'absolute',
    right: -10, // Căn sát mép phải (10px cách mép)
    top: '50%', // Vị trí ở giữa màn hình theo chiều dọc
    flexDirection: 'column',
    justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
    alignItems: 'center', // Căn giữa nội dung theo chiều ngang
    padding: 10,
  },
  actionButton: {
    marginHorizontal: 15,
    marginVertical: -55,

  },
  slider: {
    width: width,
    height: 40,
    marginVertical: -35,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: 20,
    marginVertical: -50,
  },
  slidertimeText: {
    color: 'white',
    padding: 5,
  },
  separator: {
    marginHorizontal: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  likeCount: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  commentCount: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  commentHeader: {
    marginBottom: 10,
  },
  modalOverlay: {
    position: 'absolute', // Đảm bảo Modal nằm ở vị trí tuyệt đối
    bottom: 0, // Đặt Modal ở dưới cùng
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Màu nền mờ
    justifyContent: 'flex-end', // Căn giữa Modal theo chiều dọc ở dưới cùng
    alignItems: 'center', // Căn giữa Modal theo chiều ngang
    marginVertical: 80,
  },
  modalContent: {
    backgroundColor: 'white',
    width: width, // Chiều rộng Modal chiếm toàn bộ chiều rộng màn hình
    height: height * 0.7, // Chiều cao chiếm 70% chiều cao màn hình
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentContainer: {
    flexDirection: 'row', // Sắp xếp theo chiều ngang
    alignItems: 'center', // Căn giữa avatar và phần text
    marginBottom: 15, // Khoảng cách giữa các bình luận
  },
  comment: {
    flex: 1, // Đảm bảo phần bình luận chiếm toàn bộ không gian còn lại
    borderBottomWidth: 1, // Đường viền dưới nhẹ nhàng hơn
    borderBottomColor: '#eee', // Màu viền nhạt hơn
    backgroundColor: '#fff', // Nền sáng hơn
    borderRadius: 10, // Giảm bo góc để tạo sự chuyên nghiệp
    padding: 12, // Tăng padding để thoáng hơn
    shadowColor: '#000', // Tạo hiệu ứng đổ bóng
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Hiệu ứng nổi trên Android
  },
  avatar: {
    width: 50, // Tăng kích thước avatar cho rõ hơn
    height: 50,
    borderRadius: 25, // Đảm bảo avatar tròn
    marginRight: 10, // Tăng khoảng cách với phần text
    borderWidth: 1, // Thêm viền để avatar nổi bật
    borderColor: '#ccc',
  },
  commentText: {
    fontSize: 15, // Tăng kích thước chữ
    color: '#444', // Màu chữ dễ đọc hơn
    marginBottom: 5, // Giữ khoảng cách giữa tên người dùng và nội dung
    lineHeight: 20, // Tăng khoảng cách dòng
  },
  userName: {
    fontWeight: '600', // Đậm nhẹ hơn
    fontSize: 16, // Giữ kích thước chữ
    color: '#222', // Đậm màu hơn để nổi bật
  },
  inputContainer: {
    flexDirection: 'row', // Đặt trường input và nút gửi trên cùng một hàng
    alignItems: 'center', // Căn giữa theo chiều dọc
    marginTop: 15,
    width: '100%',
  },
  commentInput: {
    height: 40,
    flex: 1, // Đảm bảo trường nhập chiếm toàn bộ không gian còn lại
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10, // Khoảng cách giữa input và icon
  },
  closeButton: {
    position: 'absolute',
    top: 20, // Khoảng cách từ trên cùng
    left: width * 0.92, // Khoảng cách từ bên phải
    zIndex: 1, // Đảm bảo nút nằm trên các phần tử khác trong modal
    color: 'black', // Màu sắc của nút
  },
  timeText: {
    fontSize: 12, // Kích thước chữ thời gian
    color: '#777', // Màu chữ cho thời gian (nhạt hơn)
    marginTop: 5, // Khoảng cách giữa bình luận và thời gian
  },

});

export default ReelsScreen;
