import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../../data/supabaseClient";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Ionicons";
import { Video } from "expo-av";  // Import Video component from expo-av

const Stack = createStackNavigator();

const ReelDetailTab = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { reelId } = route.params;
    console.log(reelId);
    const [reel, setReel] = useState(null);
    const [reelDesc, setReelDesc] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Fetch reel details
    useEffect(() => {
        const fetchReelDetail = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("Reels")  // Kiểm tra lại tên bảng nếu cần
                    .select("*")
                    .eq("reelid", reelId)  // Kiểm tra lại tên cột "reelid"
                    .single();  // Lấy duy nhất 1 bản ghi

                if (error) {
                    throw error;  // Nếu có lỗi từ Supabase, throw ra để xử lý
                }

                if (!data) {
                    // Kiểm tra nếu không có dữ liệu trả về
                    Alert.alert("Error", "Không tìm thấy reel với ID này.");
                    return;
                }

                setReel(data);  // Cập nhật thông tin của reel
                setReelDesc(data.reeldesc);  // Cập nhật mô tả của reel
            } catch (error) {
                console.error("Error fetching reel detail:", error);
                Alert.alert("Error", "Đã xảy ra lỗi khi tải thông tin reel.");
            } finally {
                setIsLoading(false);  // Đảm bảo luôn cập nhật trạng thái loading
            }
        };

        if (reelId) {
            fetchReelDetail();  // Chỉ fetch dữ liệu nếu reelId hợp lệ
        }
    }, [reelId]);


    // Handle saving updated reel description
    const handleSaveReel = async () => {
        if (!reelDesc.trim()) {
            Alert.alert("Error", "Description cannot be empty.");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from("Reels")
                .update({ reeldesc: reelDesc })
                .eq("reelid", reelId);

            if (error) throw error;

            Alert.alert("Success", "Reel description updated successfully!");
            navigation.goBack(); // Go back to the previous screen
        } catch (error) {
            console.error("Error updating reel:", error);
            Alert.alert("Error", "There was an issue updating the reel.");
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm lấy thời gian theo múi giờ địa phương
    const getLocalISOString = () => {
        const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
        const localDate = new Date(new Date().getTime() + localTimeOffset);
        return localDate.toISOString();
    };
    return (
        <View style={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <>
                    <View style={styles.videoContainer}>
                        {reel?.reelurl && (
                            <Video
                                source={{ uri: reel.reelurl }}
                                useNativeControls
                                resizeMode="contain"
                                style={styles.video}
                            />
                        )}
                    </View>

                    <TextInput
                        style={styles.reelDescInput}
                        placeholder="Edit description"
                        value={reelDesc}
                        onChangeText={setReelDesc}
                    />

                    <TouchableOpacity onPress={handleSaveReel} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const ReelDetailStack = ({ navigation }) => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ReelDetailTab"
                component={ReelDetailTab}
                options={({ navigation }) => ({
                    headerTitle: "Chỉnh sửa Reel",
                    headerTitleAlign: "center",
                    headerStyle: { backgroundColor: "#2F95DC" },
                    headerTintColor: "#FFFFFF",
                    headerTitleStyle: { fontWeight: "bold" },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ marginLeft: 10 }}
                        >
                            <Icon name="arrow-back" size={25} color="#fff" />
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
    videoContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    video: {
        width: 300,
        height: 300,
    },
    reelDescInput: {
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginVertical: 20,
    },
    saveButton: {
        backgroundColor: "#FF6347",
        padding: 15,
        borderRadius: 5,
        alignItems: "center",
    },
    saveButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default ReelDetailStack;
