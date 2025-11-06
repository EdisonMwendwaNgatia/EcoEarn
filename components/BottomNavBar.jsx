// components/BottomNavBar.jsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BottomNavBar() {
  const navigation = useNavigation();
  const route = useRoute();

  const navItems = [
    { name: 'Home', screen: 'Dashboard', icon: '🏠' },
    { name: 'Shop', screen: 'EcommerceScreen', icon: '🛍️' },
    { name: 'Activity', screen: 'ActivityScreen', icon: '📊' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {navItems.map((item, index) => {
          const isActive = route.name === item.screen;
          
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              {/* Active Indicator */}
              {isActive && <View style={styles.activeIndicator} />}
              
              {/* Icon Container with Active State */}
              <View style={[
                styles.iconContainer,
                isActive && styles.activeIconContainer
              ]}>
                <Text style={[
                  styles.icon,
                  isActive && styles.activeIcon
                ]}>
                  {item.icon}
                </Text>
              </View>
              
              {/* Label */}
              <Text style={[
                styles.navText,
                isActive && styles.activeNavText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#d1fae5',
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  navText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 2,
  },
  activeNavText: {
    color: '#10b981',
    fontWeight: '700',
  },
});