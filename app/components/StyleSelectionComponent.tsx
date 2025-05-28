import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  FlatList,
  ImageBackground,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { RoomStyleImages } from '../assets/room-style';

const { width } = Dimensions.get('window');

// Card dimensions for horizontal layout
const CARD_MARGIN = -30; // Negative margin for overlapping effect
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 1.2; // Increased height
const CARD_VISIBLE_WIDTH = CARD_WIDTH * 0.7; // Width of the visible part of the card

// Enhanced design style options with detailed information
export const DESIGN_STYLES = [
  {
    id: 'contemporary',
    title: 'Contemporary',
    description: 'Current, sleek, sophisticated',
    detailedDescription: 'Current design trends with clean lines and sophisticated aesthetics. Features neutral palettes, quality materials, and timeless appeal.',
    characteristics: ['Clean lines', 'Neutral palettes', 'Quality materials', 'Timeless appeal'],
    imageUrl: RoomStyleImages.Contemporary,
    color: '#F5F5F5',
  },
  {
    id: 'classic',
    title: 'Classic',
    description: 'Timeless, elegant, refined',
    detailedDescription: 'Traditional elegance with refined details and quality craftsmanship. Features rich materials, symmetrical layouts, and enduring style.',
    characteristics: ['Rich materials', 'Symmetrical layouts', 'Quality craftsmanship', 'Enduring style'],
    imageUrl: RoomStyleImages.Classic,
    color: '#F8F6F0',
  },
  {
    id: 'transitional',
    title: 'Transitional',
    description: 'Balanced, versatile, comfortable',
    detailedDescription: 'Perfect blend of traditional and contemporary elements. Features comfortable furnishings, neutral colors, and flexible design.',
    characteristics: ['Balanced design', 'Comfortable furnishings', 'Neutral colors', 'Flexible layouts'],
    imageUrl: RoomStyleImages.Transitional,
    color: '#F7F7F7',
  },
  {
    id: 'mid-century-modern',
    title: 'Mid-Century Modern',
    description: 'Retro, functional, iconic',
    detailedDescription: 'Iconic 1950s-60s design with clean lines and functional beauty. Features bold colors, geometric patterns, and statement furniture.',
    characteristics: ['Clean lines', 'Bold colors', 'Geometric patterns', 'Statement furniture'],
    imageUrl: RoomStyleImages['Mid-Century Modern'],
    color: '#FFF8E1',
  },
  {
    id: 'industrial',
    title: 'Industrial',
    description: 'Raw, edgy, utilitarian',
    detailedDescription: 'Urban aesthetics with exposed materials and bold statements. Features metal accents, raw textures, and loft-inspired design.',
    characteristics: ['Metal accents', 'Raw textures', 'Exposed materials', 'Urban aesthetic'],
    imageUrl: RoomStyleImages.Industrial,
    color: '#E8E8E8',
  },
  {
    id: 'scandinavian',
    title: 'Scandinavian',
    description: 'Light, airy, functional',
    detailedDescription: 'Nordic simplicity with functional beauty and natural materials. Features light woods, cozy textiles, and hygge elements.',
    characteristics: ['Light woods', 'Cozy textiles', 'Natural materials', 'Hygge elements'],
    imageUrl: RoomStyleImages.Scandinavian,
    color: '#F9F9F9',
  },
  {
    id: 'boho',
    title: 'Boho',
    description: 'Eclectic, relaxed, colorful',
    detailedDescription: 'Rich textures, vibrant colors, and global influences. Features layered textiles, vintage pieces, and an eclectic mix of cultures.',
    characteristics: ['Rich textures', 'Vibrant colors', 'Global influences', 'Layered textiles'],
    imageUrl: RoomStyleImages.Boho,
    color: '#FFF0DB',
  },
  {
    id: 'farmhouse',
    title: 'Farmhouse',
    description: 'Rustic, cozy, country',
    detailedDescription: 'Country charm with rustic elements and cozy comfort. Features natural wood, vintage accessories, and warm, welcoming atmosphere.',
    characteristics: ['Natural wood', 'Vintage accessories', 'Cozy comfort', 'Country charm'],
    imageUrl: RoomStyleImages.Farmhouse,
    color: '#FFF8F0',
  },
  {
    id: 'craftsman',
    title: 'Craftsman',
    description: 'Handcrafted, warm, artisanal',
    detailedDescription: 'Arts and crafts movement inspired design with handcrafted details. Features built-in furniture, natural materials, and artisanal touches.',
    characteristics: ['Built-in furniture', 'Natural materials', 'Handcrafted details', 'Artisanal touches'],
    imageUrl: RoomStyleImages.Craftsman,
    color: '#F5F0E8',
  },
  {
    id: 'victorian-elegance',
    title: 'Victorian Elegance',
    description: 'Ornate, luxurious, dramatic',
    detailedDescription: 'Opulent Victorian style with ornate details and rich fabrics. Features elaborate patterns, dark woods, and luxurious textures.',
    characteristics: ['Ornate details', 'Rich fabrics', 'Elaborate patterns', 'Dark woods'],
    imageUrl: RoomStyleImages['Victorian Elegance'],
    color: '#F8F5F8',
  },
  {
    id: 'coastal',
    title: 'Coastal',
    description: 'Breezy, relaxed, nautical',
    detailedDescription: 'Beach-inspired design with light colors and natural textures. Features weathered wood, sea glass colors, and nautical elements.',
    characteristics: ['Light colors', 'Natural textures', 'Weathered wood', 'Nautical elements'],
    imageUrl: RoomStyleImages.Coastal,
    color: '#F0F8FF',
  },
  {
    id: 'tropical',
    title: 'Tropical',
    description: 'Lush, vibrant, paradise',
    detailedDescription: 'Bring paradise indoors with tropical plants and vibrant colors. Features bamboo, rattan, lush greenery, and exotic patterns.',
    characteristics: ['Tropical plants', 'Vibrant colors', 'Bamboo & rattan', 'Exotic patterns'],
    imageUrl: RoomStyleImages.Tropical,
    color: '#E8F5E9',
  },
  {
    id: 'mediterranean',
    title: 'Mediterranean',
    description: 'Warm, coastal, rustic',
    detailedDescription: 'Warm coastal style inspired by the Mediterranean region. Features terracotta tiles, wrought iron, and natural textures.',
    characteristics: ['Terracotta tiles', 'Wrought iron', 'Natural textures', 'Warm colors'],
    imageUrl: RoomStyleImages.Mediterranean,
    color: '#FFF4E6',
  },
  {
    id: 'asian',
    title: 'Asian',
    description: 'Zen, harmonious, balanced',
    detailedDescription: 'Eastern-inspired design emphasizing balance and harmony. Features natural materials, clean lines, and peaceful elements.',
    characteristics: ['Natural materials', 'Clean lines', 'Peaceful elements', 'Balanced design'],
    imageUrl: RoomStyleImages.Asian,
    color: '#F8F8F0',
  },
  {
    id: 'oriental',
    title: 'Oriental',
    description: 'Exotic, elegant, ornate',
    detailedDescription: 'Rich oriental design with intricate patterns and luxurious details. Features silk fabrics, ornate furniture, and exotic accessories.',
    characteristics: ['Intricate patterns', 'Silk fabrics', 'Ornate furniture', 'Exotic accessories'],
    imageUrl: RoomStyleImages.Oriental,
    color: '#FFF0F0',
  },
  {
    id: 'southwestern',
    title: 'Southwestern',
    description: 'Desert, earthy, warm',
    detailedDescription: 'Desert-inspired design with earthy tones and natural materials. Features adobe textures, warm colors, and Native American influences.',
    characteristics: ['Adobe textures', 'Warm colors', 'Natural materials', 'Native influences'],
    imageUrl: RoomStyleImages.Southwestern,
    color: '#FFF5E6',
  },
  {
    id: 'memphis',
    title: 'Memphis',
    description: 'Bold, playful, geometric',
    detailedDescription: '1980s Memphis design movement with bold colors and geometric shapes. Features bright patterns, unusual forms, and playful elements.',
    characteristics: ['Bold colors', 'Geometric shapes', 'Bright patterns', 'Playful elements'],
    imageUrl: RoomStyleImages.Memphis,
    color: '#FFF0F5',
  },
  {
    id: 'retro-1970s',
    title: 'Retro 1970s',
    description: 'Groovy, vibrant, nostalgic',
    detailedDescription: '1970s retro style with bold patterns and earthy colors. Features shag carpets, geometric patterns, and vintage furniture.',
    characteristics: ['Bold patterns', 'Earthy colors', 'Shag textures', 'Vintage furniture'],
    imageUrl: RoomStyleImages['Retro 1970s'],
    color: '#FFF8E1',
  },
  {
    id: '1960s-retro',
    title: '1960s Retro',
    description: 'Mod, psychedelic, revolutionary',
    detailedDescription: '1960s mod style with psychedelic patterns and revolutionary design. Features bright colors, pop art, and space-age furniture.',
    characteristics: ['Psychedelic patterns', 'Bright colors', 'Pop art', 'Space-age furniture'],
    imageUrl: RoomStyleImages['1960s Retro'],
    color: '#F0F0FF',
  },
  {
    id: 'eclectic',
    title: 'Eclectic',
    description: 'Mixed, creative, personal',
    detailedDescription: 'Creative mix of different styles and periods. Features diverse furniture, varied textures, and personal collections that tell a story.',
    characteristics: ['Diverse furniture', 'Varied textures', 'Personal collections', 'Mixed periods'],
    imageUrl: RoomStyleImages.Eclectic,
    color: '#FFF5F5',
  },
  {
    id: 'shabby-chic',
    title: 'Shabby Chic',
    description: 'Vintage, romantic, distressed',
    detailedDescription: 'Romantic vintage style with distressed finishes and soft colors. Features antique furniture, floral patterns, and feminine touches.',
    characteristics: ['Distressed finishes', 'Soft colors', 'Antique furniture', 'Floral patterns'],
    imageUrl: RoomStyleImages['Shabby Chic'],
    color: '#FDF2F8',
  },
  {
    id: 'serene-zen',
    title: 'Serene Zen',
    description: 'Peaceful, minimal, meditative',
    detailedDescription: 'Zen-inspired design focused on tranquility and mindfulness. Features natural materials, minimal furniture, and calming colors.',
    characteristics: ['Natural materials', 'Minimal furniture', 'Calming colors', 'Tranquil atmosphere'],
    imageUrl: RoomStyleImages['Serene Zen'],
    color: '#F8F8FF',
  },
  {
    id: 'wabi-sabi',
    title: 'Wabi-Sabi',
    description: 'Imperfect beauty, natural, authentic',
    detailedDescription: 'Japanese aesthetic celebrating imperfection and impermanence. Features weathered materials, natural textures, and understated beauty.',
    characteristics: ['Weathered materials', 'Natural textures', 'Understated beauty', 'Imperfect forms'],
    imageUrl: RoomStyleImages['Wabi-Sabi'],
    color: '#F5F5DC',
  },
  {
    id: 'rustic-log-cabin',
    title: 'Rustic Log Cabin',
    description: 'Natural, cozy, wilderness',
    detailedDescription: 'Mountain cabin style with natural wood and cozy comfort. Features log construction, stone accents, and outdoor-inspired elements.',
    characteristics: ['Log construction', 'Stone accents', 'Natural wood', 'Outdoor elements'],
    imageUrl: RoomStyleImages['Rustic Log Cabin Living Room'],
    color: '#F4E4BC',
  },
];

interface StyleSelectionComponentProps {
  onStyleSelected: (styleId: string) => void;
  onStyleConfirmed?: (styleId: string) => void;
  selectedStyle?: string | null;
  isVisible?: boolean;
  showConfirmButton?: boolean;
}

const StyleSelectionComponent: React.FC<StyleSelectionComponentProps> = ({
  onStyleSelected,
  onStyleConfirmed,
  selectedStyle = null,
  isVisible = true,
  showConfirmButton = false,
}) => {
  // Animation values for floating effect
  const animatedValues = useRef(
    DESIGN_STYLES.map(() => new Animated.Value(0))
  ).current;

  // Animation values for selection scaling
  const scaleValues = useRef(
    DESIGN_STYLES.map(() => new Animated.Value(1))
  ).current;

  // Animation values for card flip
  const flipValues = useRef(
    DESIGN_STYLES.map(() => new Animated.Value(0))
  ).current;

  // Track which cards are flipped
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  // Start floating animations when component mounts
  useEffect(() => {
    const animations = animatedValues.map((animValue, index) => {
      // Stagger the start of animations
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200), // Stagger delay
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000 + (index * 100), // Varied duration
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000 + (index * 100),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start all animations
    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [animatedValues]);

  // Handle style selection with flip animation
  const handleSelectStyle = (styleId: string) => {
    Haptics.selectionAsync();
    
    const styleIndex = DESIGN_STYLES.findIndex(style => style.id === styleId);
    
    // Scale animation for selection feedback
    scaleValues.forEach((scaleValue, index) => {
      Animated.timing(scaleValue, {
        toValue: index === styleIndex ? 1.05 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    // Flip animation
    if (!flippedCards.has(styleId)) {
      // Flip to back (detailed view)
      Animated.timing(flipValues[styleIndex], {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      
      setFlippedCards(prev => new Set(prev).add(styleId));
    }

    onStyleSelected(styleId);
  };

  // Handle style confirmation
  const handleConfirmStyle = () => {
    if (selectedStyle && onStyleConfirmed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onStyleConfirmed(selectedStyle);
    }
  };

  // Render each style card with flip functionality
  const renderStyleCard = ({ item, index }: { item: typeof DESIGN_STYLES[0]; index: number }) => {
    // Calculate animated translation for floating effect
    const translateY = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10], // Float up and down by 10px
    });

    const isSelected = selectedStyle === item.id;
    const isFlipped = flippedCards.has(item.id);
    
    // Use scale animation for selection effect
    const scaleValue = scaleValues[index];
    
    // Flip animation values
    const flipValue = flipValues[index];
    
    const frontInterpolate = flipValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
    
    const backInterpolate = flipValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          { 
            transform: [
              { translateY },
              { scale: scaleValue },
            ],
            zIndex: isSelected ? 10 : (DESIGN_STYLES.length - index), // Stack cards with selected on top
          },
          isSelected && styles.selectedCardContainer,
        ]}
      >
        {/* Front of card */}
        <Animated.View
          style={[
            styles.cardFace,
            { transform: [{ rotateY: frontInterpolate }] },
            { opacity: isFlipped ? 0 : 1 },
          ]}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelectStyle(item.id)}
            activeOpacity={0.9}
          >
            <ImageBackground 
              source={item.imageUrl} 
              style={styles.cardImage}
              imageStyle={{ opacity: 0.85 }}
            >
              <View style={styles.imageOverlay} />
              
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <View style={styles.checkmark} />
                </View>
              )}
            </ImageBackground>
          </TouchableOpacity>
        </Animated.View>

        {/* Back of card */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            { transform: [{ rotateY: backInterpolate }] },
            { opacity: isFlipped ? 1 : 0 },
          ]}
        >
          <TouchableOpacity
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => handleSelectStyle(item.id)}
            activeOpacity={0.9}
          >
            <View style={styles.cardBackContent}>
              <Text style={styles.cardBackTitle}>{item.title}</Text>
              <Text style={styles.cardBackDescription}>{item.detailedDescription}</Text>
              
              <View style={styles.characteristicsContainer}>
                <Text style={styles.characteristicsTitle}>Key Features:</Text>
                {item.characteristics.map((characteristic, idx) => (
                  <Text key={idx} style={styles.characteristicItem}>
                    • {characteristic}
                  </Text>
                ))}
              </View>
            </View>
            
            {isSelected && (
              <View style={[styles.selectedIndicator, { backgroundColor: '#4CAF50' }]}>
                <View style={styles.checkmark} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>While you are waiting, what type of designs did you have in mind?</Text>
      <FlatList
        data={DESIGN_STYLES}
        renderItem={renderStyleCard}
        keyExtractor={(item) => item.id}
        horizontal
        contentContainerStyle={styles.carouselContainer}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        snapToAlignment="center"
        decelerationRate="fast"
      />
      
      {/* Confirmation button */}
      {showConfirmButton && selectedStyle && (
        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmStyle}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm Style</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7C5C3E',
    marginBottom: 24,
    textAlign: 'center',
  },
  carouselContainer: {
    paddingHorizontal: width * 0.1,
    paddingVertical: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  selectedCardContainer: {
    elevation: 12,
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    justifyContent: 'flex-end',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
  },
  cardContent: {
    padding: 22,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardBackContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  cardBackTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#7C5C3E',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardBackDescription: {
    fontSize: 14,
    color: '#7C5C3E',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  characteristicsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  characteristicsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C5C3E',
    marginBottom: 8,
  },
  characteristicItem: {
    fontSize: 14,
    color: '#7C5C3E',
    marginBottom: 4,
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C5C3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 14,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
  },
  confirmButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  confirmButton: {
    backgroundColor: '#7C5C3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default StyleSelectionComponent; 