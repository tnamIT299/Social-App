import React ,{useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ScrollView,Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import TabNavigation from '../../navigation/tabNavigation';

const HomeScreen = () => {
  const [visible, setVisible] = useState(false);

  const toggleMenu  = () => {
    setVisible(!visible);
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Loopy</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={toggleMenu }>
            <Icon name="add-circle-outline" size={30} color="black" style={styles.icon} />
          </TouchableOpacity>
          {/* Modal for showing the menu */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={toggleMenu }
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu }>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem}>
              <Text>Tạo bài viết</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text>Tạo tin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text>Tạo Short Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text>Tạo Livestream</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

          <TouchableOpacity>
            <Icon name="search-outline" size={30} color="black" style={styles.icon} />
          </TouchableOpacity>

          <View style={styles.notificationIcon}>
            <TouchableOpacity>
              <Icon name="chatbubble-ellipses-outline" size={30} color="black" />
            </TouchableOpacity>

            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>1</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Post input */}
      <View style={styles.postInputContainer}>
        <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.avatar} />
        <TextInput style={styles.postInput} placeholder="Bạn đang nghĩ gì ?" />
      </View>

      {/* Post cards */}
      <ScrollView>
        <View style={styles.cardContainer}>
          {['Username', 'Username', 'Username'].map((name, index) => (
            <View key={index} style={styles.card}>
              <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.cardImage} />
              <Text style={styles.cardText}>{name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginHorizontal: 5,
  },
  icon: {
    marginHorizontal: 5,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  card: {
    width: 100,
    alignItems: 'center',
  },
  cardImage: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  cardText: {
    marginTop: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  menuContainer: {
    position: 'absolute',
    right: 130,
    top:20,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  menuItem: {
    padding: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
