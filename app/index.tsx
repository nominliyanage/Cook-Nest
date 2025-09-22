import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
// Ensure useAuth is exported from AuthContext, or import the correct member
import { useAuth } from '@/context/AuthContext'
// If useAuth is not exported, replace with the correct import, e.g.:
// import AuthContext from '@/context/AuthContext'
// const { user, loading } = React.useContext(AuthContext);

const Index = () => {

  const route = useRouter();
  const { user, loading } = useAuth();
  console.log("User:", user);
  console.log("Loading:", loading);

  useEffect(() => {
    if (!loading) {
      if (user) {
        route.push("/home");
      } else {
        route.push("/login");
      }
    }
  }, [loading, user]);

  return  loading ? (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
  ): null
}

export default Index