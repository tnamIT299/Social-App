import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../data/supabaseClient";
import Icon from "react-native-vector-icons/Ionicons";
import { getUserId,getUserName, getUserAvatar } from "../../data/getUserData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt

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
  console.log("productId", productId);
  console.log("uid", uid); 
  console.log("userId", userId); 

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
        <Image
          style={styles.productImage}
          source={{
            uri:
              product.productimage ||
              "https://link-to-ps5-controller-image.jpg",
          }}
        />

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
          <TouchableOpacity style={styles.contactButton}>
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
    padding: 20,
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
    fontSize: 18,
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
    fontSize: 12,
    color: "gray",
    marginBottom: 10,
  },
  description: {
    marginBottom: 10,
  },
  descHeader: {
    fontWeight: "bold",
    marginBottom: 5,
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
    marginBottom:10,
  },
  contactButton: {
    backgroundColor: "#009EFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  contactButtonText: {
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
});

export default DetailProductPost;
