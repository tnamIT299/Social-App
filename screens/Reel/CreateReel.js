import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../data/supabaseClient";
import Icon from "react-native-vector-icons/FontAwesome";
import { Video } from "expo-av";  // Import Video component from expo-av

const Stack = createStackNavigator();

const CreateReelTab = () => {
    const navigation = useNavigation();
    const [reelDesc, setReelDesc] = useState(""); // Mô tả reel
    const [selectedVideo, setSelectedVideo] = useState(null); // Chọn video
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) throw error;

                const { user } = data;
                if (user) {
                    setUserId(user.id);

                    const { data: userDetails, error: userError } = await supabase
                        .from("User")
                        .select("name, avatar")
                        .eq("uid", user.id)
                        .single();

                    if (userError) throw userError;

                    if (userDetails) {
                        setUserName(userDetails.name || "");
                        setUserAvatar(userDetails.avatar || "");
                    }
                } else {
                    Alert.alert("Error", "User not found.");
                }
            } catch (error) {
                console.error("Error fetching user info:", error.message);
                Alert.alert("Error", `Fetching user info failed: ${error.message}`);
            }
        };

        fetchUserInfo();
    }, []);

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


    const pickVideo = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            alert("Bạn cần cấp quyền truy cập camera!");
            return;
        }

        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaLibraryPermission.granted) {
            alert("Bạn cần cấp quyền truy cập thư viện!");
            return;
        }

        // Hiển thị lựa chọn: Quay video hoặc chọn từ thư viện
        Alert.alert(
            "Chọn Video",
            "Bạn muốn quay video mới hay chọn từ thư viện?",
            [
                {
                    text: "Quay Video",
                    onPress: async () => {
                        const cameraResult = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                            videoExportPreset: ImagePicker.VideoExportPreset.H264,
                        });

                        if (!cameraResult.canceled && cameraResult.assets.length > 0) {
                            setSelectedVideo(cameraResult.assets[0].uri);
                        } else {
                            console.log("Không có video nào được quay hoặc bạn đã hủy.");
                        }
                    },
                },
                {
                    text: "Chọn từ Thư viện",
                    onPress: async () => {
                        const pickerResult = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                        });

                        if (!pickerResult.canceled && pickerResult.assets.length > 0) {
                            setSelectedVideo(pickerResult.assets[0].uri);
                        } else {
                            console.log("Không có video nào được chọn hoặc bạn đã hủy.");
                        }
                    },
                },
                { text: "Hủy", style: "cancel" },
            ]
        );
    };



    const handleReelCreation = async () => {
        if (!userId || !reelDesc || !selectedVideo) {
            Alert.alert("Error", "All fields are required.");
            return;
        }

        setIsLoading(true);

        // Tạo đối tượng chứa thông tin post, bao gồm video
        const reelDetails = {
            reeldesc: reelDesc,
            videoUri: selectedVideo,
            userId,
        };

        try {
            // Tạo tên thư mục dựa trên UID người dùng
            const folderPath = `Reel_SocialApp/${userId}/`;

            // Kiểm tra thư mục có tồn tại không (thực tế Supabase không hỗ trợ kiểm tra trực tiếp thư mục, nhưng có thể kiểm tra bằng cách tải video)
            const { data: videoData, error: videoError } = await supabase.storage
                .from("Reel_SocialApp")
                .getPublicUrl(`${folderPath}test.txt`); // Kiểm tra bằng cách thử lấy tệp thử nghiệm

            if (videoError) {
                // Nếu lỗi xảy ra, có thể thư mục chưa tồn tại. Tạo thư mục.
                console.log("Folder does not exist, creating folder...");

                // Tạo tệp giả trong thư mục để "khởi tạo" thư mục
                const testFile = new File([""], `${folderPath}test.txt`);
                const { error: createFolderError } = await supabase.storage
                    .from("Reel_SocialApp")
                    .upload(`${folderPath}test.txt`, testFile);

                if (createFolderError) throw new Error("Failed to create folder.");
            }

            // Tải video lên Supabase Storage
            let videoUrl = "";
            if (selectedVideo) {
                const videoUri = selectedVideo;
                const videoName = `${userId}/${Date.now()}_${videoUri.split("/").pop()}`;
                const formData = new FormData();
                formData.append("file", {
                    uri: videoUri,
                    name: videoName,
                    type: "video/mp4", // Loại video, có thể thay đổi nếu video không phải mp4
                });

                const videoResponse = await fetch(
                    `https://uhhyfdvwcgkdhazvgamp.supabase.co/storage/v1/object/Reel_SocialApp/${videoName}`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaHlmZHZ3Y2drZGhhenZnYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1Mzg1NzcsImV4cCI6MjA0MTExNDU3N30.wIntuljwnbAe99So-08Rx8hTa3nHNo1eHE61dy6VZOc`,
                            "Content-Type": "multipart/form-data",
                        },
                        body: formData,
                    }
                );
                const videoResult = await videoResponse.json();
                if (!videoResponse.ok) throw new Error(`Tải video lên Supabase thất bại: ${videoResult.message}`);

                const { data: videoUrlData, error: videoUrlError } = supabase.storage
                    .from("Reel_SocialApp")
                    .getPublicUrl(`${videoName}`);

                if (videoUrlError) throw new Error(`Lấy URL video công khai thất bại: ${videoUrlError.message}`);

                videoUrl = videoUrlData.publicUrl;
            }

            // Tạo bài viết
            const reel = {
                reelid: generateUniqueId(),
                reeldesc: reelDesc || "",
                reelurl: videoUrl || "", // URL video nếu có
                permission: "cộng đồng",
                uid: userId || "",
                timestamp: getLocalISOString(),
            };

            // Thêm bài viết vào cơ sở dữ liệu Supabase
            const { data, error } = await supabase.from("Reels").insert([reel]);
            if (error) throw error;

            Alert.alert("Success", "Reel created successfully!");
            navigation.goBack();
        } catch (error) {
            console.error("Error creating reel:", error.message);
            Alert.alert("Error", `Unexpected error: ${error.message}`);
        } finally {
            setIsLoading(false); // Dừng loading khi tải xong
        }
    };





    return (
        <View style={styles.container}>
            {userName ? (
                <View style={styles.userInfoContainer}>
                    <Image
                        source={{ uri: userAvatar || "https://via.placeholder.com/150" }}
                        style={styles.avatar}
                    />
                    <Text style={styles.userName}>{userName}</Text>
                </View>
            ) : null}

            <TouchableOpacity onPress={pickVideo} style={styles.videoPickerButton}>
                <Text style={styles.videoPickerText}>
                    {selectedVideo ? "Chọn lại video" : "Chọn video"}
                </Text>
            </TouchableOpacity>

            {selectedVideo && (
                <View style={styles.videoPreviewContainer}>
                    <Text style={styles.selectedVideoText}>Video đã chọn</Text>
                    <Video
                        source={{ uri: selectedVideo }}
                        useNativeControls
                        resizeMode="contain"
                        style={{ width: 200, height: 200 }}
                    />
                </View>
            )}

            <TextInput
                style={styles.reelDescInput}
                placeholder="Mô tả reel"
                value={reelDesc}
                onChangeText={setReelDesc}
            />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text> Tạo Reel...</Text>
                </View>
            ) : (
                <TouchableOpacity onPress={handleReelCreation} style={styles.postButton}>
                    <Text style={styles.postButtonText}>Tạo reel</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const CreateReelStack = ({ navigation }) => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="CreateReelTab"
                component={CreateReelTab}
                options={({ navigation }) => ({
                    headerTitle: "Tạo Reel",
                    headerTitleAlign: "center",
                    headerStyle: { backgroundColor: "#2F95DC" },
                    headerTintColor: "#FFFFFF",
                    headerTitleStyle: { fontWeight: "bold" },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ marginLeft: 10 }}
                        >
                            <Icon name="arrow-left" size={25} color="#fff" />
                        </TouchableOpacity>
                    ),
                })}
            />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    userInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    reelDescInput: {
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginVertical: 20,
    },
    videoPickerButton: {
        backgroundColor: "#4CAF50",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
    },
    videoPickerText: {
        color: "white",
        fontSize: 16,
    },
    videoPreviewContainer: {
        marginVertical: 20,
        alignItems: "center",
    },
    selectedVideoText: {
        fontSize: 16,
        marginBottom: 10,
    },
    postButton: {
        backgroundColor: "#FF6347",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
    },
    postButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default CreateReelStack;
