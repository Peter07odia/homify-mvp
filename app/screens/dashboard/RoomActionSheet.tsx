import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface RoomActionSheetProps {
  visible: boolean;
  onClose: () => void;
  roomType: string;
  onScanRoom: () => void;
  onStyleWithAI: () => void;
}

const RoomActionSheet: React.FC<RoomActionSheetProps> = ({
  visible,
  onClose,
  roomType,
  onScanRoom,
  onStyleWithAI,
}) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getRoomTypeTitle = (type: string) => {
    const titles: Record<string, string> = {
      bedroom: 'Bedroom',
      'living-room': 'Living Room',
      kitchen: 'Kitchen',
      'dining-room': 'Dining Room',
    };
    return titles[type] || type;
  };

  const handleScanRoom = () => {
    console.log('[RoomActionSheet] Scan room pressed for:', roomType);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onScanRoom();
  };

  const handleStyleWithAI = () => {
    console.log('[RoomActionSheet] Style with AI pressed for:', roomType);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onStyleWithAI();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.actionSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Add {getRoomTypeTitle(roomType)}</Text>
          </View>

          {/* Action Options */}
          <View style={styles.actionsContainer}>
            {/* Scan Room Option */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleScanRoom}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialIcons name="3d-rotation" size={28} color="#2196F3" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Scan Room</Text>
                <Text style={styles.actionDescription}>
                  Use AR to scan and measure your room automatically
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#CCBBAA" />
            </TouchableOpacity>

            {/* Style Room with AI Option */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleStyleWithAI}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                <MaterialIcons name="auto-fix-high" size={28} color="#9C27B0" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Style Room with AI</Text>
                <Text style={styles.actionDescription}>
                  Upload a photo and let AI transform your space
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#CCBBAA" />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
    maxHeight: height * 0.6,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
  },
});

export default RoomActionSheet; 