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
import { SelectList } from "react-native-dropdown-select-list";

const HomeScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user);
  const role = useSelector((state) => state.role);
  const dispatch = useDispatch();

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [caseData, setCaseData] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('all'); // 1. เพิ่ม state สำหรับเก็บชื่อ Collection ที่ถูกเลือก
  
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
  }, [selectedCollection]); // 2. เพิ่ม selectedCollection เป็น dependency ของ useEffect เพื่อให้มันเรียกใช้งานใหม่เมื่อมีการเปลี่ยนแปลง

  const getRoleName = (role) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'teacher':
        return 'Professor';
      case 'staff':
        return 'Staff';
      default:
        return '';
    }
  };
  
  const fetchDataForPieChart = async () => {
    try {
      let collectionRefs = [];
      if (selectedCollection === 'all') {
        collectionRefs = [
          collection(db, 'patients'),
          collection(db, 'activity'),
          collection(db, 'procedures')
        ];
      } else {
        collectionRefs.push(collection(db, selectedCollection));
      }
  
      let approvedCases = 0;
      let rejectedCases = 0;
      let pendingCases = 0;
      let reApprovedCases = 0;
  
      for (const collectionRef of collectionRefs) {
        let userQuerySnapshot;
        if (user.role === 'staff') {
          // หากเป็น staff ให้ดึงเคสทั้งหมดในระบบโดยไม่ต้องอิง createBy_id หรือ professorId
          userQuerySnapshot = await getDocs(collectionRef);
        } else {
          let queryField = 'createBy_id'; // ใช้เงื่อนไขเริ่มต้นสำหรับผู้ใช้ทั่วไป
          
          // ตรวจสอบบทบาทของผู้ใช้
          if (user.role === 'teacher') {
            // หากเป็นอาจารย์ให้ใช้เงื่อนไขอื่นเช่น professorId หรือ approvedById
            queryField = 'professorId' || 'approvedById'; // หรือ 'approvedById' ตามที่ต้องการ
          } 
    
          userQuerySnapshot = await getDocs(query(collectionRef, where(queryField, '==', user.uid)));
        }
  
        userQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'approved') {
            approvedCases++;
          } else if (data.status === 'rejected') {
            rejectedCases++;
          } else if (data.status === 'pending') {
            pendingCases++;
          } else if (data.status === 'reApproved') {
            reApprovedCases++;
          }
        });
      }
  
      const data = {
        labels: ['Approved', 'Rejected', 'Pending', 'Re-approved'],
        datasets: [
          {
            data: [approvedCases, rejectedCases, pendingCases, reApprovedCases],
            backgroundColor: ['#2a9d8f', '#e76f51', '#e9c46a', '#7ecafc'],
          },
        ],
      };
  
      setCaseData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
                <Text style={{ fontWeight: "bold" }}>Role : </Text> {getRoleName(user.role)}
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

          {/* เพิ่ม DropDownList สำหรับการเลือก Collection */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>

            {caseData && caseData.datasets && <Pie data={caseData} options={options} width={500} height={500} />}
          </View>

          <View style={{ marginVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <SelectList
                placeholder='All'
                defaultValue={selectedCollection}
                setSelected={setSelectedCollection} // 4. เมื่อมีการเลือก Collection ใหม่ ให้เรียกใช้ handleSelectCollection เพื่อเปลี่ยนค่า selectedCollection
                data={[
                  { key: 'all', value: 'All' }, // เพิ่มตัวเลือก "All"
                  { key: 'patients', value: 'Patients' },
                  { key: 'activity', value: 'Activity' },
                  { key: 'procedures', value: 'Procedures' },
                ]}
                search={false}
                boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10 }}
                dropdownStyles={{ backgroundColor: '#FEF0E6' }}
              />
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
