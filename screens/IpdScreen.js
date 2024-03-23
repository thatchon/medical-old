import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { db } from '../data/firebaseDB';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  TextInput,
  CheckBox
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { useSelector } from "react-redux";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import SubHeader from '../component/SubHeader';  

function IpdScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [patientData, setPatientData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [comment, setComment] = useState(''); // สำหรับเก็บความคิดเห็นของอาจารย์
  const [action, setAction] = useState(null); // ตัวแปรสำหรับเก็บว่า user กำลังทำงานอะไร หรือกดปุ่มไหน
  const currentUserUid = useSelector((state) => state.user.uid); // สมมติว่า uid เก็บอยู่ใน userUid ของ state
  const role = useSelector((state) => state.role);

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [windowHeight, setWindowHeight] = useState(Dimensions.get('window').height);
  const [isLandscape, setIsLandscape] = useState(false);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const [selectedStatus, setSelectedStatus] = useState('pending');
  const statusOptions = [
    { key: 'pending', value: 'Pending' },
    { key: 'approved', value: 'Approved' },
    { key: 'rejected', value: 'Rejected' },
  ];

  const [professionalismScoresModalVisible, setProfessionalismScoresModalVisible] = useState(false);

  const [professionalismScores, setProfessionalismScores] = useState({
    punctual: false,
    appropriatelyDressed: false,
    respectsPatients: false,
    goodListener: false,
    respectsColleagues: false,
    accurateRecordKeeping: false
  });

  // ประกาศ State สำหรับการเก็บค่าการให้คะแนน
  const [rating, setRating] = useState('');

  // ฟังก์ชันสำหรับการจัดการการเปลี่ยนแปลงของ CheckBox
  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const updateWindowDimensions = () => {
    setWindowWidth(Dimensions.get('window').width);
    setWindowHeight(Dimensions.get('window').height);
  };

  useEffect(() => {
    updateWindowDimensions();
    Dimensions.addEventListener('change', updateWindowDimensions);

    return () => {
      Dimensions.removeEventListener('change', updateWindowDimensions);
    };
  }, []);

  const isMobile = windowWidth < 768; // ตรวจสอบว่าอุปกรณ์เป็น Mobile หรือไม่
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // ตรวจสอบว่าอุปกรณ์เป็น Tablet หรือไม่
  const isPC = windowWidth >= 1024; // ตรวจสอบว่าอุปกรณ์เป็น PC หรือไม่

  // ฟังก์ชันเพื่อจัดการการเปลี่ยนแปลงของ Checkbox
  const handleCheckboxChange = (scoreName) => {
    setProfessionalismScores(prevScores => ({
      ...prevScores,
      [scoreName]: !prevScores[scoreName]
    }));
  };

  const [isApproveAllModalVisible, setApproveAllModalVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      paddingTop: isMobile ? 10 : 20,
      flexDirection: "column",
      alignItems: "center",
    },
    boxCard: {
      height: '60%', // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
      width: isMobile ? "90%" : "90%", // ปรับแต่งความกว้างของ boxCard ตามอุปกรณ์
      marginLeft: isMobile ? "50" : "50",
      marginRight: isMobile ? "50" : "50",
      marginTop: isMobile ? 10 : 50,
    },
    card: {
      width: "95%",
      height: isMobile ? 150 : 150, // ปรับแต่งความสูงของ card ตามอุปกรณ์
      marginVertical: isMobile ? 10 : 20, // ปรับแต่งระยะห่างระหว่าง card ตามอุปกรณ์
      borderRadius: 8,
      backgroundColor: "white",
      alignItems: "left",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 8,
      padding: 35,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: isMobile ? '90%' : (isTablet ? '70%' : '50%'), // Responsive width
      height: isMobile ? 'auto' : 400, // Auto height for mobile
    },
    modalView2: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 8,
      padding: 35,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: isMobile ? '90%' : (isTablet ? '70%' : '50%'), // Responsive width
      height: isMobile ? 'auto' : '70%', // Auto height for mobile
    },
    button: {
      backgroundColor: '#05AB9F',
      borderRadius: 5,
    },
    buttonViewPDF: {
      backgroundColor: "#1C4CA7", // สีที่คุณต้องการ
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      marginRight: 15
    },
    buttonApprove: {
      backgroundColor: 'green',
      marginTop: 10
    },
    buttonCancel: {
      backgroundColor: 'red',
      marginTop: 10
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
    },
    modalText: {
      marginBottom: 15,
      textAlign: "left",
      fontSize: windowWidth < 768 ? 20 : 24,
    },
    centerView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: 'rgba(0, 0, 0, 0.6)'
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 20
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginRight: 20,
      marginBottom: 20
    },
    approveButton: {
      backgroundColor: "green",
      padding: 10,
      borderRadius: 13,
      marginRight: 10
    },
    rejectButton: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 13,
    },
    buttonText: {
      color: "white"
    },
    icon: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      width: 20,
      height: 20,
    },
    leftContainer: {
      flex: 3,
      justifyContent: 'center',
    },
    rightContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    recheckModalButton: {
      flex: 1,
      borderRadius: 13,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginHorizontal: 5  // เพิ่มระยะห่างระหว่างปุ่ม
    },
    buttonLink: {
      backgroundColor: "#2196F3",
      borderRadius: 20,
      padding: 10,
      elevation: 2,
      marginTop: 10
    },
    cardContainer: {
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'center'
    },
    buttonRow: {
      flexDirection: 'column',
      justifyContent: 'left',
      alignItems: 'left',
      width: '100%', // ขนาดของ container ที่มีปุ่ม
    },
    buttonClose: {
      backgroundColor: 'red',
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: 'center',
      marginTop: 10
    },
    professionalismHeader: {
      fontWeight: "bold",
      fontSize: 20,
      marginBottom: 10,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%', // Full width for checkbox row
      justifyContent: 'flex-start', // Align items to left
      marginBottom: 10,
    },
    checkboxLabel: {
      marginLeft: 10,
    },
    deleteButton: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 5,
      margin: 5
    },
    buttonText: {
      color: "white",
      fontSize: 16
    },
    buttonProfessional: {
      backgroundColor: "blue", // สีที่คุณต้องการ
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      marginRight: 15
    }
  });

  const thaiMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const formatDateToThai = (date) => {
    if (!date) return '';
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      const hours = formatTimeUnit(date.getHours());
      const minutes = formatTimeUnit(date.getMinutes());
      return `${day} ${thaiMonths[month]} ${year} | ${hours}:${minutes}`;
  };

  const formatDate2 = (date) => {
    if (!date) return '';
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      return `${day} ${thaiMonths[month]} ${year}`;
  };
  // {formatTimeUnit(selectedPatient.hours)}.{formatTimeUnit(selectedPatient.minutes)}
  const loadPatientData = async () => {
    try {
      const patientCollectionRef = collection(db, "patients");
      const userCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(patientCollectionRef);
      const patients = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        data.id = docSnapshot.id; // กำหนด id ให้กับข้อมูลของผู้ป่วย

        if (data.patientType === "inpatient") {
          let studentName = '';
          let displayData = data;

          if (role === 'teacher' && data.createBy_id) {
            const userDocRef = doc(userCollectionRef, data.createBy_id);
            const userDocSnapshot = await getDoc(userDocRef);
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data();
              studentName = userData.displayName || '';
              displayData = { ...data, studentName };
            }
          }

          if ((role === 'student' && data.createBy_id === currentUserUid) ||
            (role === 'teacher' && data.professorId === currentUserUid)) {
            patients.push(displayData);
          }
        }
      }

      setPatientData(patients);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  };
  useEffect(() => {
    const updateLayout = () => {
      const windowWidth = Dimensions.get('window').width;
      const windowHeight = Dimensions.get('window').height;
      setIsLandscape(windowWidth > windowHeight);
    };

    updateLayout();

    Dimensions.addEventListener('change', updateLayout);

    return () => {
      Dimensions.removeEventListener('change', updateLayout);
    };
  }, []);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPatientData();
    });

    return unsubscribe;
  }, [navigation]);

  const formatTimeUnit = (unit) => unit < 10 ? `0${unit}` : unit.toString();

  const handleCardPress = (patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  const handleAddData = () => {
    navigation.navigate("AddIpd");
  };

  const handleCloseModal = () => {
    setConfirmationModalVisible(false);
    setComment(''); // ล้างความคิดเห็น
    setRating('');
    setProfessionalismScores({
      punctual: false,
      appropriatelyDressed: false,
      respectsPatients: false,
      goodListener: false,
      respectsColleagues: false,
      accurateRecordKeeping: false
    });
  };

  const handleApprove = async () => {
    try {
      const patientDocRef = doc(db, "patients", selectedPatient.id);
      await updateDoc(patientDocRef, {
        status: 'approved',
        comment: comment,
        rating: rating,
        approvalTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores // บันทึกคะแนนความเป็นมืออาชีพ
      });
      // รีเซ็ตคะแนนและความคิดเห็น
      resetScoresAndComment();
      setConfirmationModalVisible(false);
      loadPatientData();
    } catch (error) {
      console.error("Error approving patient:", error);
    }
  };

  const handleReject = async () => {
    try {
      const patientDocRef = doc(db, "patients", selectedPatient.id);
      await updateDoc(patientDocRef, {
        status: 'rejected',
        comment: comment,
        rating: rating,
        rejectionTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores
      });
      resetScoresAndComment();
      setConfirmationModalVisible(false);
      loadPatientData();
    } catch (error) {
      console.error("Error rejecting patient:", error);
    }
  };

  const resetScoresAndComment = () => {
    setComment('');
    setRating('');
    setProfessionalismScores({
      punctual: false,
      appropriatelyDressed: false,
      respectsPatients: false,
      goodListener: false,
      respectsColleagues: false,
      accurateRecordKeeping: false
    });
  };

  const renderAddDataButton = () => {
    if (role == 'student') {
      return (
        <TouchableOpacity
          onPress={handleAddData}
          style={{
            height: 37,
            width: 174,
            marginTop: isLandscape ? 25 : 50,
            // marginRight: isLandscape ? 60 : 50,
            marginBottom: isLandscape ? 25 : 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FE810E",
            borderRadius: 10,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 22, color: "white" }}>Add</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const handleActualApproveAll = async () => {
    try {
      // ประมวลผลทั้งหมดที่มีสถานะเป็น pending
      const updates = patientData
        .filter((patient) => patient.status === 'pending')
        .map((patient) => updateDoc(doc(db, 'patients', patient.id), { status: 'approved' }));

      // รอให้ทั้งหมดเสร็จสิ้น
      await Promise.all(updates);

      // โหลดข้อมูลใหม่
      loadPatientData();
    } catch (error) {
      console.error("Error approving all patients:", error);
    }
  };

  const handleApproveAll = () => {
    setApproveAllModalVisible(true);
  };

  const renderApprovedButton = () => {
    if (role == 'teacher') {
      return (
        <TouchableOpacity
          onPress={handleApproveAll}
          style={{
            height: 52,
            width: 373,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1C4CA7",
            borderRadius: 59,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 22, color: "white" }}>Approve all (for professor)</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const handleDelete = async (patientId) => {
    try {
      const patientDocRef = doc(db, "patients", patientId);
      await deleteDoc(patientDocRef);
      loadPatientData(); // โหลดข้อมูลผู้ป่วยใหม่หลังจากลบ
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  const renderCards = () => {
    return patientData
    .filter(patient => patient.status === selectedStatus)
    .sort((a, b) => b.admissionDate.toDate() - a.admissionDate.toDate()) // เรียงลำดับตามวันที่ล่าสุดไปยังเก่าสุด
    .map((patient, index) => (
        <TouchableOpacity
          style={styles.cardContainer}
          key={index}
          onPress={() => handleCardPress(patient)}
        >
          <View style={styles.card}>
            <View style={styles.leftContainer}>
            {role === 'student' ? (
                <>
                  <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, lineHeight: 30 }}>
                    HN : {patient.hn} ({patient.status})
                  </Text>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    Professor Name : {patient.professorName}
                  </Text>
                  {patient.status === 'pending' ? (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" /> {formatDate2(patient.admissionDate.toDate())} | {formatTimeUnit(patient.hours)}.{formatTimeUnit(patient.minutes)}
                    </Text>
                  ) : (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" />
                      {" "} {formatDate2(patient.admissionDate.toDate())} | {formatTimeUnit(patient.hours)}.{formatTimeUnit(patient.minutes)}
                      {patient.approvalTimestamp && (
                        <Text> (Approved: {formatDateToThai(patient.approvalTimestamp.toDate())})</Text>
                      )}
                      {patient.rejectionTimestamp && (
                        <Text> (Rejected: {formatDateToThai(patient.rejectionTimestamp.toDate())})</Text>
                      )}
                    </Text>
                  )}

                  {selectedStatus !== 'approved' && selectedStatus !== 'rejected' && (
                  <>
                    <TouchableOpacity 
                      style={{ position: 'absolute', top: 10, right: 10 }}
                      onPress={() => {
                        navigation.navigate('EditIpd', { patientData: patient });
                      }}
                    >
                      <FontAwesome name="edit" size={24} color="gray" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ position: 'absolute', bottom: 10, right: 10 }}
                      onPress={() => {
                        setPatientToDelete(patient.id);
                        setDeleteConfirmationVisible(true);
                      }}
                    >
                      <MaterialIcons name="delete" size={24} color="red" />
                    </TouchableOpacity>
                  </>
                )}
              </>
              ) : (
                <>
                  <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, lineHeight: 30, marginTop: 20 }}>
                    HN : {patient.hn} ({patient.status})
                  </Text>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    Student Name : {patient.studentName}
                  </Text>
                  {patient.status === 'pending' ? (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" /> {formatDate2(patient.admissionDate.toDate())} | {formatTimeUnit(patient.hours)}.{formatTimeUnit(patient.minutes)}
                    </Text>
                  ) : (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" />
                      {" "} {formatDate2(patient.admissionDate.toDate())} | {formatTimeUnit(patient.hours)}.{formatTimeUnit(patient.minutes)}
                      {patient.approvalTimestamp && (
                        <Text> (Approved: {formatDateToThai(patient.approvalTimestamp.toDate())})</Text>
                      )}
                      {patient.rejectionTimestamp && (
                        <Text> (Rejected: {formatDateToThai(patient.rejectionTimestamp.toDate())})</Text>
                      )}
                    </Text>
                  )}
                </>
              )}
            </View>
            {role !== 'student' && (
              <View style={styles.rightContainer}>
                <View style={styles.buttonsContainer}>
                  {patient.status === 'pending' && (
                    <>
                      <TouchableOpacity style={styles.approveButton} onPress={() => {
                        setSelectedPatient(patient);
                        setAction('approve');
                        setConfirmationModalVisible(true);
                      }}>
                        <Text style={styles.buttonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton} onPress={() => {
                        setSelectedPatient(patient);
                        setAction('reject');
                        setConfirmationModalVisible(true);
                      }}>
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 5, right: 5 }}>
              {patient.status === 'approved' && <Ionicons name="checkmark-circle" size={24} color="green" />}
              {patient.status === 'rejected' && <Ionicons name="close-circle" size={24} color="red" />}
            </View>
          </View>
        </TouchableOpacity>
      ));
  };

  return (
      <View style={styles.container}>

        <View style={{marginVertical: windowWidth < 768 ? 20 : 60,}}>
          <SubHeader text="INPATIENT" />
        </View>

        {renderApprovedButton()}

        <View style={{ marginVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
          <SelectList
              data={statusOptions}
              setSelected={setSelectedStatus}
              placeholder="Select status"
              defaultOption={selectedStatus}
              search={false}
              boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10 }}
              dropdownStyles={{ backgroundColor: '#FEF0E6' }}
            />

          <TextInput
            style={{ flex: 1, backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10, padding: 12, marginLeft: 15 }}
            placeholder="Search by hn"
            onChangeText={text => {
              // ทำอะไรกับข้อความที่ผู้ใช้ป้อน
            }}
          />
        
        </View>

        {/* Modal สำหรับยืนยัน Approve/Reject */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={confirmationModalVisible}
        >
          <View style={styles.centerView}>
            <View style={styles.modalView}>
            <ScrollView style={{ width: '100%' }}>
              <Text style={styles.professionalismHeader}>Professionalism</Text>
              {/* แสดง Checkbox และ Label */}
              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={professionalismScores.punctual}
                  onValueChange={() => handleCheckboxChange('punctual')}
                />
                <Text style={styles.checkboxLabel}>ตรงต่อเวลา</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={professionalismScores.appropriatelyDressed}
                  onValueChange={() => handleCheckboxChange('appropriatelyDressed')}
                />
                <Text style={styles.checkboxLabel}>แต่งกายเหมาะสม</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={professionalismScores.respectsPatients}
                  onValueChange={() => handleCheckboxChange('respectsPatients')}
                />
                <Text style={styles.checkboxLabel}>เคารพผู้ป่วย</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={professionalismScores.goodListener}
                  onValueChange={() => handleCheckboxChange('goodListener')}
                />
                <Text style={styles.checkboxLabel}>เป็นผู้ฟังที่ดี</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={professionalismScores.respectsColleagues}
                  onValueChange={() => handleCheckboxChange('respectsColleagues')}
                />
                <Text style={styles.checkboxLabel}>ให้เกียรติเพื่อนร่วมงาน</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={professionalismScores.accurateRecordKeeping}
                  onValueChange={() => handleCheckboxChange('accurateRecordKeeping')}
                />
                <Text style={styles.checkboxLabel}>บันทึกข้อมูลผู้ป่วยอย่างถูกต้อง</Text>
              </View>

              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Rating</Text>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Excellent'}
                        onValueChange={() => handleRatingChange('Excellent')}
                      />
                      <Text style={styles.checkboxLabel}>Excellent</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Good'}
                        onValueChange={() => handleRatingChange('Good')}
                      />
                      <Text style={styles.checkboxLabel}>Good</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Acceptable'}
                        onValueChange={() => handleRatingChange('Acceptable')}
                      />
                      <Text style={styles.checkboxLabel}>Acceptable</Text>
                    </View>
                    
              <TextInput
                placeholder="Please enter a comment."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                style={{ height: 80, width: '100%', borderColor: 'gray', borderWidth: 1, marginBottom: 20, textAlignVertical: 'top' }}
              />
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.recheckModalButton, styles.buttonApprove]}
                  onPress={() => {
                    action === 'approve' ? handleApprove() : handleReject();
                  }}
                >
                  <Text style={styles.textStyle}>Confirm</Text>
                </Pressable>
                <Pressable
                  style={[styles.recheckModalButton, styles.buttonCancel]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </Pressable>
              </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal สำหรับยืนยัน ApproveAll */}
        <Modal
                animationType="fade"
                transparent={true}
                visible={isApproveAllModalVisible}
            >
                <View style={styles.centerView}>
                    <View style={styles.modalView}>
                    <Text style={styles.modalText}>Confirm approval<Text style={{ fontWeight: "bold", fontSize: 20 }}> all?</Text></Text>
                        
                        <View style={styles.buttonContainer}>
                            <Pressable
                                style={[styles.recheckModalButton, styles.buttonApprove]}
                                onPress={() => {
                                  handleActualApproveAll();
                                  setApproveAllModalVisible(false);
                                }}
                            >
                                <Text style={styles.textStyle}>Confirm</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.recheckModalButton, styles.buttonCancel]}
                                onPress={() => setApproveAllModalVisible(false)}
                            >
                                <Text style={styles.textStyle}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

        {/* Modal สำหรับยืนยันการลบ */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={deleteConfirmationVisible}
            onRequestClose={() => setDeleteConfirmationVisible(false)}
          >
            <View style={styles.centerView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Confirm deletion of patient information?</Text>
                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[styles.recheckModalButton, styles.buttonApprove]}
                    onPress={() => {
                      handleDelete(patientToDelete);
                      setDeleteConfirmationVisible(false);
                    }}
                  >
                    <Text style={styles.textStyle}>Confirm</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.recheckModalButton, styles.buttonCancel]}
                    onPress={() => setDeleteConfirmationVisible(false)}
                  >
                    <Text style={styles.textStyle}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

        <View style={styles.boxCard}>
          <ScrollView>
            {renderCards()}
          </ScrollView>
        </View>

        {/*  Modal สำหรับแสดงข้อมูลในการ์ด */}
        {/* สำคัญ */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            Alert.alert("Modal has been closed.");
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centerView}>
            <View style={styles.modalView2}>
              <ScrollView>
              {selectedPatient && (
                <>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Admission Date : </Text>
                    {formatDate2(selectedPatient.admissionDate.toDate())}
                  </Text> 
                    {selectedPatient.hours !== '' && selectedPatient.minutes !== '' && (
                      <>
                      <Text style={styles.modalText}>
                        <Text style={{ fontWeight: "bold" }}>Admission Time : </Text>
                        {formatTimeUnit(selectedPatient.hours)}.{formatTimeUnit(selectedPatient.minutes)}
                      </Text>
                      </>
                    )}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Professor Name : </Text> {selectedPatient.professorName}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>HN :</Text> {selectedPatient.hn || "ไม่มี"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Main Diagnosis : </Text>
                    {selectedPatient.mainDiagnosis || "None"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Co - Morbid Diseases : </Text>
                    {selectedPatient.coMorbid && selectedPatient.coMorbid.length > 0 && selectedPatient.coMorbid.some(diagnosis => diagnosis.value)
                      ? selectedPatient.coMorbid.map(diagnosis => diagnosis.value).join(', ')
                      : "ไม่ระบุ"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Note/Reflection : </Text> {selectedPatient.note || "ไม่มี"}
                  </Text>

                  {(selectedStatus === 'approved' || selectedStatus === 'rejected') && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Rating : </Text>
                      {selectedPatient.rating || "ไม่มี"}
                  </Text>
                  )}

                  {(selectedStatus === 'approved' || selectedStatus === 'rejected') && (
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold"}}>***Comment : </Text>
                    {selectedPatient.comment || "ไม่มี"}
                  </Text>
                  )}

                  <View style={styles.buttonRow}>

                  {(selectedStatus === 'approved' || selectedStatus === 'rejected') && (
                    <Pressable
                      style={[styles.button, styles.buttonProfessional]}
                      onPress={() => setProfessionalismScoresModalVisible(true)}
                    >
                      <Text style={styles.textStyle}>View Professionalism Score</Text>
                    </Pressable>
                  )}

                    {selectedPatient.pdfUrl && (
                      <Pressable
                        style={[styles.button, styles.buttonViewPDF]}
                        onPress={() => Linking.openURL(selectedPatient.pdfUrl)}
                      >
                        <Text style={styles.textStyle}>View Upload File</Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => setModalVisible(!modalVisible)}
                    >
                      <Text style={styles.textStyle}>Close</Text>
                    </Pressable>
                  </View>

                {/* Modal สำหรับแสดงคะแนนความเป็นมืออาชีพ */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={professionalismScoresModalVisible && (selectedPatient.status === 'approved' || selectedPatient.status === 'rejected')}
                    onRequestClose={() => {
                      setProfessionalismScoresModalVisible(!professionalismScoresModalVisible);
                    }}
                  >
                    <View style={styles.centerView}>
                      <View style={styles.modalView}>
                        <Text style={{ fontWeight: "bold", fontSize: 28, marginBottom: 10 }}>คะแนนความเป็นมืออาชีพ</Text>
                          {selectedPatient.professionalismScores && (
                            <>
                              <Text style={styles.modalText}>
                                <Text style={{ fontWeight: "bold", fontSize: 20 }}>ตรงต่อเวลา : </Text>
                                {selectedPatient.professionalismScores.punctual ? '✔️' : '❌'}
                              </Text>
                              <Text style={styles.modalText}>
                                <Text style={{ fontWeight: "bold", fontSize: 20 }}>การแต่งกายเหมาะสม : </Text>
                                {selectedPatient.professionalismScores.appropriatelyDressed ? '✔️' : '❌'}
                              </Text>
                              <Text style={styles.modalText}>
                                <Text style={{ fontWeight: "bold", fontSize: 20 }}>เคารพผู้ป่วย : </Text>
                                {selectedPatient.professionalismScores.respectsPatients ? '✔️' : '❌'}
                              </Text>
                              <Text style={styles.modalText}>
                                <Text style={{ fontWeight: "bold", fontSize: 20 }}>เป็นผู้ฟังที่ดี : </Text>
                                {selectedPatient.professionalismScores.goodListener ? '✔️' : '❌'}
                              </Text>
                              <Text style={styles.modalText}>
                                <Text style={{ fontWeight: "bold", fontSize: 20 }}>ให้เกียรติเพื่อนร่วมงาน : </Text>
                                {selectedPatient.professionalismScores.respectsColleagues ? '✔️' : '❌'}
                              </Text>
                              <Text style={styles.modalText}>
                                <Text style={{ fontWeight: "bold", fontSize: 20 }}>บันทึกข้อมูลผู้ป่วยอย่างถูกต้อง : </Text>
                                {selectedPatient.professionalismScores.accurateRecordKeeping ? '✔️' : '❌'}
                              </Text>
                            </>
                          )}

                        <Pressable
                          style={[styles.button, styles.buttonClose]}
                          onPress={() => setProfessionalismScoresModalVisible(!professionalismScoresModalVisible)}
                        >
                          <Text style={styles.textStyle}>ปิดหน้าต่าง</Text>
                        </Pressable>
                        
                      </View>
                    </View>
                  </Modal>

                </>
              )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        <View style={{flex: 1, justifyContent: 'flex-start', alignSelf: 'flex-start', marginLeft: 50}}>
          {renderAddDataButton()}
        </View>
      </View>
  );
}


export default IpdScreen;
