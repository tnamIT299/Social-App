import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Alert } from 'react-native';
import { supabase } from '../data/supabaseClient';
import Icon from 'react-native-vector-icons/FontAwesome6';

const ForgetPassword = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [ConfirmNewPassword, setConfirmNewPassword] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [ConfirmNewPasswordVisible, setConfirmNewPasswordVisible] = useState(false);

    const handleResetPassword = async () => {

      if (newPassword !== ConfirmNewPassword) {
        Alert.alert('Thông báo', 'Mật khẩu không khớp');
        return;
      }
        // Gửi yêu cầu thay đổi mật khẩu
        const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email);

        if (resetError) {
            Alert.alert('Error', resetError.message);
            return;
        }

        // Cập nhật mật khẩu mới sau khi xác thực
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            Alert.alert('Error', updateError.message);
        } else {
            Alert.alert('Success', 'Password updated successfully and confirmation email sent!');
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/background/appbackground19.webp')} // Link ảnh nền
            style={styles.background}
        >
            <View style={styles.container}>
                <Text style={styles.title}>WELCOME TO LOOPY</Text>

                <View style={styles.passwordContainer}>
                    <TextInput
                        placeholder="Email"
                        inputMode='email'
                        style={styles.input}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        placeholder="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!passwordVisible}
                        style={styles.input}
                    />
                    <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                    <Icon
                            name={passwordVisible ? "eye-slash" : "eye"}
                            size={20}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        placeholder="Confirm New Password"
                        value={ConfirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry={!ConfirmNewPasswordVisible}
                        style={styles.input}
                    />
                    <TouchableOpacity onPress={() => setConfirmNewPasswordVisible(!ConfirmNewPasswordVisible)}>
                    <Icon
                            name={ConfirmNewPasswordVisible ? "eye-slash" : "eye"}
                            size={20}
                            style={styles.icon}
                        />
                    </TouchableOpacity>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity style={styles.submitButton} onPress={handleResetPassword}>
                    <Text style={styles.submitButtonText}>SUBMIT</Text>
                </TouchableOpacity>

                <View style={styles.signUpContainer}>
                    <Text>Have an account ?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.signUpText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontFamily: 'KaushanScript-Regular',
        marginBottom: 40,
        color: '#000',
    },
    input: {
        width: '100%',
        height: 40,
        fontSize: 16,
        borderColor: '#000',
        borderBottomWidth: 1,
        marginBottom: 40,
        paddingLeft: 10,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    submitButton: {
        width: '100%',
        backgroundColor: '#6672A0',
        padding: 10,
        paddingHorizontal: 100,
        alignItems: 'center',
        borderRadius: 15,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
    },
    signUpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    signUpText: {
        color: 'red',
        marginLeft: 5,
    },
    icon: {
      position: 'absolute',
      right: 10,
      bottom: 8
  },
});

export default ForgetPassword;
