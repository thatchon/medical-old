import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Dimensions } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth, storage } from '../../data/firebaseDB'
import { getDocs, addDoc, collection, query, where, Timestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

function AddActivityScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [selectedDiagnosis, setSelectedDiagnosis] = useState(""); // State for selected diagnosis
  const [mainDiagnoses, setMainDiagnoses] = useState([]); // State to store main diagnoses

  const [professorId, setProfessorId] = useState(null);
  const [professorName, setProfessorName] = useState(null); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [teachers, setTeachers] = useState([]);

  const [activityType, setActivityType] = useState([]);
  const [selectedActivityType, setSelectedActivityType] = useState("");

  const [note, setNote] = useState(""); // Note
  const status = "pending"; // Status
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");

  const [uploadedImages, setUploadedImages] = useState([]);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const hours = Array.from({ length: 24 }, (_, i) => ({ key: i.toString(), value: i.toString() }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({ key: i.toString(), value: i.toString() }));

  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get('window'));
    };

    Dimensions.addEventListener('change', updateLayout);
    return () => Dimensions.removeEventListener('change', updateLayout);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: dimensions.width < 768 ? 10 : 30,
    },
    uploadContainer: {
      marginBottom: 16,
    },
    uploadTitle: {
      fontSize: 24,
      fontWeight: '400',
      marginVertical: 8,
      textAlign: 'center'
    },
    dropzone: {
      height: 50,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row'
    },
    uploadedFileName: {
      marginLeft: 10,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalImage: {
      width: '90%',
      height: 'auto',
      marginVertical: 10,
      borderRadius: 10,
    },
    imageText: {
      fontSize: 18,
      marginTop: 10,
      textAlign: 'center',
      color: 'blue'
    },
  });

  const selectImages = (event) => {
    const files = event.target.files;
    if (files) {
        const imagesArray = Array.from(files);
        setUploadedImages(imagesArray);
    }
  }

  const uploadImages = async (uploadedImages, docId) => {
    const storageURLs = [];
    const uploadPromises = uploadedImages.map(async (image) => {
      const imageRef = ref(storage, `activity_images/${docId}/${image.name}`);
      await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(imageRef);
      storageURLs.push(downloadURL);
    });
  
    await Promise.all(uploadPromises);
    return storageURLs;
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === "ios");
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const DateInput = () => {
    if (Platform.OS === "web") {
      return (
        <input
          type="date"
          style={{
            marginTop: 5,
            padding: 10,
            fontSize: 16
          }}
          value={selectedDate.toISOString().substr(0, 10)}
          onChange={(event) => setSelectedDate(new Date(event.target.value))}
        />
      );
    } else {
      return (
        <>
          <Button onPress={showDatepicker} title="Show date picker!" />
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={"date"}
              is24Hour={true}
              display="default"
              onChange={onChange}
            />
          )}
        </>
      );
    }
  };


  const onSelectTeacher = (selectedTeacherId) => {
    const selectedTeacher = teachers.find(teacher => teacher.key === selectedTeacherId);
    // console.log(selectedTeacher)
    if (selectedTeacher) {
      setProfessorName(selectedTeacher.value);
      setProfessorId(selectedTeacher.key);
    } else {
      console.error('Teacher not found:', selectedTeacherId);
    }
  }

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const teacherRef = collection(db, "users");
        const q = query(teacherRef, where("role", "==", "teacher")); // ใช้ query และ where ในการ filter

        const querySnapshot = await getDocs(q); // ใช้ query ที่ถูก filter ในการ getDocs

        const teacherArray = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          teacherArray.push({ key: doc.id, value: data.displayName });
        });

        setTeachers(teacherArray); // ตั้งค่ารายการอาจารย์
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    }

    fetchTeachers(); // เรียกฟังก์ชันเพื่อดึงข้อมูลอาจารย์
  }, []);

  useEffect(() => {
    async function fetchMainDiagnoses() {
      try {
        const mainDiagnosisRef = collection(db, "mainDiagnosis");
        const querySnapshot = await getDocs(mainDiagnosisRef);
  
        const diagnoses = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          data.diseases.forEach((disease) => {
            diagnoses.push({ key: disease, value: disease });
          });
        });
  
        setMainDiagnoses(diagnoses);
      } catch (error) {
        console.error("Error fetching main diagnoses:", error);
      }
    }
  
    fetchMainDiagnoses();
  }, []);

  useEffect(() => {
    async function fetchActivityType() {
      try {
        const activityTypeRef = collection(db, "activity_type");
        const querySnapshot = await getDocs(activityTypeRef);
  
        const activityArray = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          data.activityType.forEach((activity) => {
            activityArray.push({ key: activity, value: activity });
          });
        });
  
        setActivityType(activityArray);
      } catch (error) {
        console.error("Error fetching activity:", error);
      }
    }
  
    fetchActivityType();
  }, []);

  const saveDataToFirestore = async () => {
    try {

      if (!selectedDiagnosis) {
        alert("โปรดกรอก Main Diagnosis");
        return;
      }
      
      if (!selectedActivityType) {
        alert("โปรดเลือกประเภท");
        return;
      }
  
      if (!selectedDate) {
        alert("โปรดเลือกวันที่รับผู้ป่วย");
        return;
      }

      if (!professorName) {
        alert("โปรดเลือกอาจารย์");
        return;
      }

      // if (uploadedImages.length === 0) {
      //   alert("กรุณาเลือกรูปภาพก่อนทำการบันทึก");
      //   return;
      // }
      // Get the currently authenticated user
      const user = auth.currentUser;
      if (!user) {
        alert("ไม่พบข้อมูลผู้ใช้");
        return;
      }
  
      const timestamp = Timestamp.fromDate(selectedDate);
  
      // Step 1: Save patient data (excluding images) and retrieve the Document ID
      const docRef = await addDoc(collection(db, "activity"), {
        admissionDate: timestamp,
        activityType: selectedActivityType, // Activity
        createBy_id: user.uid, // User ID
        mainDiagnosis: selectedDiagnosis,
        note: note, // Note
        professorName: professorName,
        status: status,
        professorId: professorId,
        images: [], // We'll store the image URLs in the next step
        hours: selectedHour,
        minutes: selectedMinute
      });
  
      // Step 2: Use the Document ID as a folder name for image uploads and then update image URLs in Firestore
      const imageUrls = await uploadImages(uploadedImages, docRef.id);
      await updateDoc(docRef, { images: imageUrls });
  
      // Clear the input fields and states
      setSelectedDate(new Date());
      setSelectedDiagnosis("");
      setSelectedActivityType("");
      setNote("");
      setSelectedHour("");
      setSelectedMinute("");
  
      alert("บันทึกข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };




  return (
    <ScrollView>
      <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center' }}>วันที่ทำกิจกรรม</Text>
            <DateInput />
          </View>
          <View style={{ flex: 1, marginRight: 10}}>
            <Text style={{ fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center' }}>ชั่วโมง</Text>
            <SelectList
              setSelected={setSelectedHour}
              data={hours}
              placeholder="เลือกชั่วโมง"
              search={false}
              boxStyles={{width: 'auto'}}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center' }}>นาที</Text>
            <SelectList
              setSelected={setSelectedMinute}
              data={minutes}
              placeholder="เลือกนาที"
              search={false}
              boxStyles={{width: 'auto'}}
            />
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>Activity Type</Text>
          <SelectList
            setSelected={setSelectedActivityType}
            data={activityType}
            placeholder={"เลือกประเภท"}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>Professor</Text>
          <SelectList
            setSelected={onSelectTeacher}
            data={teachers}
            placeholder={"เลือกชื่ออาจารย์"}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>Topic</Text>
          <SelectList
            setSelected={setSelectedDiagnosis}
            data={mainDiagnoses}
            placeholder={"เลือกการวินิฉัย"}
          />
        </View>

        <View style={{ marginBottom: 12, width: '70%' }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>Note / Reflection (optional)</Text>
        <View style={{
          height: 260,
          borderColor: 'black',
          borderWidth: 1,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <TextInput
            placeholder="กรอกรายละเอียด"
            value={note}
            onChangeText={setNote}
            style={{
              width: '100%',
              height: '100%',
              textAlign: 'center'
            }}
          ></TextInput>
          </View>
        </View>

    {/* UI for image upload */}
    <View style={styles.uploadContainer}>
        <Text style={styles.uploadTitle}>
          Upload Image ( Unable to support files larger than 5 MB.)
(Optional)</Text>
        <View style={styles.dropzone}>
          <input type="file" accept="image/*" multiple onChange={selectImages} />
        </View>
      </View>

        <TouchableOpacity
          style={{
            height: 48,
            width: 140,
            marginVertical: 10,
            marginBottom: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#05AB9F",
            borderRadius: 30,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
          onPress={saveDataToFirestore}
        >
          <Text style={{ fontSize: 20, color: 'white' }}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    );
  }

export default AddActivityScreen;