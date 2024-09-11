import {useState, React} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground ,Image, Alert} from 'react-native';
import { useFonts } from 'expo-font';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { supabase } from '../data/supabaseClient';

const Login = ({navigation}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    // State để kiểm soát chế độ hiển thị mật khẩu
  const [passwordVisible, setPasswordVisible] = useState(false);

    let [fontsLoaded] = useFonts({
        'KaushanScript-Regular': require('../assets/font/KaushanScript-Regular.ttf'),
    });

    if (!fontsLoaded) {
        return <Text>Loading...</Text>;
    }
    
    const handleLogin = async () => {
        // Regex để kiểm tra định dạng email
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      
        // Kiểm tra điều kiện email
        if (!emailRegex.test(email)) {
          setError('Email không hợp lệ');
          return;
        }
      
        // Nếu email hợp lệ, tiếp tục thực hiện đăng nhập
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
      
          if (error) {
            console.log('Login Error:', error); // Log lỗi ra console
            setError(error.message);
          } else {
            setError('');
            Alert.alert('Thông báo', 'Đăng nhập thành công!');
            navigation.navigate('tabNavigation')
          }
        } catch (error) {
          console.error('Unexpected Error:', error); // Log lỗi bất ngờ ra console
          setError('Có lỗi xảy ra, vui lòng thử lại.');
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
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
    
            <TouchableOpacity
            onPress={() => navigation.navigate('ForgetPassword')}>
              <Text style={styles.forgotPassword}>Forgot password</Text>
            </TouchableOpacity>
    
            <TouchableOpacity style={styles.signInButton}
            onPress={handleLogin}>
              <Text style={styles.signInButtonText}>SIGN IN</Text>
            </TouchableOpacity>
    
            <View style={styles.signUpContainer}>
              <Text>New user ?</Text>
              <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
    
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or Sign in with</Text>
              <View style={styles.divider} />
            </View>
    
            <TouchableOpacity>
              <Image style={styles.google}
              source={require('../assets/images/icon/google.png')}/>
            </TouchableOpacity>
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
        fontFamily:'KaushanScript-Regular',
        marginBottom: 40,
        color: '#000',
      },
      input: {
        width: '100%',
        height: 40,
        fontSize:16,
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
      icon: {
        position: 'absolute',
        right: 10,
        bottom:8
      },
      forgotPassword: {
        color: '#888',
        marginBottom: 40,
      },
      signInButton: {
        width: '100%',
        backgroundColor: '#6672A0',
        padding: 10,
        paddingHorizontal:100,
        alignItems: 'center',
        borderRadius: 15,
        marginBottom: 20,
      },
      signInButtonText: {
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
      dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
      },
      divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#888',
      },
      dividerText: {
        marginHorizontal: 10,
      },
      google:{
        width:50,
        height:50,
        resizeMode:'contain'
      },
      error: {
        color: 'red',
        marginBottom: 10,
      },
    });

export default Login