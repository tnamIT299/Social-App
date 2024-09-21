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
  Dimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient";
import RNPickerSelect from "react-native-picker-select";
import Swiper from "react-native-swiper";
const { width: screenWidth } = Dimensions.get("window");
const MarketplaceScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productCategory, setProductCategory] = useState("");
  const [uid, setUid] = useState(null);

  const fetchProducts = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log("Lỗi khi lấy thông tin người dùng:", userError);
      return;
    }

    // Lấy uid từ thông tin người dùng
    const uid = user.id;
    const { data, error } = await supabase
      .from("ProductPost") // tên bảng
      .select("productid, productname, productprice, productimage"); // các cột cần lấy

    if (error) {
      console.log("Lỗi khi lấy dữ liệu:", error);
    } else {
      console.log("Dữ liệu:", data);
      setProducts(data); // Cập nhật state products với dữ liệu lấy từ Supabase
      setUid(uid);
    }

    setLoading(false); // Tắt loading khi có dữ liệu
  };

  const handleDetailProductPost = (productId, uid) => {
    navigation.navigate("DetailProductPost", { productId, uid });
  };

  const fetchProductsType = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const uid = user.id;

    const { data, error } = await supabase
      .from("ProductPost") // tên bảng
      .select("productid, productname, productprice, productimage") // các cột cần lấy
      .eq("productcategory", productCategory);

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

  useEffect(() => {
    if (productCategory) {
      fetchProductsType(); // Chỉ gọi khi có productCategory
    }
  }, [productCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts(); // Gọi lại khi màn hình nhận focus
    }, [])
  );

  const renderItem = ({ item }) => {
    let images = [];
  
    // Kiểm tra nếu productimage là chuỗi JSON hợp lệ
    try {
      images = JSON.parse(item.productimage);
    } catch (e) {
      // Nếu không phải JSON, kiểm tra nếu đó là chuỗi URL đơn
      if (typeof item.productimage === "string" && item.productimage.startsWith("http")) {
        images = [item.productimage]; // Đưa chuỗi URL vào mảng
      } else {
        console.log("Lỗi khi parse JSON hoặc không phải URL hợp lệ:", e);
      }
    }
  
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() => handleDetailProductPost(item.productid, uid)}
        >
          {images.length > 0 ? (
            <View style={styles.containerImage}>
              {images.length === 1 ? (
                <Image
                  key={0}
                  source={{ uri: images[0] }}
                  style={styles.cardImage}
                />
              ) : (
                <Swiper
                  loop={true}
                  autoplay={true}
                  showsButtons={false}
                  style={styles.wrapper}
                >
                  {images.map((img, index) => (
                    <View key={index} style={styles.slide}>
                      <Image source={{ uri: img }} style={styles.image} />
                    </View>
                  ))}
                </Swiper>
              )}
            </View>
          ) : (
            // Hiển thị hình ảnh mặc định nếu không có hình ảnh
            <Image 
              source={require('../../assets/favicon.png')} 
              style={styles.cardImage} 
            />
          )}
          <Text style={styles.title}>{item.productname}</Text>
          <Text style={styles.price}>{item.productprice} VNĐ</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  
  

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const handleCreatePostProuduct = () => {
    navigation.navigate("AddProductScreen");
  };

  const handleMyListProductPost = () => {
    navigation.navigate("MyListProductPost");
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

          <TouchableOpacity onPress={handleMyListProductPost}>
            <Icon name="person-circle-outline" size={30} style={styles.icon} />
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

      <View style={{ padding: 10 }}>
        <RNPickerSelect
          onValueChange={(value) => setProductCategory(value)}
          items={[
            { label: "Đồ dùng gia đình", value: "Đồ dùng gia đình" },
            { label: "Đồ ăn thực phẩm", value: "Đồ ăn thực phẩm" },
            { label: "Giải trí", value: "Giải trí" },
            { label: "Quần áo tư trang", value: "Quần áo tư trang" },
            { label: "Chăm sóc cá nhân", value: "Chăm sóc cá nhân" },
            { label: "Đồ điện tử", value: "Đồ điện tử" },
            { label: "Xe cộ", value: "Xe cộ" },
            { label: "Nhà đất", value: "Nhà đất" },
          ]}
          style={pickerSelectStyles}
          placeholder={{ label: "Tất cả sản phẩm", value: null }}
        />
      </View>

      <FlatList
        style={{ marginBottom: 60 }}
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.productid} // Sử dụng productid
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
    width: 150, // Adjust this value
    height: 150, // Adjust this value
    borderRadius: 10,
    resizeMode: 'contain',
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
    width: '100%',
    height: 150, // Set this height or adjust according to your needs
    resizeMode: 'cover', // Make sure image fits properly
  },
  title: {
    fontSize: 16,
    color: "red",
    marginVertical: 10,
  },
  price: {
    fontSize: 14,
    color: "gray",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  containerImage: {
    width: '100%',
    height: 150, // Match the height of the Swiper
  },
  wrapper: {
    height: 150,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 10,
    color: "black",
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 20,
  },
  inputAndroid: {
    flex: 0.8,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 5,
    borderColor: "black",
    borderRadius: 10,
    color: "black",
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 20,
  },
});

export default MarketplaceScreen;
