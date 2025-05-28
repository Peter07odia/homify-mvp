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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ProfileOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  action: () => void;
}

const ProfileScreen = () => {
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
        console.log('Sign Out');
        break;
    }
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
      subtitle: 'Get updates about your projects',
      icon: 'notifications',
      type: 'toggle',
      value: notificationsEnabled,
      action: () => setNotificationsEnabled(!notificationsEnabled),
    },
    {
      id: 'auto-sync',
      title: 'Auto Sync',
      subtitle: 'Automatically sync your projects',
      icon: 'sync',
      type: 'toggle',
      value: autoSyncEnabled,
      action: () => setAutoSyncEnabled(!autoSyncEnabled),
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      subtitle: 'Control your data and privacy',
      icon: 'privacy-tip',
      type: 'navigation',
      action: () => handleOptionPress('privacy'),
    },
  ];

  const supportOptions: ProfileOption[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help with the app',
      icon: 'help-outline',
      type: 'navigation',
      action: () => handleOptionPress('help'),
    },
    {
      id: 'about',
      title: 'About Homify',
      subtitle: 'Version 1.0.0',
      icon: 'info-outline',
      type: 'navigation',
      action: () => handleOptionPress('about'),
    },
  ];

  const renderOption = (option: ProfileOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.optionItem}
      onPress={option.action}
      activeOpacity={0.7}
    >
      <View style={styles.optionIcon}>
        <MaterialIcons name={option.icon as any} size={24} color="#7C5C3E" />
      </View>
      
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        {option.subtitle && (
          <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
        )}
      </View>
      
      {option.type === 'toggle' ? (
        <Switch
          value={option.value}
          onValueChange={option.action}
          trackColor={{ false: '#E0E0E0', true: '#7C5C3E' }}
          thumbColor={option.value ? '#FFFFFF' : '#FFFFFF'}
        />
      ) : (
        <MaterialIcons name="chevron-right" size={24} color="#CCBBAA" />
      )}
    </TouchableOpacity>
  );

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
              source={{ uri: 'https://via.placeholder.com/100x100/7C5C3E/FFFFFF?text=JD' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userEmail}>john.doe@example.com</Text>
            
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
          <Text style={styles.buildText}>Build 2024.1.1</Text>
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
    paddingBottom: 120,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
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
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 20,
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