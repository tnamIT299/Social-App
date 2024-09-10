import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';

const Splash = ({navigation}) => {
    let [fontsLoaded] = useFonts({
        'Angkor-Regular': require('../assets/font/Angkor-Regular.ttf'),
        'BakbakOne-Regular': require('../assets/font/BakbakOne-Regular.ttf'),
    });

    if (!fontsLoaded) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={styles.container}>
            {/* Phần hình ảnh minh họa */}
            <Image
                source={require('../assets/images/splash/image.png')} // Link ảnh
                style={styles.image}
            />
            {/* Tên ứng dụng */}
            <Text style={styles.title}>LOOPY!</Text>

            {/* Mô tả ứng dụng */}
            <Text style={styles.subtitle}>
                Where every thought finds a home and every image tells a story.
            </Text>

            {/* Nút "Getting Started" */}
            <TouchableOpacity style={styles.button}
            onPress={() => navigation.navigate('Login')}>
                <Text style={styles.buttonText}>Getting Started</Text>
            </TouchableOpacity>

            {/* Tùy chọn đăng nhập */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Text style={styles.signInText}>
                    Have an account?{' '}
                </Text>
                <TouchableOpacity
                onPress={() => navigation.navigate('Login')} >
                    <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    image: {
        width: 250, // Điều chỉnh kích thước theo yêu cầu
        height: 250,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontSize: 35,
        marginBottom: 10,
        color: '#0073e6',
        fontFamily: 'Angkor-Regular',
    },
    subtitle: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#0073e6',
        paddingVertical: 15,
        paddingHorizontal: 70,
        borderRadius: 25,
        marginBottom: 20,
    },
    buttonText: {
        fontSize: 18,
        color: '#fff',
        fontFamily: 'BakbakOne-Regular',
    },
    signInText: {
        fontSize: 16,
        color: '#444',
    },
    signInLink: {
        color: '#e53935', // Màu đỏ cho text "Sign In"
        fontWeight: 'bold',
    },
});

export default Splash;
