import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../redux/action';
import { db } from '../data/firebaseDB';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);
import SubHeader from '../component/SubHeader';
import { SelectList } from 'react-native-dropdown-select-list';

const subjectsByYear = [
  { key: 'All', value: 'All' },
  { key: 'Family medicine clerkship', value: 'Family medicine clerkship' },
  { key: 'Internal medicine clerkship', value: 'Internal medicine clerkship' },
  { key: 'Surgery clerkship', value: 'Surgery clerkship' },
  { key: 'Anesthesiology, cardiology and critical care medicine clerkship', value: 'Anesthesiology, cardiology and critical care medicine clerkship' },
  { key: 'Obstetrics and gynecology clerkship', value: 'Obstetrics and gynecology clerkship' },
  { key: 'Ambulatory medicine clerkship', value: 'Ambulatory medicine clerkship' },
  { key: 'Accident and emergency medicine clerkship', value: 'Accident and emergency medicine clerkship' },
  { key: 'Oncology and palliative medicine clerkship', value: 'Oncology and palliative medicine clerkship' },
  { key: 'Practicum in internal medicine', value: 'Practicum in internal medicine' },
  { key: 'Practicum in surgery', value: 'Practicum in surgery' },
  { key: 'Practicum in Pediatrics', value: 'Practicum in Pediatrics' },
  { key: 'Practicum in Obstetrics and gynecology', value: 'Practicum in Obstetrics and gynecology' },
  { key: 'Practicum in orthopedics and emergency medicine', value: 'Practicum in orthopedics and emergency medicine' }
];

const HomeScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user);
  const role = useSelector((state) => state.role);
  const subject = useSelector((state) => state.subject);
  const dispatch = useDispatch();

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [caseData, setCaseData] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('All'); // เพิ่ม state สำหรับเก็บรายวิชาที่ถูกเลือก

  useEffect(() => {
    const onChange = ({ window }) => {
      setDimensions(window);
    };

    Dimensions.addEventListener('change', onChange);
    return () => Dimensions.removeEventListener('change', onChange);
  }, []);

  const textSize = dimensions.width < 768 ? 20 : 24;
  const buttonTextSize = dimensions.width < 768 ? 20 : 24;

  const handleLogout = () => {
    dispatch(clearUser());
    navigation.navigate('SelectRole');
  };

  useEffect(() => {
    fetchDataForPieChart();
  }, [selectedCollection, selectedSubject]); // เพิ่ม selectedSubject เป็น dependency

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
          userQuerySnapshot = await getDocs(collectionRef);
        } else {
          let queryField = 'createBy_id';

          if (user.role === 'teacher') {
            queryField = 'professorId' || 'approvedById';
          }

          const queries = [where(queryField, '==', user.uid)];
          if (selectedSubject !== 'All') {
            queries.push(where('subject', '==', selectedSubject));
          }

          userQuerySnapshot = await getDocs(query(collectionRef, ...queries));
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
        label: function (tooltipItem, data) {
          const label = data.labels[tooltipItem.index];
          const value = data.datasets[0].data[tooltipItem.index];
          return `${label}: ${value}`;
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ marginTop: 20 }}>
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
            {role !== 'teacher' && role !== 'staff' && (
              <Text style={[styles.text, { fontSize: textSize }]}>
                <Text style={{ fontWeight: "bold" }}>Subject : </Text> [{subject}]
              </Text>
            )}
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

        <View style={{ marginVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <SelectList
            placeholder='Select status'
            defaultValue={selectedCollection}
            setSelected={setSelectedCollection}
            data={[
              { key: 'all', value: 'All' },
              { key: 'patients', value: 'Patients' },
              { key: 'activity', value: 'Activity' },
              { key: 'procedures', value: 'Procedures' },
            ]}
            search={false}
            boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10 }}
            dropdownStyles={{ backgroundColor: '#FEF0E6' }}
          />
        
          <SelectList
            placeholder='Select subjects'
            defaultValue={selectedSubject}
            setSelected={setSelectedSubject} // 4. เมื่อมีการเลือก Subject ใหม่ ให้เรียกใช้ handleSelectSubject เพื่อเปลี่ยนค่า selectedSubject
            data={subjectsByYear}
            search={false}
            boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10, marginLeft: 10 }}
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
