import { supabase } from "../data/supabaseClient";
import * as FileSystem from "expo-file-system";

export const createGroup = async (groupDetails) => {
    const { title, desc, imageUris, userId } = groupDetails;
    try {
      let imageUrls = []; // Mảng để lưu URL của các ảnh
  
      if (!imageUris || imageUris.length === 0) {
        imageUrls.push("https://static.vecteezy.com/system/resources/previews/000/643/462/original/vector-group-people-icon.jpg");
      } else {
        // Nếu có ảnh, xử lý tải từng ảnh lên Supabase
        for (const imageUri of imageUris) {
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (!fileInfo.exists) throw new Error("File không tồn tại.");
  
          const fileName = `Avatar_Group/${Date.now()}_${fileNameFromUri(imageUri)}`;
  
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
  
          const { data: urlData, error: urlError } = supabase.storage
            .from("SocialApp")
            .getPublicUrl(fileName);
          if (urlError)
            throw new Error(`Lấy URL công khai thất bại: ${urlError.message}`);
  
          imageUrls.push(urlData.publicUrl); // Thêm URL ảnh vào mảng
        }
      }
  
      // Tạo nhóm với thông tin đã cung cấp
      const group = {
        grouptitle: title || "",
        groupdescription: desc || "",
        groupicon: JSON.stringify(imageUrls),
        creatorId: userId || "",
        createAt: getLocalISOString(),
      };
  
      const { data: groupData, error } = await supabase
      .from("Group")
      .insert([group])
      .select("groupid") 
      .single();
  
      if (error) {
        console.error("Error inserting group:", error); // Log error nếu có
        throw error;
      }
  
      console.log("Group data:", groupData);
  
      // Lấy groupid sau khi nhóm được tạo thành công
      const groupId = groupData.groupid;
      if (!groupId) {
        throw new Error("groupid không được trả về từ database");
      }
  
      // Tạo bản ghi trong bảng Participant cho người tạo nhóm
      const participant = {
        groupid: groupId,
        Uid: userId,  // UID của người tạo nhóm
        role: 'admin', // Mặc định là admin
      };
  
      const { error: participantError } = await supabase
        .from("Participant")
        .insert([participant]);
  
      if (participantError) {
        console.error("Error inserting participant:", participantError);
        throw participantError;
      }
  
      return true;
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);
      return false;
    }
  };

const fileNameFromUri = (uri) => {
  const parts = uri.split("/");
  return parts[parts.length - 1];
};

const getLocalISOString = () => {
  const localTimeOffset = 7 * 60 * 60 * 1000; // Chênh lệch múi giờ UTC+7
  const localDate = new Date(new Date().getTime() + localTimeOffset);
  return localDate.toISOString();
};
