import React, { useState, useEffect, useCallback } from "react";
import { View, Image, Text, StyleSheet,TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from '../../data/supabaseClient';
import { getUserName, getUserAvatar } from "../../data/getUserData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi"; // Import ngôn ngữ tiếng Việt

dayjs.extend(relativeTime);
dayjs.locale("vi");

const DetailProductPost = () => {
  const route = useRoute(); 
  const { productId } = route.params || {};
  console.log('productId', productId);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  const fetchProduct = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const { user } = data;
      if (user) {
        setUserId(user.id);
        // Fetch post details along with user data
        const { data: productpostData, error: productpostError } = await supabase
          .from("ProductPost")
          .select("*, User(name, avatar)") // Join the User table to get user data
          .eq("productid", productId)
          .single();

        if (productpostError) {
          console.error("Error fetching post:", productpostError);
          throw productpostError;
        }
        setProduct(productpostData);

        //Lấy dữ liệu người dùng
        const name = await getUserName();
        const avatar = await getUserAvatar();
        setUserName(name);
        setUserAvatar(avatar);
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
    <View style={styles.container}>
      {/* Product Image */}
      <Image
        style={styles.productImage}
        source={{ uri: product.productimage || 'https://link-to-ps5-controller-image.jpg' }}
      />

      {/* Product Title */}
      <Text style={styles.productTitle}>{product.productname}</Text>

      {/* Price */}
      <Text style={styles.price}>{product.productprice}₫</Text>
      <Text style={styles.timePosted}>Đăng bán {dayjs(product.timestamp).fromNow()}</Text>

      {/* Product Description */}
      <View style={styles.description}>
        <Text style={styles.descHeader}>Mô tả:</Text>
        <Text>• {product.productdesc}</Text>
      </View>

      {/* Seller Info */}
      {product && (
        <View style={styles.sellerInfo}>
         {product.User?.avatar ? (
          <Image
            source={{
              uri: product.User.avatar,
            }}
            style={styles.sellerAvatar}
          />
        ) : (
          <Image
            source={{
              uri: "https://via.placeholder.com/150",
            }}
            style={styles.sellerAvatar}
          />
        )}
        <Text style={styles.sellerName}>{product.User?.name}</Text>
      </View>
      )}
      

      {/* Contact Button */}
      <TouchableOpacity style={styles.contactButton}>
        <Text style={styles.contactButtonText}>Nhắn tin với người bán</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    marginVertical: 5,
  },
  timePosted: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 10,
  },
  description: {
    marginBottom: 10,
  },
  descHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactButton: {
    backgroundColor: '#009EFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DetailProductPost;
