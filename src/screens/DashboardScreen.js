import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { LineChart } from 'react-native-chart-kit';
import { AlertContext } from '../context/AlertContext';

const DashboardScreen = ({ navigation }) => {
  const [dataPts, setDataPts] = useState(Array(15).fill(0)); 
  const [isVibrating, setIsVibrating] = useState(0);
  const [loading, setLoading] = useState(true);
  const lastChartUpdate = useRef(0);
  const { triggerAlert, alertTriggered } = useContext(AlertContext);

  useEffect(() => {
    // Listen to seismic_data node on Firebase Realtime DB
    const seismicRef = ref(db, '/seismic_data');
    const unsubscribe = onValue(seismicRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null && data !== undefined) {
        if (loading) setLoading(false);
        
        // Ensure strictly 0 or 1
        const currentVibrationState = (data === 1 || data.isVibrating === 1) ? 1 : 0;
        setIsVibrating(currentVibrationState);
        
        // Throttle chart updates to once every 300ms to save CPU
        const now = Date.now();
        if (now - lastChartUpdate.current >= 300) {
          lastChartUpdate.current = now;
          setDataPts(prev => {
            const newData = [...prev.slice(1), currentVibrationState];
            return newData;
          });
        }

        // Instant background threshold check regardless of chart throttle
        if (currentVibrationState === 1 && !alertTriggered) {
          triggerAlert();
        }
      }
    });

    return () => unsubscribe();
  }, [alertTriggered, loading]);

  const screenWidth = Dimensions.get('window').width - 40;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAlign]}>
        <ActivityIndicator size="large" color="#00ffa4" />
        <Text style={styles.loadingText}>Connecting to Sensor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SEISMIC MONITOR</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.neonTextBtn}>[ SETTINGS ]</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>REAL-TIME HARDWARE PULSE LOG</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: [], 
            datasets: [{ data: dataPts }]
          }}
          width={screenWidth}
          height={220}
          withDots={false}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLabels={false}
          withHorizontalLabels={true}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#0a0a0a',
            backgroundGradientFrom: '#111',
            backgroundGradientTo: '#111',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 255, 170, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
            style: { borderRadius: 10 },
            propsForDots: { r: '0' },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <Text style={styles.sectionLabel}>SW-420 DIGITAL SENSOR STATUS</Text>
      <View style={styles.cardContainer}>
        <View style={[styles.statusCard, isVibrating === 1 ? styles.statusAlert : styles.statusSafe]}>
          <Text style={styles.statusLabel}>CURRENT STATE</Text>
          <Text style={[styles.statusValue, isVibrating === 1 ? styles.textAlert : styles.textSafe]}>
            {isVibrating === 1 ? 'VIBRATION DETECTED!' : 'STABLE (NO MOVEMENT)'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
  },
  centerAlign: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00ffa4',
    marginTop: 20,
    fontSize: 16,
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    color: '#00ffa4',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  neonTextBtn: {
    color: '#00ffa4',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 10,
  },
  chartContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statusCard: {
    padding: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
  },
  statusSafe: {
    backgroundColor: '#0a1a0f',
    borderColor: '#00ffa4',
  },
  statusAlert: {
    backgroundColor: '#1a0a0a',
    borderColor: '#ff4444',
  },
  statusLabel: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  textSafe: {
    color: '#00ffa4',
  },
  textAlert: {
    color: '#ff4444',
  }
});

export default DashboardScreen;