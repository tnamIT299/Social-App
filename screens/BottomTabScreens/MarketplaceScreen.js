import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient";

const MarketplaceScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("ProductPost") // tên bảng
      .select("productid, productname, productprice, productimage"); // các cột cần lấy

    if (error) {
      console.log("Lỗi khi lấy dữ liệu:", error);
    } else {
      console.log("Dữ liệu:", data);
      setProducts(data); // Cập nhật state products với dữ liệu lấy từ Supabase
    }

    setLoading(false); // Tắt loading khi có dữ liệu
  };

  useEffect(() => {
    fetchProducts(); // Gọi khi component được mount
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts(); // Gọi lại khi màn hình nhận focus
    }, [])
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.productimage }} style={styles.image} />
      <Text style={styles.title}>{item.productname}</Text>
      <Text style={styles.price}>{item.productprice} VNĐ</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const handleCreatePostProuduct = () => {
    navigation.navigate("AddProductScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Marketplace</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleCreatePostProuduct}>
            <Icon
              name="add-circle-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity>
            <Icon
              name="search-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={(item) => item.productid}  // Sử dụng productid
      numColumns={2}
      contentContainerStyle={styles.grid}
    />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0066ff",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 5,
  },
  notificationIcon: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  notificationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  postInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
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
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  cardContainer: {
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 10,
    right: 10,
  },
  card: {
    width: 100,
    alignItems: "center",
    marginHorizontal: 10,
  },
  cardImage: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  cardText: {
    marginTop: 5,
  },
  menuContainer: {
    position: "absolute",
    right: 130,
    top: 20,
    backgroundColor: "white",
    borderRadius: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  menuItem: {
    padding: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    justifyContent: "center",
    padding: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 8,
    alignItems: "center",
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  title: {
    fontSize: 16,
    color:'red',
    marginVertical: 10,
  },
  price: {
    fontSize: 14,
    color: "gray",
  },
});

export default MarketplaceScreen;
