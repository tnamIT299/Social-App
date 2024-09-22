import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import Swiper from "react-native-swiper";
import { getUserId, getUserName, getUserAvatar } from "../../data/getUserData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt
const { width: screenWidth } = Dimensions.get("window");

dayjs.extend(relativeTime);
dayjs.locale("vi");

const DetailProductPost = () => {
  const route = useRoute();
  const { productId, uid } = route.params || {};
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const navigation = useNavigation();

  const fetchProduct = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const { user } = data;
      if (user) {
        // Fetch post details along with user data
        const { data: productpostData, error: productpostError } =
          await supabase
            .from("ProductPost")
            .select("*, User(uid,name, avatar)") // Join the User table to get user data
            .eq("productid", productId)
            .single();

        if (productpostError) {
          console.error("Error fetching post:", productpostError);
          throw productpostError;
        }
        setProduct(productpostData);

        //Lấy dữ liệu người dùng
        const uid = await getUserId();
        const name = await getUserName();
        const avatar = await getUserAvatar();
        setUserName(name);
        setUserAvatar(avatar);
        setUserId(uid);
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
    }, [productId])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text>Error fetching product: {error}</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return <Text>No product found</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
      </View>
      <ScrollView style={styles.container}>
        {/* Product Image */}
        {product.productimage && (
          <View contentContainerStyle={styles.containerImage}>
            <View style={styles.gridContainer}>
              {product.productimage &&
              Array.isArray(JSON.parse(product.productimage)) ? (
                JSON.parse(product.productimage).length === 1 ? (
                  <Image
                    key={0}
                    source={{ uri: JSON.parse(product.productimage)[0] }}
                    style={styles.productImage}
                  />
                ) : (
                  <Swiper
                    loop={true}
                    autoplay={false}
                    showsButtons={false}
                    style={styles.wrapper}
                  >
                    {JSON.parse(product.productimage).map((item, index) => (
                      <View key={index} style={styles.slide}>
                        <Image source={{ uri: item }} style={styles.image} />
                      </View>
                    ))}
                  </Swiper>
                )
              ) : (
                <Text>Không có hình ảnh nào</Text>
              )}
            </View>
          </View>
        )}

        {/* Product Title */}
        <Text style={styles.productTitle}>{product.productname}</Text>

        {/* Price */}
        <Text style={styles.price}>{product.productprice}₫</Text>
        <Text style={styles.timePosted}>
          Đăng bán {dayjs(product.timestamp).fromNow()}
        </Text>

        {/* Product Description */}
        <View style={styles.description}>
          <Text style={styles.descHeader}>Mô tả:</Text>
          <Text>• {product.productdesc}</Text>
        </View>

        <Text style={styles.statusText}>
          Tình trạng : {product.productstatus}
        </Text>

        {/* Seller Info */}
        {product && (
          <View style={styles.sellerInfo}>
            <Image
              source={{
                uri: product.User?.avatar || "https://via.placeholder.com/150",
              }}
              style={styles.sellerAvatar}
            />
            <Text style={styles.sellerName}>{product.User?.name}</Text>
          </View>
        )}

        {/* Contact Button */}
        {userId !== product.User?.uid && (
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Chat với người bán</Text>
          </TouchableOpacity>
        )}

        {userId === product.User?.uid && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() =>
              navigation.navigate("EditProductPostScreen", {
                screen: "EditProductPostTab", // Tên tab bạn muốn điều hướng đến
                params: {
                  productId: product.productid,
                  userId: uid, // Bạn có thể thay `uid` bằng `userId` nếu nó phù hợp
                  productName: product.productname,
                  productPrice: product.productprice,
                  productDesc: product.productdesc,
                  productCategory: product.productcategory,
                  productStatus: product.productstatus,
                  productImage: JSON.parse(product.productimage),
                  sellerName: product.User?.name,
                  sellerAvatar: product.User?.avatar,
                  timestamp: product.timestamp,
                },
              })
            }
          >
            <Text style={styles.contactButtonText}>Sửa thông tin sản phẩm</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ddd",
    marginBottom: 20,
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  productImage: {
    width: "100%",
    height: 250,
    resizeMode: "contain",
  },
  productTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
    marginVertical: 5,
  },
  timePosted: {
    fontSize: 15,
    color: "gray",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    color: "black",
    marginBottom: 10,
    fontWeight: "bold",
  },
  description: {
    marginBottom: 10,
  },
  descHeader: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 18,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  contactButton: {
    backgroundColor: "#009EFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  contactButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexDirection: "column",
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  containerImage: {
    flexGrow: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  wrapper: {
    height: 250,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: screenWidth,
    height: 250,
    resizeMode: "cover",
  },
});

export default DetailProductPost;
