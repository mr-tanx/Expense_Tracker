import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      setShowLanding(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showLanding) {
    return (
      <View style={styles.container}>
        <Animated.Image
          source={require("./src/assets/logo.png")}
          style={[
            styles.logo,
            { opacity, transform: [{ scale }] },
          ]}
          resizeMode="contain"
        />

        <Animated.Text style={[styles.title, { opacity }]}>
          Expense Tracker
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity }]}>
          Track money. Stay chill 😌
        </Animated.Text>
      </View>
    );
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
