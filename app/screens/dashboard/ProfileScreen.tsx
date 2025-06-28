import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface ProfileOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  type: 'navigation' | 'toggle';
  action?: () => void;
  value?: boolean;
  onToggle?: (value: boolean) => void;
}

const ProfileScreen = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = React.useState(false);

  const handleOptionPress = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (option) {
      case 'edit-profile':
        console.log('Navigate to Edit Profile');
        break;
      case 'subscription':
        console.log('Navigate to Subscription');
        break;
      case 'design-preferences':
        console.log('Navigate to Design Preferences');
        break;
      case 'notifications':
        console.log('Navigate to Notification Settings');
        break;
      case 'privacy':
        console.log('Navigate to Privacy Settings');
        break;
      case 'help':
        console.log('Navigate to Help & Support');
        break;
      case 'about':
        console.log('Navigate to About');
        break;
      case 'sign-out':
        handleSignOut();
        break;
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled by auth state change
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSignIn = () => {
    // @ts-ignore - navigation is properly typed in actual usage
    navigation.navigate('Auth');
  };

  const profileOptions: ProfileOption[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'edit',
      type: 'navigation',
      action: () => handleOptionPress('edit-profile'),
    },
    {
      id: 'subscription',
      title: 'Subscription',
      subtitle: 'Manage your Pro subscription',
      icon: 'workspace-premium',
      type: 'navigation',
      action: () => handleOptionPress('subscription'),
    },
    {
      id: 'design-preferences',
      title: 'Design Preferences',
      subtitle: 'Set your favorite styles and colors',
      icon: 'palette',
      type: 'navigation',
      action: () => handleOptionPress('design-preferences'),
    },
  ];

  const settingsOptions: ProfileOption[] = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      subtitle: 'Get notified about new features',
      icon: 'notifications',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      id: 'auto-sync',
      title: 'Auto Sync',
      subtitle: 'Automatically sync your designs',
      icon: 'sync',
      type: 'toggle',
      value: autoSyncEnabled,
      onToggle: setAutoSyncEnabled,
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      subtitle: 'Manage your data and privacy',
      icon: 'privacy-tip',
      type: 'navigation',
      action: () => handleOptionPress('privacy'),
    },
  ];

  const supportOptions: ProfileOption[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help',
      type: 'navigation',
      action: () => handleOptionPress('help'),
    },
    {
      id: 'about',
      title: 'About Homify',
      subtitle: 'App version and information',
      icon: 'info',
      type: 'navigation',
      action: () => handleOptionPress('about'),
    },
  ];

  const renderOption = (option: ProfileOption) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionItem,
        option.id === supportOptions[supportOptions.length - 1].id && { borderBottomWidth: 0 }
      ]}
      onPress={option.action}
      activeOpacity={0.7}
    >
      <View style={styles.optionIcon}>
        <MaterialIcons name={option.icon as any} size={20} color="#7C5C3E" />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
      </View>
      {option.type === 'toggle' ? (
        <Switch
          value={option.value}
          onValueChange={option.onToggle}
          trackColor={{ false: '#E0E0E0', true: '#7C5C3E' }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <MaterialIcons name="chevron-right" size={20} color="#CCCCCC" />
      )}
    </TouchableOpacity>
  );

  // Show sign-in prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        
        <View style={styles.signInPromptContainer}>
          <View style={styles.signInPromptContent}>
            <MaterialIcons name="account-circle" size={80} color="#E0D5C9" />
            <Text style={styles.signInPromptTitle}>Sign In to Your Account</Text>
            <Text style={styles.signInPromptSubtitle}>
              Access your saved designs, sync across devices, and unlock premium features
            </Text>
            
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <Text style={styles.signInPromptFooter}>
              Don't have an account? Sign up when you tap Sign In
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `https://via.placeholder.com/100x100/7C5C3E/FFFFFF?text=${user?.user_metadata?.full_name?.charAt(0) || 'U'}` }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || 'User'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'user@example.com'}
            </Text>
            
            <View style={styles.proContainer}>
              <View style={styles.proBadge}>
                <MaterialIcons name="workspace-premium" size={16} color="#FFFFFF" />
                <Text style={styles.proText}>PRO</Text>
              </View>
              <Text style={styles.proExpiry}>Expires Dec 2024</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Rooms Designed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Items Purchased</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            {profileOptions.map(renderOption)}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.sectionContent}>
            {settingsOptions.map(renderOption)}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            {supportOptions.map(renderOption)}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => handleOptionPress('sign-out')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={20} color="#FF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Homify v1.0.0</Text>
          <Text style={styles.buildText}>Build 2024.1</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  signInPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  signInPromptContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  signInPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  signInPromptSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#7C5C3E',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signInPromptFooter: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0D5C9',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C5C3E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  proContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C5C3E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  proText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  proExpiry: {
    fontSize: 12,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C5C3E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: '#999999',
  },
});

export default ProfileScreen; 