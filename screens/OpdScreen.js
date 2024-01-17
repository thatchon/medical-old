import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
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
import { useSelector } from "react-redux";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

function OpdScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [patientData, setPatientData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [comment, setComment] = useState(''); // สำหรับเก็บความคิดเห็นของอาจารย์
  const [action, setAction] = useState(null); // ตัวแปรสำหรับเก็บว่า user กำลังทำงานอะไร หรือกดปุ่มไหน
  const currentUserUid = useSelector((state) => state.user.uid); // สมมติว่า uid เก็บอยู่ใน userUid ของ state
  const role = useSelector((state) => state.role);

  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [windowHeight, setWindowHeight] = useState(Dimensions.get('window').height);
  const [isLandscape, setIsLandscape] = useState(false);

  const [professionalismScores, setProfessionalismScores] = useState({
    punctual: false,
    appropriatelyDressed: false,
    respectsPatients: false,
    goodListener: false,
    respectsColleagues: false,
    accurateRecordKeeping: false
  });

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
      height: isMobile ? "80%" : "80%", // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
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
      borderRadius: 20,
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
    button: {
      backgroundColor: '#05AB9F',
      borderRadius: 5,
    },
    buttonViewPDF: {
      backgroundColor: "#05AB9F", // สีที่คุณต้องการ
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
      textAlign: "center",
      fontSize: 16
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
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
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
  });

  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม'
  ];

  const formatDateToThai = (date) => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543; // เปลี่ยนจาก ค.ศ. เป็น พ.ศ.
    return `${day} ${thaiMonths[month]} ${year}`;
  };

  const loadPatientData = async () => {
    try {
      const patientCollectionRef = collection(db, "patients");
      const userCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(patientCollectionRef);
      const patients = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        data.id = docSnapshot.id; // กำหนด id ให้กับข้อมูลของผู้ป่วย

        if (data.patientType === "outpatient") {
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
    navigation.navigate("AddOpd");
  };

  const handleCloseModal = () => {
    setConfirmationModalVisible(false);
    setComment(''); // ล้างความคิดเห็น
  };

  const handleApprove = async () => {
    try {
      const patientDocRef = doc(db, "patients", selectedPatient.id);
      await updateDoc(patientDocRef, {
        status: 'approved',
        comment: comment,
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
            backgroundColor: "#05AB9F",
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
          <Text style={{ fontSize: 22, color: "white" }}>เพิ่มข้อมูล</Text>
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
          <Text style={{ fontSize: 22, color: "white" }}>Approve ทั้งหมด (สำหรับอาจารย์)</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderCards = () => {
    return patientData
      .filter(patient => patient.status === 'pending')
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
                    อาจารย์ : {patient.professorName}
                  </Text>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    <FontAwesome name="calendar" size={20} color="black" /> {formatDateToThai(patient.admissionDate.toDate())}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, lineHeight: 30, marginTop: 20 }}>
                    HN : {patient.hn} ({patient.status})
                  </Text>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    นักเรียน : {patient.studentName}
                  </Text>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    <FontAwesome name="calendar" size={20} color="black" /> {formatDateToThai(patient.admissionDate.toDate())}
                  </Text>
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
      {renderApprovedButton()}
      {/* Modal สำหรับยืนยัน Approve/Reject */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmationModalVisible}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView}>

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

            <TextInput
              placeholder="กรุณาใส่ความคิดเห็น"
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
                <Text style={styles.textStyle}>ยืนยัน</Text>
              </Pressable>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonCancel]}
                onPress={handleCloseModal}
              >
                <Text style={styles.textStyle}>ยกเลิก</Text>
              </Pressable>
            </View>
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
            <Text style={styles.modalText}>ยืนยันการอนุมัติ<Text style={{ fontWeight: "bold", fontSize: 20 }}>ทั้งหมด?</Text></Text>

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonApprove]}
                onPress={() => {
                  handleActualApproveAll();
                  setApproveAllModalVisible(false);
                }}
              >
                <Text style={styles.textStyle}>ยืนยัน</Text>
              </Pressable>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonCancel]}
                onPress={() => setApproveAllModalVisible(false)}
              >
                <Text style={styles.textStyle}>ยกเลิก</Text>
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
          <View style={styles.modalView}>
            {selectedPatient && (
              <>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>วันที่รับผู้ป่วย : </Text>
                  {formatDateToThai(selectedPatient.admissionDate.toDate())}
                  {selectedPatient.hours !== '' && selectedPatient.minutes !== '' && (
                    <>
                      <Text style={{ fontWeight: "bold" }}> เวลา </Text>
                      {formatTimeUnit(selectedPatient.hours)}:{formatTimeUnit(selectedPatient.minutes)}
                    </>
                  )}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>อาจารย์ผู้รับผิดชอบ : </Text> {selectedPatient.professorName}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>HN :</Text> {selectedPatient.hn || "ไม่มี"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Main Diagnosis : </Text>
                  {selectedPatient.mainDiagnosis || "ไม่มี"}
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
                <View style={styles.buttonRow}>
                  {selectedPatient.pdfUrl && (
                    <Pressable
                      style={[styles.button, styles.buttonViewPDF]}
                      onPress={() => Linking.openURL(selectedPatient.pdfUrl)}
                    >
                      <Text style={styles.textStyle}>ดูไฟล์ PDF</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.button, styles.buttonClose]}
                    onPress={() => setModalVisible(!modalVisible)}
                  >
                    <Text style={styles.textStyle}>ปิดหน้าต่าง</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <View>
        {renderAddDataButton()}
      </View>
    </View>
  );
}

export default OpdScreen;
