import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
// import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import SmokingArea from '@/types/smoking-area';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Conditional import for react-native-maps
let MapView: any = null;
let Marker: any = null;
let Region: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Region = Maps.Region;
}

const { width, height } = Dimensions.get('window');

interface LocationLatLong {
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationLatLong | null>(null);
  const [smokingAreas, setSmokingAreas] = useState<SmokingArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<SmokingArea | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    getCurrentLocation();
    fetchSmokingAreas();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location services');
        // Set default location to Taiwan if permission denied
        setLocation({
          latitude: 25.012, // Yonghe District, Taiwan
          longitude: 121.5064,
        });
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      // Set default location to Taiwan if GPS fails
      setLocation({
        latitude: 25.012, // Yonghe District, Taiwan
        longitude: 121.5064,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSmokingAreas = async () => {
    try {
      const { data, error } = await supabase.from('smoking_areas').select('*');

      if (error) {
        console.error('Error fetching smoking areas:', error);
        return;
      }

      setSmokingAreas(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const onMarkerPress = (area: SmokingArea) => {
    if (location) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        area.latitude,
        area.longitude
      );
      setSelectedArea({ ...area, distance });
    } else {
      setSelectedArea(area);
    }
    setModalVisible(true);
  };

  const centerOnLocation = () => {
    if (location && mapRef.current && Platform.OS !== 'web') {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  const setTaiwanLocation = () => {
    const taiwanLocation = {
      latitude: 25.012, // Yonghe District, Taiwan
      longitude: 121.5064,
    };
    setLocation(taiwanLocation);

    if (mapRef.current && Platform.OS !== 'web') {
      mapRef.current.animateToRegion(
        {
          ...taiwanLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.map}>
          <Text style={styles.loadingText}>Map not available on web</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location?.latitude || 25.012, // Yonghe District, Taiwan coordinates
            longitude: location?.longitude || 121.5064,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {smokingAreas.map((area) => (
            <Marker
              key={area.id}
              coordinate={{
                latitude: area.latitude,
                longitude: area.longitude,
              }}
              onPress={() => onMarkerPress(area)}
            >
              <View
                style={[
                  styles.marker,
                  area.is_verified && styles.verifiedMarker,
                ]}
              >
                <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {Platform.OS !== 'web' && (
        <View style={styles.mapButtons}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={centerOnLocation}
          >
            <Ionicons name="location-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.taiwanLocationButton}
            onPress={setTaiwanLocation}
          >
            <Ionicons name="flag-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedArea && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedArea.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.infoSection}>
                <Text style={styles.address}>{selectedArea.address}</Text>
                {selectedArea.distance && (
                  <View style={styles.distanceRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.distance}>
                      {selectedArea.distance.toFixed(1)} km away
                    </Text>
                  </View>
                )}
              </View>

              {selectedArea.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.description}>
                    {selectedArea.description}
                  </Text>
                </View>
              )}

              <View style={styles.facilitiesSection}>
                <Text style={styles.sectionTitle}>Facilities</Text>
                <View style={styles.facilitiesGrid}>
                  {selectedArea.facilities.covered && (
                    <View style={styles.facilityItem}>
                      <Ionicons name="home-outline" size={16} color="#10B981" />
                      <Text style={styles.facilityText}>Covered</Text>
                    </View>
                  )}
                  {selectedArea.facilities.seating && (
                    <View style={styles.facilityItem}>
                      <Ionicons name="car-outline" size={16} color="#10B981" />
                      <Text style={styles.facilityText}>Seating</Text>
                    </View>
                  )}
                  {selectedArea.facilities.ashtray && (
                    <View style={styles.facilityItem}>
                      <Ionicons
                        name="flame-outline"
                        size={16}
                        color="#10B981"
                      />
                      <Text style={styles.facilityText}>Ashtray</Text>
                    </View>
                  )}
                </View>
              </View>

              {!selectedArea.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.verifiedText}>Verified Location</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  marker: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  verifiedMarker: {
    backgroundColor: '#10B981',
  },
  locationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  taiwanLocationButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 8,
  },
  mapButtons: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  address: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  facilitiesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  facilityText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 6,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  verifiedText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 6,
    fontWeight: '500',
  },
});
