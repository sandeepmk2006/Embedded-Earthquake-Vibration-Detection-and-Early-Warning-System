import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { getDatabase, ref, onValue, get, child } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function EmergencyMap() {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const db = getDatabase();

  useEffect(() => {
    if (!currentUser) return;

    // Fetch contacts first
    const fetchContactsAndLocations = async () => {
      try {
        const snapshot = await get(child(ref(db), `users/${currentUser.uid}/contacts`));
        if (snapshot.exists()) {
          const contactData = snapshot.val();
          const contactIds = Object.keys(contactData);
          
          let mapData = [];

          // Wait for all users' locations to be queried
          for (const uid of contactIds) {
            const userSnap = await get(child(ref(db), `users/${uid}`));
            if (userSnap.exists()) {
              const userData = userSnap.val();
              if (userData.lastLocation) {
                mapData.push({
                  name: userData.displayName || userData.email,
                  lat: userData.lastLocation.lat,
                  lng: userData.lastLocation.lng,
                  needsHelp: userData.needsHelp || false
                });
              }
            }
          }
          
          generateLeafletHtml(mapData);
        } else {
          setLoading(false);
          Alert.alert('No Contacts found in RTDB');
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    
    fetchContactsAndLocations();

  }, [currentUser]);

  const generateLeafletHtml = (locations) => {
    // Basic leaflet setup with embedded JS/CSS for react-native-webview to render offline easily 
    const markersJs = locations.map(loc => `
      var markerColor = ${loc.needsHelp ? "'red'" : "'blue'"};
      var circle = L.circleMarker([${loc.lat}, ${loc.lng}], {
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.8,
        radius: ${loc.needsHelp ? 12 : 8}
      }).addTo(map);
      
      var popupText = "<b>${loc.name}</b><br>";
      ${loc.needsHelp ? `popupText += "<span style='color: red; font-weight: bold'>NEEDS HELP!</span><br><button onclick='alert(\\"Navigate to ${loc.lat},${loc.lng}\\")' style='margin-top: 10px; padding: 5px; background: red; color: white; border: none; border-radius: 5px'>NAVIGATE</button>";` : `popupText += "Safe";`}
      circle.bindPopup(popupText);
    `).join('\n');

    // Make map center on the first person or defaullt location
    const centerLat = locations.length > 0 ? locations[0].lat : 0;
    const centerLng = locations.length > 0 ? locations[0].lng : 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100vw; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${centerLat}, ${centerLng}], 10);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Render Markers
          ${markersJs}
        </script>
      </body>
      </html>
    `;

    setHtmlContent(html);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {htmlContent ? (
        <WebView 
          originWhitelist={['*']}
          source={{ html: htmlContent }} 
          style={styles.map} 
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
});