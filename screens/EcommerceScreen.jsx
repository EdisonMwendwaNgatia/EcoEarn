// screens/EcommerceScreen.jsx - REDESIGNED VERSION
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from "../firebase";
import { ref, onValue } from "firebase/database";
import BottomNavBar from "../components/BottomNavBar";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EcommerceScreen() {
  const navigation = useNavigation();
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [points, setPoints] = useState(0);

  const categories = [
    { id: "all", name: "All", icon: "🌿" },
    { id: "home", name: "Home", icon: "🏠" },
    { id: "fashion", name: "Fashion", icon: "👕" },
    { id: "electronics", name: "Tech", icon: "📱" },
    { id: "beauty", name: "Beauty", icon: "💄" },
    { id: "food", name: "Food", icon: "🍎" }
  ];

  // Fetch user points
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    const userRef = ref(db, `users/${userId}/points`);
    onValue(userRef, (snapshot) => {
      const val = snapshot.val();
      setPoints(val || 0);
    });
  }, []);

  // Fetch products from Firebase
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
        setFilteredProducts(productsArray);
      }
      setLoading(false);
    });
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeCategory !== "all") {
      filtered = filtered.filter(product =>
        product.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, activeCategory, products]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    Alert.alert("Added to Cart", `${item.name} has been added to your cart!`);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const userEmail = auth.currentUser?.email || "User";
  const firstName = userEmail.split('@')[0];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCircle}>
          <Text style={styles.loadingIcon}>🛍️</Text>
        </View>
        <Text style={styles.loadingText}>Loading eco products...</Text>
      </View>
    );
  }

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
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <Text style={styles.userName}>Ready to shop sustainably? 🌱</Text>
            </View>
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => navigation.navigate("Cart", { cart })}
            >
              <Text style={styles.cartIcon}>🛒</Text>
              {getCartItemCount() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Points & Search Card */}
          <View style={styles.searchCard}>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>Available Points</Text>
              <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search eco products..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Text style={styles.searchIcon}>🔍</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  activeCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Text style={[
                  styles.categoryIcon,
                  activeCategory === category.id && styles.categoryIconActive
                ]}>
                  {category.icon}
                </Text>
                <Text style={[
                  styles.categoryText,
                  activeCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Grid */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {activeCategory === "all" ? "All Products" : 
                 categories.find(cat => cat.id === activeCategory)?.name + " Products"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filteredProducts.length} eco-friendly items found
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? "Try adjusting your search terms" : "No products in this category yet"}
              </Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              numColumns={2}
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productsGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => addToCart(item)}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image }} style={styles.productImage} />
                    <View style={styles.ecoBadge}>
                      <Text style={styles.ecoBadgeText}>♻️ ECO</Text>
                    </View>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{Math.floor(Math.random() * 30) + 10}%</Text>
                    </View>
                  </View>
                  
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productCategory}>
                      {item.category || "Eco Product"}
                    </Text>
                    
                    <View style={styles.ratingContainer}>
                      <Text style={styles.rating}>⭐ {item.rating || "4." + Math.floor(Math.random() * 9)}</Text>
                      <Text style={styles.reviewCount}>({Math.floor(Math.random() * 100) + 1})</Text>
                    </View>
                    
                    <View style={styles.priceContainer}>
                      <Text style={styles.productPrice}>${item.price}</Text>
                      <Text style={styles.originalPrice}>
                        ${(item.price * 1.3).toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.pointsContainer}>
                      <Text style={styles.pointsText}>
                        💚 {item.points || Math.floor(item.price * 10)} pts
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.addToCartBtn}
                      onPress={() => addToCart(item)}
                    >
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
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
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "#d1fae5",
    fontWeight: "500",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },
  cartButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ef4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  pointsContainer: {
    marginBottom: 16,
  },
  pointsLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
  },
  searchContainer: {
    position: "relative",
  },
  searchInput: {
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    paddingLeft: 45,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    color: "#1f2937",
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: 16,
    fontSize: 18,
    color: "#94a3b8",
  },
  categoriesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryButton: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginRight: 8,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: "#10b981",
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryIconActive: {
    color: "#ffffff",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  categoryTextActive: {
    color: "#ffffff",
  },
  productsSection: {
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
  sectionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  filterText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  productsGrid: {
    paddingHorizontal: 10,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    margin: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    maxWidth: (width - 60) / 2,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 140,
    backgroundColor: "#f3f4f6",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  ecoBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ecoBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
    height: 36,
  },
  productCategory: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rating: {
    fontSize: 11,
    color: "#f59e0b",
    fontWeight: "600",
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 10,
    color: "#9ca3af",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  pointsContainer: {
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  addToCartBtn: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  addToCartText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
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