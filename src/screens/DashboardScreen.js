import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { LineChart } from 'react-native-chart-kit';
import { AlertContext } from '../context/AlertContext';

const DashboardScreen = ({ navigation }) => {
  const [dataPts, setDataPts] = useState(Array(15).fill(0)); 
  const [xyz, setXyz] = useState({ x: 0, y: 0, z: 0 });
  const [loading, setLoading] = useState(true);
  const lastChartUpdate = useRef(0);
  const { threshold, triggerAlert, alertTriggered } = useContext(AlertContext);

  useEffect(() => {
    // Listen to seismic_data node on Firebase Realtime DB
    const seismicRef = ref(db, '/seismic_data');
    const unsubscribe = onValue(seismicRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (loading) setLoading(false);
        setXyz({ x: data.x, y: data.y, z: data.z });
        
        // Calculate raw magnitude g-force (assume baseline normal is 1g or 0g depending on sensor calibration)
        // Here we take root-mean-square magnitude minus 1g gravity if baseline is 1g, 
        // Or simply raw max component if raw
        const magnitude = Math.sqrt(data.x*data.x + data.y*data.y + data.z*data.z); 
        const rawDelta = Math.abs(magnitude - 1.0); // assuming resting is 1g 
        const delta = parseFloat(rawDelta.toFixed(3));
        
        // Throttle chart updates to once every 300ms to save CPU
        const now = Date.now();
        if (now - lastChartUpdate.current >= 300) {
          lastChartUpdate.current = now;
          // Push new data for chart
          setDataPts(prev => {
            const newData = [...prev.slice(1), delta];
            return newData;
          });
        }

        // Instant background threshold check regardless of chart throttle
        if (delta >= threshold && !alertTriggered) {
          triggerAlert(delta);
        }
      }
    });

    return () => unsubscribe();
  }, [threshold, alertTriggered, loading]);

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

      <Text style={styles.sectionLabel}>REAL-TIME G-FORCE (Δ from 1g)</Text>
      
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
          yAxisSuffix="g"
          chartConfig={{
            backgroundColor: '#0a0a0a',
            backgroundGradientFrom: '#111',
            backgroundGradientTo: '#111',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 255, 170, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
            style: { borderRadius: 10 },
            propsForDots: { r: '0' },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <Text style={styles.sectionLabel}>ADXL345 SENSOR DATA</Text>
      <View style={styles.cardContainer}>
        <View style={styles.axisCard}>
          <Text style={styles.axisLabel}>X-AXIS</Text>
          <Text style={styles.axisValue}>{xyz.x.toFixed(3)}</Text>
        </View>
        <View style={styles.axisCard}>
          <Text style={styles.axisLabel}>Y-AXIS</Text>
          <Text style={styles.axisValue}>{xyz.y.toFixed(3)}</Text>
        </View>
        <View style={styles.axisCard}>
          <Text style={styles.axisLabel}>Z-AXIS</Text>
          <Text style={styles.axisValue}>{xyz.z.toFixed(3)}</Text>
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
  axisCard: {
    backgroundColor: '#151515',
    padding: 15,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    borderLeftWidth: 3,
    borderLeftColor: '#00ffa4',
  },
  axisLabel: {
    color: '#555',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 5,
  },
  axisValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  }
});

export default DashboardScreen;