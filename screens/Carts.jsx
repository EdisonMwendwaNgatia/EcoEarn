// screens/Carts.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import * as MailComposer from "expo-mail-composer";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { ref, get, set, onValue } from "firebase/database";
import { LinearGradient } from "expo-linear-gradient";

export default function Carts({ route }) {
  const { cart } = route.params || { cart: [] };
  const navigation = useNavigation();

  const [points, setPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const userId = auth.currentUser?.uid;

  // Initialize cart items with quantity
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // Initialize cart items with quantity when cart changes
    const itemsWithQuantity = cart.map((item) => ({
      ...item,
      quantity: item.quantity || 1,
    }));
    setCartItems(itemsWithQuantity);
  }, [cart]);

  // Calculate total based on quantity
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 🔁 Get user points from Firebase
  useEffect(() => {
    if (!userId) return;
    const pointsRef = ref(db, `users/${userId}/points`);
    onValue(pointsRef, (snapshot) => {
      const val = snapshot.val();
      setPoints(val || 0);
    });
  }, [userId]);

  // 💰 Calculate discount (100 points = $1)
  const pointValue = Math.floor(points / 100);
  const discountedTotal = usePoints ? Math.max(0, total - pointValue) : total;
  const savings = total - discountedTotal;

  // Update quantity for an item
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = [...cartItems];
    updatedCart[index].quantity = newQuantity;
    setCartItems(updatedCart);
  };

  // Remove item from cart
  const removeItem = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
  };

  // 🧾 Checkout logic
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart first.");
      return;
    }

    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      const userData = snapshot.exists() ? snapshot.val() : {};

      const usedPoints = usePoints ? pointValue * 100 : 0;
      const remainingPoints = usePoints ? points - usedPoints : points;
      const totalSpent = (userData.totalSpent || 0) + discountedTotal;

      // Record checkout with quantities
      const newCheckout = {
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        total: discountedTotal,
        pointsUsed: usedPoints,
        timestamp: new Date().toISOString(),
      };

      const updatedCheckouts = [...(userData.checkouts || []), newCheckout];

      // Record points transaction if used
      let updatedTransactions = userData.transactions || [];
      if (usePoints) {
        const pointsTransaction = {
          type: "Points Redeemed for Purchase",
          pointsRedeemed: usedPoints,
          timestamp: new Date().toISOString(),
        };
        updatedTransactions = [...updatedTransactions, pointsTransaction];
      }

      // Update Firebase
      await set(userRef, {
        ...userData,
        points: remainingPoints,
        totalSpent: totalSpent,
        checkouts: updatedCheckouts,
        transactions: updatedTransactions,
      });

      // Send email with quantity information
      const body = cartItems
        .map(
          (item) =>
            `${item.name} x${item.quantity} - $${(
              item.price * item.quantity
            ).toFixed(2)}`
        )
        .join("\n");

      await MailComposer.composeAsync({
        recipients: ["edinsonbrian95@gmail.com"],
        subject: "EcoBin Checkout - Order Confirmation",
        body: `🌱 Thank you for your eco-friendly purchase!\n\nOrder Summary:\n${body}\n\nSubtotal: $${total.toFixed(
          2
        )}\nPoints Used: ${usedPoints}\nDiscount: -$${savings.toFixed(
          2
        )}\n\nTotal: $${discountedTotal.toFixed(
          2
        )}\n\nRemaining Points: ${remainingPoints}\n\nTogether we're making a difference! 🌍`,
      });

      Alert.alert(
        "Success! 🎉",
        `Your order has been placed!\n\nYou saved $${savings.toFixed(
          2
        )} with your points.\n\nRemaining points: ${remainingPoints}`,
        [
          {
            text: "Continue Shopping",
            onPress: () => navigation.navigate("Dashboard"),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Checkout failed. Please try again.");
    }
  };

  // Calculate items count (total quantity)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const canRedeemPoints = pointValue > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#10b981", "#059669"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerSubtitle}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </View>
        <View style={styles.cartIconContainer}>
          <Text style={styles.cartIcon}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add eco-friendly products to get started!
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate("Dashboard")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.itemsContainer}>
              <FlatList
                data={cartItems}
                scrollEnabled={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.cartItem}>
                    <View style={styles.itemImageContainer}>
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.itemImage}
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Text style={styles.placeholderIcon}>📦</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.itemMeta}>
                        <View style={styles.ecoTag}>
                          <Text style={styles.ecoTagText}>♻️ ECO</Text>
                        </View>
                      </View>

                      {/* Quantity Controls */}
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            updateQuantity(index, item.quantity - 1)
                          }
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>

                        <View style={styles.quantityDisplay}>
                          <Text style={styles.quantityText}>
                            {item.quantity}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            updateQuantity(index, item.quantity + 1)
                          }
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeItem(index)}
                        >
                          <Text style={styles.removeButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.itemPriceContainer}>
                      <Text style={styles.itemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                      <Text style={styles.itemPriceEach}>
                        ${item.price.toFixed(2)} each
                      </Text>
                    </View>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>

            {/* Points Section */}
            <View style={styles.pointsSection}>
              <View style={styles.pointsHeader}>
                <Text style={styles.pointsIcon}>💚</Text>
                <View style={styles.pointsHeaderText}>
                  <Text style={styles.pointsTitle}>Eco Points Rewards</Text>
                  <Text style={styles.pointsBalance}>
                    You have {points.toLocaleString()} points
                  </Text>
                </View>
              </View>

              {canRedeemPoints ? (
                <>
                  <View style={styles.redeemInfo}>
                    <Text style={styles.redeemText}>
                      Redeem {(pointValue * 100).toLocaleString()} points for $
                      {pointValue.toFixed(2)} off
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      usePoints && styles.toggleButtonActive,
                    ]}
                    onPress={() => setUsePoints((prev) => !prev)}
                  >
                    <View style={styles.toggleContent}>
                      <View
                        style={[
                          styles.toggleIndicator,
                          usePoints && styles.toggleIndicatorActive,
                        ]}
                      >
                        {usePoints && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text
                        style={[
                          styles.toggleText,
                          usePoints && styles.toggleTextActive,
                        ]}
                      >
                        {usePoints
                          ? "Points Applied"
                          : "Use Points for Discount"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noPointsContainer}>
                  <Text style={styles.noPointsText}>
                    Earn 100 more points to unlock discounts
                  </Text>
                </View>
              )}
            </View>

            {/* Order Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Subtotal ({itemCount} items)
                </Text>
                <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
              </View>

              {usePoints && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discountLabel]}>
                    Points Discount
                  </Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -${savings.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ${discountedTotal.toFixed(2)}
                </Text>
              </View>

              {usePoints && (
                <View style={styles.savingsTag}>
                  <Text style={styles.savingsText}>
                    🎉 You're saving ${savings.toFixed(2)}!
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Checkout Button */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.checkoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.checkoutText}>
                Checkout • ${discountedTotal.toFixed(2)}
              </Text>
              <Text style={styles.checkoutIcon}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8faf9",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  backIcon: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "800",
    marginTop: -2, // Optical alignment
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#d1fae5",
  },
  cartIconContainer: {
    position: "relative",
  },
  cartIcon: {
    fontSize: 28,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  emptyCart: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  itemsContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cartItem: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginRight: 16,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  placeholderIcon: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ecoTag: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ecoTagText: {
    fontSize: 11,
    color: "#065f46",
    fontWeight: "600",
  },
  // Quantity Controls
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  quantityDisplay: {
    minWidth: 40,
    height: 32,
    backgroundColor: "#10b981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 14,
  },
  itemPriceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
  },
  itemPriceEach: {
    fontSize: 12,
    color: "#6b7280",
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 8,
  },
  pointsSection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pointsIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  pointsHeaderText: {
    flex: 1,
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 4,
  },
  pointsBalance: {
    fontSize: 14,
    color: "#6b7280",
  },
  redeemInfo: {
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  redeemText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    textAlign: "center",
  },
  toggleButton: {
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  toggleButtonActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleIndicatorActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  toggleText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#065f46",
  },
  noPointsContainer: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 10,
  },
  noPointsText: {
    fontSize: 14,
    color: "#92400e",
    textAlign: "center",
  },
  summarySection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "600",
  },
  discountLabel: {
    color: "#10b981",
  },
  discountValue: {
    color: "#10b981",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065f46",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
  },
  savingsTag: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  savingsText: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  checkoutText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 12,
  },
  checkoutIcon: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
