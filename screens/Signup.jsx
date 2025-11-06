import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase";

export default function Signup({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize proper user structure
      await set(ref(db, "users/" + userCred.user.uid), {
        email,
        points: 0,
        totalSpent: 0,
        greenScore: 0,
        bonusAwarded: false,
        transactions: [],
        checkouts: [],
        createdAt: new Date().toISOString()
      });
      
      Alert.alert("Success", "Welcome to EcoEarn! Your eco journey begins now.");
    } catch (error) {
      Alert.alert("Signup failed", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🌱</Text>
        </View>
        <Text style={styles.appName}>EcoEarn</Text>
        <Text style={styles.tagline}>Start earning rewards for sustainable choices</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Create Account</Text>
        <Text style={styles.subtitleText}>Join our community of eco-warriors</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
            style={[
              styles.input,
              focusedInput === 'email' && styles.inputFocused
            ]}
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
            secureTextEntry
            style={[
              styles.input,
              focusedInput === 'password' && styles.inputFocused
            ]}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedInput('confirm')}
            onBlur={() => setFocusedInput(null)}
            secureTextEntry
            style={[
              styles.input,
              focusedInput === 'confirm' && styles.inputFocused
            ]}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>🌟 What you'll get:</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Earn points for eco-friendly purchases</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Track your environmental impact</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Unlock exclusive green rewards</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.loginContainer}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🌍 Be part of the solution, not the pollution</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: "#059669",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    color: "#1f2937",
  },
  inputFocused: {
    borderColor: "#10b981",
    backgroundColor: "#ffffff",
  },
  benefitsContainer: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "bold",
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: "#047857",
    flex: 1,
  },
  signupButton: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9ca3af",
    fontSize: 14,
  },
  loginContainer: {
    alignItems: "center",
  },
  loginText: {
    fontSize: 15,
    color: "#6b7280",
  },
  loginLink: {
    color: "#10b981",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
    textAlign: "center",
  },
});