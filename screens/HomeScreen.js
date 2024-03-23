import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../redux/action';
import { db } from '../data/firebaseDB'
import { getDocs, collection, query, where } from "firebase/firestore";
import { Pie } from "react-chartjs-2";
import {Chart, ArcElement, Tooltip, Legend} from 'chart.js'
Chart.register(ArcElement, Tooltip, Legend);
import SubHeader from '../component/SubHeader';  


const HomeScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user);
  const role = useSelector((state) => state.role);
  const dispatch = useDispatch();

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [caseData, setCaseData] = useState([]);
  
  useEffect(() => {
    const onChange = ({ window }) => {
      setDimensions(window);
    };

    Dimensions.addEventListener('change', onChange);
    return () => Dimensions.removeEventListener('change', onChange);
  }, []);

  // ปรับขนาดตัวอักษรตามขนาดหน้าจอ
  const textSize = dimensions.width < 768 ? 20 : 24;
  const buttonTextSize = dimensions.width < 768 ? 20 : 24;

  const handleLogout = () => {
    dispatch(clearUser());
    navigation.navigate('SelectRole');
  };

  useEffect(() => {
    // ดึงข้อมูลจาก Firebase และตั้งค่าข้อมูลสำหรับ Pie Chart
    fetchDataForPieChart();
  }, []);

  const fetchDataForPieChart = async () => {
    try {
      // ใช้ Firebase SDK เพื่อดึงข้อมูลจาก Firebase
      // สามารถใช้ Firebase Firestore, Realtime Database, หรือ Cloud Functions ตามที่ต้องการ
      // นี่คือตัวอย่างเพียงแค่เริ่มต้น โปรดแก้ไขตามโครงสร้างของฐานข้อมูลของคุณ
      const patientsRef = collection(db, 'patients');
  
      // Query ข้อมูลเฉพาะที่มี status เป็น 'Approved'
      const approvedQuerySnapshot = await getDocs(query(patientsRef, where('status', '==', 'approved')));
  
      // Query ข้อมูลเฉพาะที่มี status เป็น 'Rejected'
      const rejectedQuerySnapshot = await getDocs(query(patientsRef, where('status', '==', 'rejected')));
  
      // Query ข้อมูลเฉพาะที่มี status เป็น 'Pending'
      const pendingQuerySnapshot = await getDocs(query(patientsRef, where('status', '==', 'pending')));
  
      // นับจำนวนเคสแต่ละสถานะ
      let approvedCases = approvedQuerySnapshot.size;
      let rejectedCases = rejectedQuerySnapshot.size;
      let pendingCases = pendingQuerySnapshot.size;
  
      // ตั้งค่าข้อมูลสำหรับ Pie Chart
      const data = {
        labels: ['Approved', 'Rejected', 'Pending'],
        datasets: [
          {
            data: [approvedCases, rejectedCases, pendingCases],
            backgroundColor: ['green', 'red', 'yellow'],
          },
        ],
      };
      console.log('Case Data:', data);
      setCaseData(data);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    }
  };

  const options = {
    maintainAspectRatio: false,
    legend: {
      display: true,
      position: 'right',
      labels: {
        font: {
          size: textSize
        }
      }
    },
    tooltips: {
      enabled: true,
      callbacks: {
        label: function(tooltipItem, data) {
          const label = data.labels[tooltipItem.index];
          const value = data.datasets[0].data[tooltipItem.index];
          return `${label}: ${value}`;
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={{marginTop: 20}}>
        <SubHeader text="Home Page" />
      </View>

        <ScrollView>
          <View style={{ flexDirection: dimensions.width < 768 ? 'column' : 'row', justifyContent: 'space-evenly', marginVertical: 10 }}>
          <Image
              source={
                role === 'student'
                  ? require('../assets/student.png')
                  : role === 'teacher'
                  ? require('../assets/professor.png')
                  : require('../assets/staff.png')
              }
              style={{ width: 150, height: 150, alignSelf: 'center' }}
              resizeMode="contain"
            />
            <View style={{ flexDirection: 'column', justifyContent: 'center', alignContent: 'center', alignSelf: 'center', marginTop: dimensions.width < 768 ? 20 : 0, marginBottom: dimensions.width < 768 ? 20 : 0 }}>
              <Text style={[styles.text, { fontSize: textSize }]}>
                <Text style={{ fontWeight: "bold" }}>Name : </Text> {user.displayName}
              </Text>
              <Text style={[styles.text, { fontSize: textSize }]}>
                <Text style={{ fontWeight: "bold" }}>Role : </Text> {user.role}
              </Text>
              <Text style={[styles.text, { fontSize: textSize }]}>
                <Text style={{ fontWeight: "bold" }}>Department : </Text> [{user.department}]
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={[styles.buttonText, { fontSize: buttonTextSize }]}>Logout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.line} />

          <Text style={[styles.text, { fontSize: textSize, alignSelf: 'center', textAlign: 'center', marginVertical: 25, fontWeight: 'bold' }]}>Report Chart</Text>

          <View style={{ alignItems: 'center', marginTop: 20 }}>
            
          {caseData && caseData.datasets && <Pie data={caseData} options={options} width={500} height={500} />}

          </View>
      </ScrollView>
      </View>
      
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  text: {
    color: 'black',
  },
  line: {
    height: 2,
    width: '100%',
    backgroundColor: '#FE810E',
    marginVertical: 15,
  },
  button: {
    height: 41,
    width: 130,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10
  },
  logoutButton: {
    backgroundColor: 'red',
  },
  bottomBox: {
    marginTop: 20,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    textAlign: 'center'
  }
});

export default HomeScreen;
