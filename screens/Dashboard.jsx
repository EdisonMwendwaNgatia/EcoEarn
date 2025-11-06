import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { ref, onValue, set, get } from "firebase/database";
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavBar from "../components/BottomNavBar"; 


const { width } = Dimensions.get('window');

export default function Dashboard() {
  const [points, setPoints] = useState(0);
  const [code, setCode] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedInput, setFocusedInput] = useState(false);
  const navigation = useNavigation();

  // 🔒 Hardcoded Redeem Codes
  const validCodes = {
    "123456": 50,
    "654321": 100,
    "111222": 150,
    "999888": 200,
    "777555": 75,
    "333444": 25,
  };

  const userId = auth.currentUser?.uid;

  // 🔁 Fetch user points from Firebase in real time
  useEffect(() => {
    if (!userId) return;
    const userRef = ref(db, `users/${userId}/points`);
    onValue(userRef, (snapshot) => {
      const val = snapshot.val();
      setPoints(val || 0);
    });
  }, [userId]);

  // 🛍️ Fetch products from Firebase
  useEffect(() => {
    const productsRef = ref(db, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProducts(productsArray);
      }
      setLoading(false);
    });
  }, []);

  // 🪙 Handle code redemption
  const handleRedeem = async () => {
    const trimmedCode = code.trim();

    if (!trimmedCode) return Alert.alert("Error", "Enter a 6-digit code.");
    if (!validCodes[trimmedCode]) return Alert.alert("Invalid Code", "This code does not exist.");
    if (!userId) return Alert.alert("Error", "User not authenticated.");

    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      const userData = snapshot.exists() ? snapshot.val() : {};
      
      const currentPoints = userData.points || 0;
      const addedPoints = validCodes[trimmedCode];
      const newTotal = currentPoints + addedPoints;

      // Update points AND record transaction
      const newTransaction = {
        type: "Code Redemption",
        pointsEarned: addedPoints,
        code: trimmedCode,
        timestamp: new Date().toISOString()
      };

      const updatedTransactions = [...(userData.transactions || []), newTransaction];

      await set(userRef, {
        ...userData,
        points: newTotal,
        transactions: updatedTransactions
      });

      Alert.alert("Success", `You earned ${addedPoints} points! 🎉`);
      setCode("");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to redeem code.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: async () => await auth.signOut() }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCircle}>
          <Text style={styles.loadingIcon}>🌱</Text>
        </View>
        <Text style={styles.loadingText}>Loading your eco journey...</Text>
      </View>
    );
  }

  const userEmail = auth.currentUser?.email || "User";
  const firstName = userEmail.split('@')[0];

  return (
    <View style={styles.fullContainer}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Text style={styles.pointsLabel}>Your Eco Points</Text>
            <Text style={styles.pointsBadge}>💚</Text>
          </View>
          <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
          <Text style={styles.pointsSubtext}>Keep earning to unlock rewards!</Text>
          
          <TouchableOpacity 
            style={styles.viewHistoryBtn}
            onPress={() => navigation.navigate("ActivityScreen")}
          >
            <Text style={styles.viewHistoryText}>View History →</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statValue}>{Math.floor(points / 10)}</Text>
          <Text style={styles.statLabel}>Items Recycled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🌍</Text>
          <Text style={styles.statValue}>{Math.floor(points / 5)}kg</Text>
          <Text style={styles.statLabel}>CO₂ Saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>#{Math.floor(Math.random() * 100)}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>

      {/* Code Redemption Section */}
      <View style={styles.redeemSection}>
        <View style={styles.redeemHeader}>
          <Text style={styles.redeemTitle}>Redeem Code</Text>
          <Text style={styles.redeemSubtitle}>Enter your 6-digit reward code</Text>
        </View>
        
        <View style={styles.redeemInputContainer}>
          <TextInput
            style={[styles.codeInput, focusedInput && styles.codeInputFocused]}
            placeholder="000000"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            onFocus={() => setFocusedInput(true)}
            onBlur={() => setFocusedInput(false)}
          />
          <TouchableOpacity 
            style={[styles.redeemBtn, !code.trim() && styles.redeemBtnDisabled]} 
            onPress={handleRedeem}
            disabled={!code.trim()}
          >
            <Text style={styles.redeemBtnText}>Redeem</Text>
          </TouchableOpacity>
        </View>

        {/* Sample Codes Hint */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>Tip: Rabbit's hole</Text>
        </View>
      </View>

      {/* Marketplace Section */}
      <View style={styles.marketplaceSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Eco Marketplace</Text>
            <Text style={styles.sectionSubtitle}>Sustainable products for a better tomorrow</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyText}>No products available yet</Text>
            <Text style={styles.emptySubtext}>Check back soon for eco-friendly items!</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate("EcommerceScreen", { product: item })}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <View style={styles.ecobadge}>
                    <Text style={styles.ecoBadgeText}>♻️ ECO</Text>
                  </View>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>${item.price}</Text>
                    <View style={styles.pointsTag}>
                      <Text style={styles.pointsTagText}>💚 {item.points || Math.floor(item.price * 10)} pts</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Footer Spacer */}
      <View style={styles.footerSpacer} />
    </ScrollView>
    <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: "#f8faf9",
  },
  container: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8faf9",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingIcon: {
    fontSize: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "600",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: "#d1fae5",
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: {
    fontSize: 22,
  },
  pointsCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pointsLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pointsBadge: {
    fontSize: 24,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 8,
  },
  pointsSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 16,
  },
  viewHistoryBtn: {
    alignSelf: "flex-start",
  },
  viewHistoryText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  redeemSection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  redeemHeader: {
    marginBottom: 16,
  },
  redeemTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 4,
  },
  redeemSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  redeemInputContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  codeInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 4,
    backgroundColor: "#f9fafb",
    color: "#1f2937",
  },
  codeInputFocused: {
    borderColor: "#10b981",
    backgroundColor: "#ffffff",
  },
  redeemBtn: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemBtnDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
  },
  redeemBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  hintIcon: {
    fontSize: 16,
  },
  hintText: {
    fontSize: 13,
    color: "#059669",
    flex: 1,
  },
  marketplaceSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#065f46",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  productList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  productCard: {
    width: width * 0.65,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
    backgroundColor: "#f3f4f6",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  ecoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ecoBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    minHeight: 40,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
  },
  pointsTag: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsTagText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  footerSpacer: {
    height: 90,
  },
});