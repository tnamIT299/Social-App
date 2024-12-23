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
  TextInput,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient";
import RNPickerSelect from "react-native-picker-select";
import Swiper from "react-native-swiper";
import stylesObject from './style/styleMarket';
const styles = stylesObject.styles;
const pickerSelectStyles = stylesObject.pickerSelectStyles;


const MarketplaceScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noProductsFound, setNoProductsFound] = useState(false);
  const [productCategory, setProductCategory] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
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
      setProducts(data);
      setFilteredProducts(data); // Cập nhật state products với dữ liệu lấy từ Supabase
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
      if (data.length === 0) {
        // Nếu không có dữ liệu
        setProducts([]); // Cập nhật state là mảng rỗng
        setNoProductsFound(true); // Đặt state này để hiển thị thông báo
      } else {
        console.log("Dữ liệu:", data);
        setProducts(data); // Cập nhật state products với dữ liệu từ Supabase
        setNoProductsFound(false); // Đặt state về false nếu có dữ liệu
      }
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

  useEffect(() => {
    if (searchText === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((item) =>
        item.productname.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchText]);

  // Hàm sắp xếp sản phẩm theo giá từ thấp đến cao
  const sortByPriceLowToHigh = () => {
    const sortedProducts = [...products].sort(
      (a, b) => a.productprice - b.productprice
    );
    setFilteredProducts(sortedProducts);
  };

  // Hàm sắp xếp sản phẩm theo giá từ cao đến thấp
  const sortByPriceHighToLow = () => {
    const sortedProducts = [...products].sort(
      (a, b) => b.productprice - a.productprice
    );
    setFilteredProducts(sortedProducts);
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
              source={require("../../assets/favicon.png")}
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

          <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
            <Icon
              name="search-outline"
              size={30}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        {searchVisible && (
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchText}
            onChangeText={setSearchText}
          />
        )}
      </View>

      <View style={{ padding: 5 }}>
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
        <Text style={styles.textSort}>Sắp xếp theo</Text>
        <View style={styles.containerSort}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={sortByPriceLowToHigh}
          >
            <Text>Giá Thấp - Cao</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={sortByPriceHighToLow}
          >
            <Text>Giá Cao - Thấp</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <View style={styles.notFoundContainer} />
      ) : noProductsFound ? (
        <Text style={styles.notFoundText}>Không tìm thấy sản phẩm nào</Text>
      ) : (
        <FlatList
          style={{ marginBottom: 60 }}
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.productid} // Sử dụng productid
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      )}
    </SafeAreaView>
  );
};

export default MarketplaceScreen;
