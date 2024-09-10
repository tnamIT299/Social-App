import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import ForgetPassword from './screens/ForgetPassword';
import TrangChu from './screens/TrangChu';
import HomeScreen from './screens/BottomTabScreens/HomeScreen';
import Navigation from './navigation/navigation';
export default function App() {
  return (
    <View style={styles.container}>
     <Navigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
