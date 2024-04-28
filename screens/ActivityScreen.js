import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, Timestamp, deleteDoc } from "firebase/firestore";
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
  Image,
  Linking,
  Dimensions,
  TextInput,
  CheckBox,
  ActivityIndicator
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { useSelector } from "react-redux";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import SubHeader from '../component/SubHeader';  

function ActivityScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comment, setComment] = useState(''); // สำหรับเก็บความคิดเห็นของอาจารย์
  const [action, setAction] = useState(null);
  const currentUserUid = useSelector((state) => state.user.uid);
  const role = useSelector((state) => state.role);
  const [isLoading, setIsLoading] = useState(true);

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

  const [imageModalVisible, setImageModalVisible] = useState(false);

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
      marginTop: isMobile ? 10 : 20,
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
    recheckModalButton: {
      flex: 1,
      borderRadius: 13,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginHorizontal: 5  // เพิ่มระยะห่างระหว่างปุ่ม
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
      marginRight: 5
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
    modalImageView: {
      backgroundColor: "white",
      padding: 20,
      borderRadius: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxWidth: '90%',
      maxHeight: '80%'
    },
    buttonViewImages: {
      backgroundColor: "blue", // สีที่คุณต้องการ
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      marginRight: 15
    },
    buttonClose: {
      backgroundColor: 'red',
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: 'center',
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
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%', // Full width for checkbox row
      justifyContent: 'flex-start', // Align items to left
      marginBottom: 10,
    },
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

  const viewImages = () => {
    setImageModalVisible(true);
  }

  const loadActivityData = async () => {
    try {
      setIsLoading(true);
      const activityCollectionRef = collection(db, "activity");
      const userCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(activityCollectionRef);
      const activities = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        data.id = docSnapshot.id; // กำหนด id ให้กับข้อมูลของผู้ป่วย

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
          activities.push(displayData);
        }
      }

      setActivityData(activities);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching activity data:", error);
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
      loadActivityData();
    });

    return unsubscribe;
  }, [navigation]);

  const formatTimeUnit = (unit) => unit < 10 ? `0${unit}` : unit.toString();

  const handleCardPress = (activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const handleAddData = () => {
    navigation.navigate("AddActivity");
  };

  const handleCloseModal = () => {
    setConfirmationModalVisible(false);
    setComment(''); // ล้างความคิดเห็น
    setRating('');
  };

  const handleApprove = async () => {
    try {
      const activityDocRef = doc(db, "activity", selectedActivity.id);
      await updateDoc(activityDocRef, {
        status: 'approved',
        comment: comment,
        approvalTimestamp: Timestamp.now(),
        rating: rating
      });
      setComment('');
      setRating('');
      setConfirmationModalVisible(false); // ปิด Modal ยืนยัน
      loadActivityData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error approving activity:", error);
    }
  };

  const handleReject = async () => {
    try {
      const activityDocRef = doc(db, "activity", selectedActivity.id);
      await updateDoc(activityDocRef, {
        status: 'rejected',
        comment: comment,
        rejectionTimestamp: Timestamp.now(),
        rating: rating
      });
      setComment('');
      setRating('');
      setConfirmationModalVisible(false); // ปิด Modal ยืนยัน
      loadActivityData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error approving activity:", error);
    }
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
            marginBottom: 10
          }}
        >
          <Text style={{ fontSize: 22, color: "white" }}>Approve all (for professor)</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const handleDelete = async (activityId) => {
    try {
      const activityDocRef = doc(db, "activity", activityId);
      await deleteDoc(activityDocRef);
      loadActivityData(); // โหลดข้อมูลผู้ป่วยใหม่หลังจากลบ
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const handleActualApproveAll = async () => {
    try {
      // ประมวลผลทั้งหมดที่มีสถานะเป็น pending
      const updates = activityData
        .filter((activity) => activity.status === 'pending')
        .map((activity) => updateDoc(doc(db, 'activity', activity.id), { status: 'approved' }));

      // รอให้ทั้งหมดเสร็จสิ้น
      await Promise.all(updates);

      // โหลดข้อมูลใหม่
      loadActivityData();
    } catch (error) {
      console.error("Error approving all activity:", error);
    }
  };

  const handleApproveAll = () => {
    setApproveAllModalVisible(true);
  };

  const renderCards = () => {
    if (isLoading) {
      // แสดง animation loading หรือข้อความแสดงสถานะ loading
      return (
        <ActivityIndicator size="large" color="#0000ff" />
        // หรือแสดงข้อความเพื่อแจ้งให้ผู้ใช้รู้ว่ากำลังโหลดข้อมูล
        // <Text>Loading...</Text>
      );
    }
    return activityData
      .filter(activity => activity.status === selectedStatus) // กรองเฉพาะข้อมูลที่มีสถานะเป็น pending
      .sort((a, b) => b.admissionDate.toDate() - a.admissionDate.toDate()) // เรียงลำดับตามวันที่ล่าสุดไปยังเก่าสุด
      .map((activity, index) => (
        <TouchableOpacity
          style={styles.cardContainer}
          key={index}
          onPress={() => handleCardPress(activity)}
        >
          <View style={styles.card}>
            <View style={styles.leftContainer}>
            {role === 'student' ? (
              <>
                <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, lineHeight: 30 }}>
                  Type : {activity.activityType} ({activity.status})
                </Text>
                <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                  Professor Name : {activity.professorName}
                </Text>

                {activity.status === 'pending' ? (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" /> {formatDate2(activity.admissionDate.toDate())} | {formatTimeUnit(activity.hours)}.{formatTimeUnit(activity.minutes)}
                    </Text>
                  ) : (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" />
                      {" "} {formatDate2(activity.admissionDate.toDate())} | {formatTimeUnit(activity.hours)}.{formatTimeUnit(activity.minutes)}
                      {activity.approvalTimestamp && (
                        <Text> (Approved: {formatDateToThai(activity.approvalTimestamp.toDate())})</Text>
                      )}
                      {activity.rejectionTimestamp && (
                        <Text> (Rejected: {formatDateToThai(activity.rejectionTimestamp.toDate())})</Text>
                      )}
                    </Text>
                  )}

              {selectedStatus !== 'approved' && selectedStatus !== 'rejected' && (
                <>
                  <TouchableOpacity 
                      style={{ position: 'absolute', top: 10, right: 10 }}
                      onPress={() => {
                        navigation.navigate('EditActivity', { activityData: activity });
                      }}
                    >
                      <FontAwesome name="edit" size={24} color="gray" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ position: 'absolute', bottom: 10, right: 10 }}
                      onPress={() => {
                        setActivityToDelete(activity.id);
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
                  Type : {activity.activityType} ({activity.status})
                </Text>
                <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                  Student Name : {activity.studentName}
                </Text>
                {activity.status === 'pending' ? (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" /> {formatDate2(activity.admissionDate.toDate())} | {formatTimeUnit(activity.hours)}.{formatTimeUnit(activity.minutes)}
                    </Text>
                  ) : (
                    <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                      <FontAwesome name="calendar" size={20} color="black" />
                      {" "} {formatDate2(activity.admissionDate.toDate())} | {formatTimeUnit(activity.hours)}.{formatTimeUnit(activity.minutes)}
                      {activity.approvalTimestamp && (
                        <Text> (Approved: {formatDateToThai(activity.approvalTimestamp.toDate())})</Text>
                      )}
                      {activity.rejectionTimestamp && (
                        <Text> (Rejected: {formatDateToThai(activity.rejectionTimestamp.toDate())})</Text>
                      )}
                    </Text>
                  )}
                </>
            )}
            </View>
            {role !== 'student' && (
              <View style={styles.rightContainer}>
                <View style={styles.buttonsContainer}>
                  {activity.status === 'pending' && (
                  <>
                    <TouchableOpacity style={styles.approveButton} onPress={() => {
                      setSelectedActivity(activity);
                      setAction('approve');
                      setConfirmationModalVisible(true);
                    }}>
                      <Text style={styles.buttonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => {
                      setSelectedActivity(activity);
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
              {activity.status === 'approved' && <Ionicons name="checkmark-circle" size={24} color="green" />}
              {activity.status === 'rejected' && <Ionicons name="close-circle" size={24} color="red" />}
            </View>
          </View>
        </TouchableOpacity>
      ));
  };

  return (
      <View style={styles.container}>

        <View style={{marginVertical: windowWidth < 768 ? 20 : 60}}>
          <SubHeader text="ACTIVITY" />
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
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Rating</Text>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Excellent'}
                        onValueChange={() => handleRatingChange('Excellent')}
                      />
                      <Text style={{ marginLeft: 5 }}>Excellent</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Good'}
                        onValueChange={() => handleRatingChange('Good')}
                      />
                      <Text style={{ marginLeft: 5 }}>Good</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Acceptable'}
                        onValueChange={() => handleRatingChange('Acceptable')}
                      />
                      <Text style={{ marginLeft: 5 }}>Acceptable</Text>
                    </View>

                    <Text style={{marginBottom: 10, fontSize: 20, fontWeight: 'bold'}}>Add comment(optional)</Text>
                    <TextInput
                      placeholder="Please enter a comment."
                      placeholderTextColor="grey"
                      value={comment}
                      onChangeText={setComment}
                      multiline
                      numberOfLines={4}
                      style={{ height: 150, width: '100%', borderColor: 'gray', borderWidth: 1, borderRadius: 10, marginBottom: 20, textAlignVertical: 'top' }}
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

        <View style={styles.boxCard}>
          <ScrollView>
            {renderCards()}
          </ScrollView>
        </View>

        {/* Modal สำหรับยืนยันการลบ */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={deleteConfirmationVisible}
            onRequestClose={() => setDeleteConfirmationVisible(false)}
          >
            <View style={styles.centerView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Confirm deletion of activity information?</Text>
                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[styles.recheckModalButton, styles.buttonApprove]}
                    onPress={() => {
                      handleDelete(activityToDelete);
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
            <View style={styles.modalView2}>
              <ScrollView>
              {selectedActivity && (
                <>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Admission Date : </Text>
                    {formatDate2(selectedActivity.admissionDate.toDate())}
                  </Text>
                    {selectedActivity.hours !== '' && selectedActivity.minutes !== '' && (
                      <>
                        <Text style={styles.modalText}>
                          <Text style={{ fontWeight: "bold" }}>Admission Time : </Text>
                          {formatTimeUnit(selectedActivity.hours)}.{formatTimeUnit(selectedActivity.minutes)}
                        </Text>
                      </>
                    )}

                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Professor Name : </Text> {selectedActivity.professorName}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Type :</Text> {selectedActivity.activityType || "None"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Topic : </Text> {selectedActivity.mainDiagnosis}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Note/Reflection : </Text> {selectedActivity.note || "None"}
                  </Text>

                  {(selectedStatus === 'approved' || selectedStatus === 'rejected') && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Rating : </Text>
                      {selectedActivity.rating || "None"}
                  </Text>
                  )}

                  {(selectedStatus === 'approved' || selectedStatus === 'rejected') && (
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold"}}>***Comment : </Text>
                    {selectedActivity.comment || "None"}
                  </Text>
                  )}

                  <View style={styles.buttonRow}>
                    {selectedActivity.images && selectedActivity.images.length > 0 && (
                      <Pressable
                        onPress={viewImages}
                        style={[styles.button, styles.buttonViewImages]}
                      >
                        <Text style={styles.textStyle}>View Picture</Text>
                      </Pressable>
                    )}

                    <Pressable
                              style={[styles.button, styles.buttonClose]}
                              onPress={() => setModalVisible(!modalVisible)}
                            >
                              <Text style={styles.textStyle}>Close</Text>
                            </Pressable>
                  </View>

                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={imageModalVisible}
                    onRequestClose={() => {
                      Alert.alert("Image viewer has been closed.");
                      setImageModalVisible(!imageModalVisible);
                    }}
                  >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                      <View style={{ width: '70%', height: '70%', backgroundColor: 'white', borderRadius: 10 }}>
                        <ScrollView>
                          {selectedActivity?.images && selectedActivity.images.map((imageUrl, index) => {
                            return (
                              <View key={index} style={{ marginBottom: 10, borderColor: '#ccc', borderWidth: 1, padding: 10, borderRadius: 5 }}>
                                <Image
                                  source={{ uri: imageUrl }}
                                  style={{ width: '100%', height: 200, resizeMode: 'contain', marginVertical: 10 }}
                                />
                                <Pressable
                                  style={{ backgroundColor: '#2196F3', padding: 5, borderRadius: 5, marginTop: 5 }}
                                  onPress={() => Linking.openURL(imageUrl)} // เปิด URL ในเบราว์เซอร์เริ่มต้น
                                >
                                  <Text style={{ color: 'white', textAlign: 'center' }}>Click to view picture url</Text>
                                </Pressable>
                              </View>
                            );
                          })}
                        </ScrollView>
                        <Pressable
                          style={[styles.button, styles.buttonClose]}
                          onPress={() => setImageModalVisible(!imageModalVisible)}
                        >
                          <Text style={styles.textStyle}>Close</Text>
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



export default ActivityScreen;
