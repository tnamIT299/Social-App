import { supabase } from "../data/supabaseClient";
import * as FileSystem from "expo-file-system";
import { Alert } from 'react-native';

export const createProductPost = async (productPostDetails) => {
  const { title, price, desc,status, imageUri,category, userId } = productPostDetails;

  try {
    let imageUrl = "";
    if (imageUri) {
      // Kiểm tra nếu file tồn tại trước khi tiếp tục
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      console.log("Thông tin file:", fileInfo);
      if (!fileInfo.exists) throw new Error("File không tồn tại.");

      const fileName = `Post_Product_Image/${Date.now()}_${fileNameFromUri(imageUri)}`;

      //console.log("Đang tải ảnh lên Supabase:", fileName);

      // Tạo đối tượng FormData
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: fileName,
        type: "image/jpeg",
      });

      // Tải ảnh lên Supabase Storage
      const response = await fetch(
        `https://uhhyfdvwcgkdhazvgamp.supabase.co/storage/v1/object/SocialApp/${fileName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaHlmZHZ3Y2drZGhhenZnYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1Mzg1NzcsImV4cCI6MjA0MTExNDU3N30.wIntuljwnbAe99So-08Rx8hTa3nHNo1eHE61dy6VZOc`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok)
        throw new Error(`Tải ảnh lên Supabase thất bại: ${result.message}`);

      // Lấy URL công khai của ảnh
      const { data: urlData, error: urlError } = supabase.storage
        .from("SocialApp")
        .getPublicUrl(fileName);

      if (urlError)
        throw new Error(`Lấy URL công khai thất bại: ${urlError.message}`);

      imageUrl = urlData.publicUrl;
      //console.log("URL ảnh:", imageUrl);
    }

    const product_post = {
      productid: generateUniqueId(),
      productname: title || "",
      productprice: price || "",
      productdesc: desc || "",
      productimage: imageUrl || "",
      productcategory:category || "",
      productstatus: status || "",
      uid: userId || "",
      timestamp: getLocalISOString(),
    };

    console.log("Đang thêm bài viết vào cơ sở dữ liệu:", product_post);

    const { data, error } = await supabase.from("ProductPost").insert([product_post]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Lỗi tạo bài viết:", error);
    return false;
  }
};

export const deleteProductPost = async (productId, fetchProducts) => {
  Alert.alert(
    "Xác nhận xóa",
    "Bạn có chắc chắn muốn xóa sản phẩm này không?",
    [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đồng ý",
        onPress: async () => {
          const { data, error } = await supabase
            .from("ProductPost")
            .delete()
            .eq("productid", productId);

          if (error) {
            console.log("Lỗi khi xóa sản phẩm:", error);
          } else {
            Alert.alert(
              "Thông báo",
              "Xóa sản phẩm thành công!", 
              [
                {
                  text: "OK", 
                },
              ]
            );
            if (fetchProducts) {
              fetchProducts();
            }
          }
        },
      },
    ],
    { cancelable: true }
  );
};

// Hàm lấy tên tệp từ URI
const fileNameFromUri = (uri) => {
  const parts = uri.split("/");
  return parts[parts.length - 1];
};

// Hàm sinh ID duy nhất
const generateUniqueId = () => {
  return Date.now().toString();
};

// Hàm lấy thời gian theo múi giờ địa phương
const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};
