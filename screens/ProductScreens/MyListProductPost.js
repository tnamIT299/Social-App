import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { deleteProductPost } from "../../server/ProductPostService";
import { supabase } from "../../data/supabaseClient";
import Swiper from "react-native-swiper";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const MyListProductPostTab = () => {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [textSearch, setTextSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedUId, setselectedUId] = useState(null); // State to keep track of selected product ID

  const fetchProducts = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const uid = user.id;
    if (userError) {
      console.log("Lỗi khi lấy thông tin người dùng:", userError);
      return;
    }

    const { data, error } = await supabase
      .from("ProductPost")
      .select("*")
      .eq("uid", user.id);

    if (error) {
      console.log("Lỗi khi lấy dữ liệu:", error);
    } else {
      setProducts(data);
      setFilteredProducts(data);
      setselectedUId(uid);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  useEffect(() => {
    if (textSearch === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((item) =>
        item.productname.toLowerCase().includes(textSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [textSearch, products]);

  const toggleMenu = (productId) => {
    setSelectedProductId(productId); // Set the selected product ID when menu is opened
    setVisible(!visible);
  };

  const handleDetailProductPost = () => {
    if (selectedProductId) {
      navigation.navigate("DetailProductPost", {
        productId: selectedProductId,
        uid: selectedUId,
      });
      toggleMenu(); // Close menu after navigating
    }
  };

  const handleEditProductPost = (product) => {
    if (product) {
      navigation.navigate("EditProductPostScreen", {
        screen: "EditProductPostTab", // Stack screen name
        params: {
          productId: product.productid,
          uid: selectedUId, // Ensure selectedUId is set
          productName: product.productname,
          productPrice: product.productprice,
          productDesc: product.productdesc,
          productCategory: product.productcategory, // Ensure productCategory is set
          productStatus: product.productstatus, // Ensure productStatus is set
          productImage: JSON.parse(product.productimage), // Send product details
        },
      });
      toggleMenu(); // Close menu after navigating
    }
  };

  const handleDeleteProductPost = (productid) => {
    toggleMenu();
    deleteProductPost(productid, fetchProducts);
  };

  const renderItem = ({ item }) => {
    let images = [];

    // Kiểm tra nếu productimage là chuỗi JSON hợp lệ
    try {
      images = JSON.parse(item.productimage);
    } catch (e) {
      // Nếu không phải JSON, kiểm tra nếu đó là chuỗi URL đơn
      if (
        typeof item.productimage === "string" &&
        item.productimage.startsWith("http")
      ) {
        images = [item.productimage]; // Đưa chuỗi URL vào mảng
      } else {
        console.log("Lỗi khi parse JSON hoặc không phải URL hợp lệ:", e);
      }
    }

    return (
      <View style={styles.card}>
        <Icon
          name="ellipsis-vertical-outline"
          size={20}
          color="black"
          style={{ position: "absolute", right: 5, top: 10 }}
          onPress={() => toggleMenu(item.productid)} // Pass the product ID to toggleMenu
        />

        <Modal
          animationType="fade"
          transparent={true}
          visible={visible}
          onRequestClose={toggleMenu} // Đóng modal khi nhấn nút back trên Android
        >
          <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDetailProductPost} // Use handleDetailProductPost directly
              >
                <Text>Xem chi tiết</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  handleEditProductPost(
                    products.find(
                      (item) => item.productid === selectedProductId
                    )
                  )
                } // Pass the product object
              >
                <Text>Sửa thông tin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleDeleteProductPost(selectedProductId)} // Use selectedProductId
              >
                <Text>Xoá</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
            source={require("../../assets/favicon.png")}
            style={styles.cardImage}
          />
        )}

        <Text style={styles.title}>{item.productname}</Text>
        <Text style={styles.price}>{item.productprice} VNĐ</Text>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextInput
          style={styles.boxSearch}
          placeholder="Tìm kiếm sản phẩm niêm yết..."
          value={textSearch}
          onChangeText={setTextSearch}
        />
        <Icon
          name="search-outline"
          size={30}
          color="#000"
          style={{ bottom: 8 }}
        />
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Không tìm thấy sản phẩm nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.productid}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      )}
    </SafeAreaView>
  );
};

const MyListProductPostStack = ({ navigation }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyListProductPostTab"
        component={MyListProductPostTab}
        options={{
          headerTitle: "Bài niêm yết của bạn",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#2F95DC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <Icon
              name="chevron-back-outline"
              size={30}
              onPress={() => navigation.goBack()}
              style={{ color: "#FFFFFF", marginLeft: 10 }}
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ paddingHorizontal: 10 }}
              onPress={() => navigation.navigate("AddProductScreen")}
            >
              <Icon name="add-circle-outline" size={30} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack.Navigator>
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
  },
  boxSearch: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    height: 40,
    width: "90%",
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
    color: "red",
    marginVertical: 10,
  },
  price: {
    fontSize: 14,
    color: "gray",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 18,
    color: "gray",
  },
  menuContainer: {
    position: "absolute",
    right: 130,
    top: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  containerImage: {
    width: "100%",
    height: 150, // Match the height of the Swiper
  },
  wrapper: {
    height: 150,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    width: 120,
    height: 150,
    borderRadius: 10,
    resizeMode: "contain",
  },
});

export default MyListProductPostStack;
