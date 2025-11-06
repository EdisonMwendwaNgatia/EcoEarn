// screens/ActivityScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { auth, db } from "../firebase";
import { ref, onValue, get, set } from "firebase/database";
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavBar from "../components/BottomNavBar";

const { width } = Dimensions.get('window');

export default function ActivityScreen() {
  const [userData, setUserData] = useState({
    points: 0,
    transactions: [],
    checkouts: [],
    totalSpent: 0,
    greenScore: 0,
    bonusAwarded: false,
  });

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Fetch user data
    const userRef = ref(db, `users/${userId}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserData({
          points: data.points || 0,
          transactions: data.transactions || [],
          checkouts: data.checkouts || [],
          totalSpent: data.totalSpent || 0,
          greenScore: data.greenScore || 0,
          bonusAwarded: data.bonusAwarded || false,
        });
      }
    });
  }, [userId]);

  // Calculate insights
  const totalTransactions = userData.transactions.length;
  const totalCheckouts = userData.checkouts.length;
  const pointsEarned = userData.transactions.reduce((sum, t) => sum + (t.pointsEarned || 0), 0);
  const pointsRedeemed = userData.transactions.reduce((sum, t) => sum + (t.pointsRedeemed || 0), 0);

  // Calculate green score (simplified logic)
  const calculateGreenScore = () => {
    let score = 0;
    
    // Base points for activities
    score += totalCheckouts * 10; // Each purchase contributes to green economy
    score += pointsEarned * 0.1; // Points earned through eco-activities
    score += totalTransactions * 5; // Each transaction represents engagement
    
    // Bonus for reaching milestones
    if (totalCheckouts >= 5) score += 50;
    if (totalCheckouts >= 10) score += 100;
    if (pointsEarned >= 1000) score += 100;
    
    return Math.min(score, 1000); // Cap at 1000
  };

  const greenScore = calculateGreenScore();

  // Check if user qualifies for bonus points
  useEffect(() => {
    if (greenScore >= 500 && !userData.bonusAwarded && userId) {
      const awardBonusPoints = async () => {
        try {
          const userRef = ref(db, `users/${userId}`);
          const snapshot = await get(userRef);
          const data = snapshot.val();
          
          const bonusTransaction = {
            type: "Green Score Bonus",
            pointsEarned: 500,
            reason: "Reached 500 Green Score",
            timestamp: new Date().toISOString()
          };

          await set(userRef, {
            ...data,
            points: (data.points || 0) + 500,
            bonusAwarded: true,
            transactions: [...(data.transactions || []), bonusTransaction]
          });

          Alert.alert(
            "🎉 Green Achievement!",
            "You've reached 500 Green Score! You earned 500 bonus points!",
            [{ text: "Awesome!" }]
          );
        } catch (error) {
          console.error("Error awarding bonus:", error);
        }
      };

      awardBonusPoints();
    }
  }, [greenScore, userData.bonusAwarded, userId]);

  // Get level based on green score
  const getLevel = (score) => {
    if (score >= 800) return { name: "Eco Hero", icon: "🌟", color: "#f59e0b" };
    if (score >= 600) return { name: "Green Champion", icon: "🏆", color: "#10b981" };
    if (score >= 400) return { name: "Eco Warrior", icon: "⚡", color: "#059669" };
    if (score >= 200) return { name: "Green Friend", icon: "🌱", color: "#34d399" };
    return { name: "Eco Beginner", icon: "🌿", color: "#6ee7b7" };
  };

  const level = getLevel(greenScore);

  const StatCard = ({ title, value, subtitle, icon, color = "#10b981" }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color, color + "dd"]}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  );

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.fullContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#10b981', '#059669', '#047857']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Your Activity</Text>
            <Text style={styles.headerSubtitle}>Track your eco journey</Text>
          </View>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelIcon}>{level.icon}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelName}>{level.name}</Text>
              <Text style={styles.levelScore}>{greenScore} points</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Green Score Progress */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreTitle}>Green Score Progress</Text>
              <Text style={styles.scoreSubtitle}>Keep growing your impact!</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>
                {Math.round((greenScore / 1000) * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={[
                  styles.progressFill, 
                  { width: `${Math.min((greenScore / 1000) * 100, 100)}%` }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>{greenScore}/1000</Text>
          </View>

          {/* Milestones */}
          <View style={styles.milestones}>
            <View style={[styles.milestone, greenScore >= 200 && styles.milestoneAchieved]}>
              <Text style={styles.milestoneIcon}>🌿</Text>
              <Text style={styles.milestoneText}>200</Text>
            </View>
            <View style={[styles.milestone, greenScore >= 400 && styles.milestoneAchieved]}>
              <Text style={styles.milestoneIcon}>⚡</Text>
              <Text style={styles.milestoneText}>400</Text>
            </View>
            <View style={[styles.milestone, greenScore >= 600 && styles.milestoneAchieved]}>
              <Text style={styles.milestoneIcon}>🏆</Text>
              <Text style={styles.milestoneText}>600</Text>
            </View>
            <View style={[styles.milestone, greenScore >= 800 && styles.milestoneAchieved]}>
              <Text style={styles.milestoneIcon}>🌟</Text>
              <Text style={styles.milestoneText}>800</Text>
            </View>
          </View>

          {greenScore >= 500 && !userData.bonusAwarded && (
            <View style={styles.bonusAlert}>
              <Text style={styles.bonusIcon}>🎉</Text>
              <Text style={styles.bonusText}>Bonus: 500 Points Unlocked!</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Points" 
              value={userData.points.toLocaleString()} 
              subtitle="Current balance"
              icon="💚"
              color="#10b981"
            />
            <StatCard 
              title="Earned" 
              value={pointsEarned.toLocaleString()} 
              subtitle="Total points"
              icon="⬆️"
              color="#059669"
            />
            <StatCard 
              title="Redeemed" 
              value={pointsRedeemed.toLocaleString()} 
              subtitle="Points used"
              icon="⬇️"
              color="#f59e0b"
            />
            <StatCard 
              title="Purchases" 
              value={totalCheckouts} 
              subtitle="Eco items"
              icon="🛍️"
              color="#0ea5e9"
            />
            <StatCard 
              title="Spent" 
              value={`$${userData.totalSpent.toFixed(2)}`} 
              subtitle="Total value"
              icon="💰"
              color="#8b5cf6"
            />
            <StatCard 
              title="Activities" 
              value={totalTransactions} 
              subtitle="All actions"
              icon="📊"
              color="#ec4899"
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsContainer}>
            {userData.transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Start earning points by shopping!</Text>
              </View>
            ) : (
              userData.transactions.slice(0, 8).reverse().map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={[
                    styles.transactionIconContainer,
                    transaction.pointsEarned ? styles.earnedBg : styles.redeemedBg
                  ]}>
                    <Text style={styles.transactionIcon}>
                      {transaction.pointsEarned ? "⬆️" : "⬇️"}
                    </Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>{transaction.type}</Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.transactionPointsContainer}>
                    <Text style={[
                      styles.transactionPoints,
                      transaction.pointsEarned ? styles.positive : styles.negative
                    ]}>
                      {transaction.pointsEarned 
                        ? `+${transaction.pointsEarned}` 
                        : `-${transaction.pointsRedeemed}`}
                    </Text>
                    <Text style={styles.pointsLabel}>points</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Checkouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Purchases</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkoutsContainer}>
            {userData.checkouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyText}>No purchases yet</Text>
                <Text style={styles.emptySubtext}>Start shopping for eco-friendly products!</Text>
              </View>
            ) : (
              userData.checkouts.slice(0, 8).reverse().map((checkout, index) => (
                <View key={index} style={styles.checkoutItem}>
                  <View style={styles.checkoutIconContainer}>
                    <Text style={styles.checkoutIcon}>🛍️</Text>
                  </View>
                  <View style={styles.checkoutDetails}>
                    <Text style={styles.checkoutItems}>
                      {checkout.items?.length || 0} {checkout.items?.length === 1 ? 'item' : 'items'}
                    </Text>
                    <Text style={styles.checkoutDate}>
                      {formatDate(checkout.timestamp)}
                    </Text>
                    {checkout.pointsUsed > 0 && (
                      <View style={styles.pointsUsedTag}>
                        <Text style={styles.pointsUsedText}>
                          💚 {checkout.pointsUsed} points used
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.checkoutTotalContainer}>
                    <Text style={styles.checkoutTotal}>${checkout.total?.toFixed(2)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Environmental Impact */}
        <View style={styles.impactSection}>
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Your Environmental Impact 🌍</Text>
            <View style={styles.impactStats}>
              <View style={styles.impactStat}>
                <Text style={styles.impactIcon}>♻️</Text>
                <Text style={styles.impactValue}>{totalCheckouts * 2}kg</Text>
                <Text style={styles.impactLabel}>Waste Reduced</Text>
              </View>
              <View style={styles.impactStat}>
                <Text style={styles.impactIcon}>🌳</Text>
                <Text style={styles.impactValue}>{Math.floor(totalCheckouts * 0.5)}</Text>
                <Text style={styles.impactLabel}>Trees Saved</Text>
              </View>
              <View style={styles.impactStat}>
                <Text style={styles.impactIcon}>💧</Text>
                <Text style={styles.impactValue}>{totalCheckouts * 100}L</Text>
                <Text style={styles.impactLabel}>Water Saved</Text>
              </View>
            </View>
          </View>
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
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#d1fae5",
  },
  levelBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  levelIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  levelScore: {
    fontSize: 14,
    color: "#d1fae5",
  },
  scoreSection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 4,
  },
  scoreSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  scorePercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#065f46",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "600",
  },
  milestones: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  milestone: {
    alignItems: "center",
    opacity: 0.3,
  },
  milestoneAchieved: {
    opacity: 1,
  },
  milestoneIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  bonusAlert: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bonusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  bonusText: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "600",
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statGradient: {
    padding: 16,
    minHeight: 120,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  transactionsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  earnedBg: {
    backgroundColor: "#d1fae5",
  },
  redeemedBg: {
    backgroundColor: "#fef3c7",
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: "#9ca3af",
  },
  transactionPointsContainer: {
    alignItems: "flex-end",
  },
  transactionPoints: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  positive: {
    color: "#10b981",
  },
  negative: {
    color: "#f59e0b",
  },
  pointsLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  checkoutsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checkoutItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  checkoutIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkoutIcon: {
    fontSize: 20,
  },
  checkoutDetails: {
    flex: 1,
  },
  checkoutItems: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  checkoutDate: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 4,
  },
  pointsUsedTag: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pointsUsedText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  checkoutTotalContainer: {
    alignItems: "flex-end",
  },
  checkoutTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065f46",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  impactSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  impactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 20,
    textAlign: "center",
  },
  impactStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  impactStat: {
    alignItems: "center",
  },
  impactIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  footerSpacer: {
    height: 100,
  },
});