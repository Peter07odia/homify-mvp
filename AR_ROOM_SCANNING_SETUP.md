# AR Room Scanning Setup Guide for Homify

## Overview

This guide explains how to implement AR room scanning functionality in your Homify app. The implementation provides multiple scanning modes and works across both iOS and Android platforms.

## Features Implemented

✅ **AR Room Scanning Screen** - Complete UI with camera integration
✅ **Multiple Scanning Modes** - Manual, Guided, and Auto scanning
✅ **Real-time Progress Tracking** - Visual feedback during scanning
✅ **Device Capability Detection** - Automatic detection of LiDAR, ARKit, ARCore
✅ **Room Dimension Calculation** - Automatic measurement of room dimensions
✅ **Furniture Detection** - Recognition of furniture and objects
✅ **Integration with Existing Flow** - Seamless integration with room creation

## Installation Steps

### 1. Install Dependencies

```bash
npm install react-native-vision-camera@^4.6.4
npm install @react-native-community/geolocation@^3.4.0
```

### 2. iOS Setup (for RoomPlan integration)

For the most advanced AR room scanning on iOS devices with LiDAR, you can integrate Apple's RoomPlan:

```bash
cd ios && pod install
```

Add to `ios/Podfile`:
```ruby
pod 'RoomPlan', '~> 1.0'
```

### 3. Android Setup (for ARCore integration)

Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.ar:core:1.40.0'
}
```

### 4. Permissions Setup

The app.json has been updated with the necessary permissions:

```json
{
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "Allow Homify to access your camera to take photos of your room and perform AR room scanning."
      }
    ],
    [
      "react-native-vision-camera",
      {
        "cameraPermissionText": "Allow Homify to access your camera for AR room scanning and photo capture.",
        "enableMicrophonePermission": false
      }
    ]
  ]
}
```

## Implementation Details

### 1. AR Room Scan Screen (`app/screens/ARRoomScanScreen.tsx`)

Features:
- **Camera Integration**: Uses react-native-vision-camera for high-performance camera access
- **Scanning Modes**: 
  - **Guided**: Step-by-step instructions for optimal scanning
  - **Manual**: User-controlled scanning with manual feature marking
  - **Auto**: Automatic detection (best with LiDAR devices)
- **Real-time Feedback**: Progress bars, feature counters, and visual indicators
- **Animated UI**: Smooth animations for scanning indicators and progress

### 2. AR Room Scan Service (`app/services/arRoomScanService.ts`)

Capabilities:
- **Device Detection**: Automatically detects LiDAR, ARKit, ARCore capabilities
- **Room Analysis**: Calculates dimensions, detects furniture, walls, doors, windows
- **Quality Validation**: Ensures scan quality and provides recommendations
- **Multiple Room Types**: Optimized for bedrooms, living rooms, kitchens, etc.

### 3. Navigation Integration

The AR scanning is integrated into your existing navigation flow:
- Accessible from the "Scan Room" option in the room action sheet
- Returns scan data to the room creation screen
- Seamless integration with your existing UI patterns

## Usage Flow

1. **User selects room type** (bedroom, living room, etc.)
2. **Taps "Scan Room"** from the action sheet
3. **Grants camera permissions** if needed
4. **Selects scanning mode** (guided recommended)
5. **Follows on-screen instructions** to scan the room
6. **Reviews scan results** with dimensions and detected features
7. **Scan data is passed back** to room creation for further processing

## Scanning Modes Explained

### Guided Mode (Recommended)
- Provides step-by-step instructions
- Optimal for most users and devices
- Good balance of accuracy and ease of use

### Manual Mode
- User has full control over the scanning process
- Best for experienced users or challenging rooms
- Allows manual marking of features

### Auto Mode
- Leverages device capabilities (LiDAR, ARKit, ARCore)
- Minimal user interaction required
- Best accuracy on supported devices

## Device Compatibility

### iOS Devices
- **iPhone 12 Pro and newer**: Full LiDAR support with Auto mode
- **iPhone 6s and newer**: ARKit support with Guided/Manual modes
- **iPad Pro (2020 and newer)**: Full LiDAR support

### Android Devices
- **ARCore compatible devices**: Guided/Manual modes
- **Most modern Android phones**: Basic scanning capabilities

## Advanced Features (Future Enhancements)

### 1. Apple RoomPlan Integration (iOS)
For the most advanced room scanning on iOS:

```typescript
// Native module for RoomPlan integration
import { NativeModules } from 'react-native';
const { RoomPlanModule } = NativeModules;

// Start RoomPlan scanning session
const startRoomPlanScan = async () => {
  try {
    const result = await RoomPlanModule.startScan();
    return result; // Returns USDZ file with 3D room model
  } catch (error) {
    console.error('RoomPlan error:', error);
  }
};
```

### 2. ARCore Integration (Android)
For enhanced Android scanning:

```typescript
// Native module for ARCore integration
import { NativeModules } from 'react-native';
const { ARCoreModule } = NativeModules;

// Start ARCore scanning session
const startARCoreScan = async () => {
  try {
    const result = await ARCoreModule.startScan();
    return result; // Returns point cloud and mesh data
  } catch (error) {
    console.error('ARCore error:', error);
  }
};
```

### 3. 3D Visualization
Display scanned rooms in 3D:

```typescript
// Using react-native-3d-model-view or similar
import Model3DView from 'react-native-3d-model-view';

const RoomVisualization = ({ scanResult }) => (
  <Model3DView
    source={{ uri: scanResult.meshData.uri }}
    style={{ flex: 1 }}
    autoPlay={true}
    cameraControl={true}
  />
);
```

## Testing

### 1. Simulator Testing
- Basic UI testing can be done in simulators
- Camera functionality requires physical devices

### 2. Device Testing
- Test on various device types (with/without LiDAR)
- Test in different lighting conditions
- Test with different room sizes and layouts

### 3. Performance Testing
- Monitor memory usage during scanning
- Test thermal performance on extended scans
- Validate battery impact

## Troubleshooting

### Common Issues

1. **Camera Permission Denied**
   - Ensure permissions are properly configured in app.json
   - Guide users to enable permissions in device settings

2. **Poor Scan Quality**
   - Improve lighting conditions
   - Scan more slowly
   - Ensure all room areas are covered

3. **Device Compatibility**
   - Gracefully degrade features on older devices
   - Provide alternative scanning methods

### Performance Optimization

1. **Memory Management**
   - Clear camera buffers regularly
   - Optimize image processing
   - Use efficient data structures

2. **Battery Optimization**
   - Reduce camera resolution when possible
   - Optimize processing algorithms
   - Provide battery usage warnings

## Future Roadmap

### Phase 1 (Current)
- ✅ Basic AR scanning interface
- ✅ Multiple scanning modes
- ✅ Room dimension calculation
- ✅ Integration with existing app flow

### Phase 2 (Next)
- 🔄 Native RoomPlan integration (iOS)
- 🔄 Native ARCore integration (Android)
- 🔄 3D room visualization
- 🔄 Scan result export (USDZ, OBJ)

### Phase 3 (Future)
- 📋 AI-powered furniture recognition
- 📋 Automatic room styling suggestions
- 📋 Virtual furniture placement
- 📋 Social sharing of scanned rooms

## Support

For questions or issues with AR room scanning implementation:

1. Check device compatibility
2. Verify permissions are granted
3. Test in good lighting conditions
4. Review console logs for errors
5. Contact development team for advanced troubleshooting

## Resources

- [Apple RoomPlan Documentation](https://developer.apple.com/documentation/roomplan)
- [Google ARCore Documentation](https://developers.google.com/ar)
- [React Native Vision Camera](https://react-native-vision-camera.com/)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)

---

*This implementation provides a solid foundation for AR room scanning in your Homify app. The modular design allows for easy enhancement and platform-specific optimizations as needed.* 