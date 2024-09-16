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
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../data/supabaseClient";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

const MyListProductPost = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [textSearch, setTextSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  const fetchProducts = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log("Lỗi khi lấy thông tin người dùng:", userError);
      return;
    }

    const { data, error } = await supabase
      .from("ProductPost")
      .select("uid, productid, productname, productprice, productimage")
      .eq("uid", user.id);

    if (error) {
      console.log("Lỗi khi lấy dữ liệu:", error);
    } else {
      setProducts(data);
      setFilteredProducts(data);
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
        <Icon name="search-outline" size={30} color="#000" style={{ bottom: 8 }} />
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
        name="MyListProductPost"
        component={MyListProductPost}
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
});

export default MyListProductPostStack;
