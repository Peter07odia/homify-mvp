import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Import tab screens (we'll create these next)
import HomeScreen from './HomeScreen';
import RoomsScreen from './RoomsScreen';
import OrdersScreen from './OrdersScreen';
import ProfileScreen from './ProfileScreen';

export type DashboardTabParamList = {
  Home: undefined;
  Rooms: {
    initialTab?: string;
  } | undefined;
  Orders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();

// Custom tab bar component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
            ? options.title 
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Icon mapping
          const getIcon = (routeName: string) => {
            switch (routeName) {
              case 'Home':
                return 'home';
              case 'Rooms':
                return 'meeting-room';
              case 'Orders':
                return 'shopping-bag';
              case 'Profile':
                return 'person';
              default:
                return 'home';
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabIconContainer,
                isFocused && styles.tabIconContainerActive
              ]}>
                <MaterialIcons
                  name={getIcon(route.name) as any}
                  size={24}
                  color={isFocused ? '#FFFFFF' : '#7C5C3E'}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                isFocused && styles.tabLabelActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const DashboardScreen = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Rooms" 
        component={RoomsScreen}
        options={{
          tabBarLabel: 'Rooms',
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: '#FFF9F5',
    paddingBottom: 34, // Safe area padding for iPhone
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabIconContainerActive: {
    backgroundColor: '#7C5C3E',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  tabLabelActive: {
    color: '#7C5C3E',
    fontWeight: 'bold',
  },
});

export default DashboardScreen; 