import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin,
  Camera,
  House,
  Users,
  Star,
  Plus,
  Check,
} from 'lucide-react-native';

export default function AddLocationScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [facilities, setFacilities] = useState({
    covered: false,
    seating: false,
    ashtray: false,
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to add smoking areas'
      );
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const fullAddress = `${addr.street || ''} ${addr.city || ''} ${
          addr.region || ''
        } ${addr.country || ''}`.trim();
        setAddress(fullAddress);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const setTaiwanLocation = async () => {
    setGettingLocation(true);
    try {
      // Set the specific Taiwan address
      const taiwanAddress =
        'No. 2, Lane 96, Section 1, Xiulang Rd, Yonghe District, New Taipei City, Taiwan';
      setAddress(taiwanAddress);

      // Geocode the address to get coordinates
      const geocodeResult = await Location.geocodeAsync(taiwanAddress);

      if (geocodeResult.length > 0) {
        setLocation({
          latitude: geocodeResult[0].latitude,
          longitude: geocodeResult[0].longitude,
        });
      } else {
        // Fallback coordinates for Yonghe District, Taiwan
        setLocation({
          latitude: 25.012,
          longitude: 121.5064,
        });
      }
    } catch (error) {
      console.error('Error setting Taiwan location:', error);
      // Fallback coordinates for Yonghe District, Taiwan
      setLocation({
        latitude: 25.012,
        longitude: 121.5064,
      });
      setAddress(
        'No. 2, Lane 96, Section 1, Xiulang Rd, Yonghe District, New Taipei City, Taiwan'
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to add smoking areas'
      );
      return;
    }

    if (!name.trim() || !address.trim() || !location) {
      Alert.alert(
        'Missing Information',
        'Please fill in all required fields and set location'
      );
      return;
    }

    setLoading(true);

    try {
      // Insert smoking area
      const { data: smokingAreaData, error: insertError } = await supabase
        .from('smoking_areas')
        .insert({
          name: name.trim(),
          address: address.trim(),
          description: description.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
          facilities: facilities,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Upload photo if selected
      if (selectedImage && smokingAreaData) {
        // In a real app, you would upload to Supabase storage
        // For now, we'll just save the local URI
        await supabase.from('smoking_area_photos').insert({
          smoking_area_id: smokingAreaData.id,
          photo_url: selectedImage,
          uploaded_by: user.id,
        });
      }

      Alert.alert('Success', 'Smoking area added successfully!', [
        {
          text: 'OK',
          onPress: resetForm,
        },
      ]);
    } catch (error) {
      console.error('Error adding smoking area:', error);
      Alert.alert('Error', 'Failed to add smoking area. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setDescription('');
    setLocation(null);
    setSelectedImage(null);
    setFacilities({
      covered: false,
      seating: false,
      ashtray: false,
    });
  };

  const toggleFacility = (facility: keyof typeof facilities) => {
    setFacilities((prev) => ({
      ...prev,
      [facility]: !prev[facility],
    }));
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Text style={styles.authTitle}>Authentication Required</Text>
          <Text style={styles.authMessage}>
            Please sign in to your account to add new smoking areas to the map.
          </Text>
          <Text style={styles.authHint}>
            You can sign in from the Profile tab.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add Smoking Area</Text>
        <Text style={styles.subtitle}>
          Help others find great smoking spots!
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Central Park Smoking Area"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.addressContainer}>
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address or use current location"
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <MapPin size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.locationButtonsRow}>
              <TouchableOpacity
                style={styles.taiwanLocationButton}
                onPress={setTaiwanLocation}
                disabled={gettingLocation}
              >
                <Text style={styles.taiwanLocationButtonText}>
                  Set to Taiwan Address
                </Text>
              </TouchableOpacity>
            </View>
            {location && (
              <Text style={styles.locationText}>
                📍 Location set: {location.latitude.toFixed(4)},{' '}
                {location.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the smoking area (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Facilities</Text>
            <View style={styles.facilitiesContainer}>
              <TouchableOpacity
                style={[
                  styles.facilityButton,
                  facilities.covered && styles.facilityButtonActive,
                ]}
                onPress={() => toggleFacility('covered')}
              >
                <House
                  size={20}
                  color={facilities.covered ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.facilityButtonText,
                    facilities.covered && styles.facilityButtonTextActive,
                  ]}
                >
                  Covered
                </Text>
                {facilities.covered && <Check size={16} color="#FFFFFF" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.facilityButton,
                  facilities.seating && styles.facilityButtonActive,
                ]}
                onPress={() => toggleFacility('seating')}
              >
                <Users
                  size={20}
                  color={facilities.seating ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.facilityButtonText,
                    facilities.seating && styles.facilityButtonTextActive,
                  ]}
                >
                  Seating
                </Text>
                {facilities.seating && <Check size={16} color="#FFFFFF" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.facilityButton,
                  facilities.ashtray && styles.facilityButtonActive,
                ]}
                onPress={() => toggleFacility('ashtray')}
              >
                <Star
                  size={20}
                  color={facilities.ashtray ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.facilityButtonText,
                    facilities.ashtray && styles.facilityButtonTextActive,
                  ]}
                >
                  Ashtray
                </Text>
                {facilities.ashtray && <Check size={16} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo (Optional)</Text>
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={takePhoto}
                >
                  <Camera size={20} color="#6B7280" />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={pickImage}
                >
                  <Plus size={20} color="#6B7280" />
                  <Text style={styles.photoButtonText}>
                    Choose from Library
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Smoking Area</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    marginRight: 12,
  },
  locationButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 8,
  },
  locationButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  taiwanLocationButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  taiwanLocationButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  facilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
  },
  facilityButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  facilityButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 6,
  },
  facilityButtonTextActive: {
    color: '#FFFFFF',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
  },
  photoButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  authMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  authHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
