// sendOtp.js
import { Alert } from "react-native";
import { supabase } from "../data/supabaseClient";

export const sendotp = async (email, setIsCodeSent) => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (!email) {
    Alert.alert("Thông báo", "Vui lòng nhập email.");
    return;
  }

  if (!emailRegex.test(email)) {
    Alert.alert("Thông báo", "Email không hợp lệ");
    return;
  }

  const { data: user, error: userError } = await supabase
    .from('User')
    .select('email')
    .eq('email', email)
    .single();

  if (userError || !user) {
    Alert.alert("Thông báo", "Email không tồn tại trong hệ thống");
    return;
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (!error) {
    setIsCodeSent(true);
  } else {
    Alert.alert("Thông báo", "Không thể gửi mã khôi phục.");
  }
};

export const confirmotp = async (email, recoveryCode, setOtp) => {
  if (!recoveryCode) {
    Alert.alert("Thông báo", "Vui lòng nhập mã OTP");
    return;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.verifyOtp({
    email,
    token: `${recoveryCode}`,
    type: "email",
  });

  if (error) {
    Alert.alert("Thông báo", "Mã khôi phục không đúng");
    return;
  }

  if (session && session.access_token) {
    setOtp(true);
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }
};