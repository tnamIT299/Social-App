import { View, Text,ActivityIndicator ,Button } from 'react-native'
import React, { useState, useEffect } from 'react';
import { supabase } from '../data/supabaseClient';

const TrangChu = () => {
  // const [session, setSession] = useState(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const getSession = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     setSession(session);
  //     setLoading(false);
  //   };
    
  //   getSession();
  // }, []);

  // if (loading) {
  //   return <ActivityIndicator size="large" />;
  // }

  return (
    <View style={{flex:1,justifyContent:'center'}}>
      {session ? (
        <Text style={{fontSize:20, color:'red',textAlign:'center'}}>{session.user.email}</Text>
      ) : (
        <Text>You are not logged in</Text>
      )}
    </View>
  );
};

export default TrangChu