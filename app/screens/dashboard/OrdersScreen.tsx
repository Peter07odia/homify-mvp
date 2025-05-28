import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface OrderFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
  badge?: string;
  action: () => void;
}

interface Order {
  id: string;
  orderNumber: string;
  items: number;
  total: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  estimatedDelivery?: string;
}

const OrdersScreen = () => {
  const handleFeaturePress = (feature: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    switch (feature) {
      case 'find-items':
        console.log('Navigate to Find Items');
        break;
      case 'source-products':
        console.log('Navigate to Source Products');
        break;
      case 'track-orders':
        console.log('Navigate to Track Orders');
        break;
    }
  };

  const orderFeatures: OrderFeature[] = [
    {
      id: 'find-items',
      title: 'Find Items',
      description: 'Discover furniture and decor from your styled rooms',
      icon: 'search',
      gradient: ['#E3F2FD', '#BBDEFB'],
      action: () => handleFeaturePress('find-items'),
    },
    {
      id: 'source-products',
      title: 'Source Products',
      description: 'Compare prices and find the best deals',
      icon: 'shopping-cart',
      gradient: ['#E8F5E8', '#C8E6C9'],
      badge: '3',
      action: () => handleFeaturePress('source-products'),
    },
    {
      id: 'track-orders',
      title: 'Track Orders',
      description: 'Monitor your deliveries and order status',
      icon: 'local-shipping',
      gradient: ['#FFF3E0', '#FFE0B2'],
      action: () => handleFeaturePress('track-orders'),
    },
  ];

  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      items: 3,
      total: '$1,247.99',
      status: 'shipped',
      date: '2 days ago',
      estimatedDelivery: 'Tomorrow',
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      items: 1,
      total: '$89.99',
      status: 'processing',
      date: '1 week ago',
      estimatedDelivery: '3-5 days',
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      items: 5,
      total: '$2,156.50',
      status: 'delivered',
      date: '2 weeks ago',
    },
  ];

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return '#FF9800';
      case 'shipped':
        return '#2196F3';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return 'hourglass-empty';
      case 'shipped':
        return 'local-shipping';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSubtitle}>Manage your purchases and deliveries</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>$3.2K</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>In Transit</Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shopping Tools</Text>
        </View>

        <View style={styles.featuresContainer}>
          {orderFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={feature.action}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={feature.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons
                        name={feature.icon as any}
                        size={28}
                        color="#7C5C3E"
                      />
                    </View>
                    {feature.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{feature.badge}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDescription}>{feature.description}</Text>
                  
                  <View style={styles.cardAction}>
                    <MaterialIcons name="arrow-forward" size={20} color="#7C5C3E" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersList}>
          {mockOrders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                
                <View style={[styles.statusContainer, { backgroundColor: getStatusColor(order.status) }]}>
                  <MaterialIcons 
                    name={getStatusIcon(order.status) as any} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderItems}>{order.items} items</Text>
                  <Text style={styles.orderTotal}>{order.total}</Text>
                </View>
                
                {order.estimatedDelivery && (
                  <Text style={styles.deliveryInfo}>
                    Estimated delivery: {order.estimatedDelivery}
                  </Text>
                )}
              </View>
              
              <MaterialIcons name="chevron-right" size={24} color="#CCBBAA" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State for when no orders */}
        {mockOrders.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="shopping-bag" size={64} color="#CCBBAA" />
            <Text style={styles.emptyStateTitle}>No orders yet</Text>
            <Text style={styles.emptyStateText}>
              Start shopping from your styled rooms to see orders here
            </Text>
            <TouchableOpacity style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickAction}>
            <MaterialIcons name="help-outline" size={24} color="#7C5C3E" />
            <Text style={styles.quickActionText}>Order Help</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <MaterialIcons name="assignment-return" size={24} color="#7C5C3E" />
            <Text style={styles.quickActionText}>Returns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <MaterialIcons name="receipt" size={24} color="#7C5C3E" />
            <Text style={styles.quickActionText}>Invoices</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  featuresContainer: {
    paddingHorizontal: 20,
  },
  featureCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardAction: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersList: {
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#999999',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: 8,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 14,
    color: '#666666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C5C3E',
  },
  deliveryInfo: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#7C5C3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 32,
  },
  quickAction: {
    alignItems: 'center',
    padding: 16,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C5C3E',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default OrdersScreen; 