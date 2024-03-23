import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Dimensions } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth, storage } from '../../data/firebaseDB'
import { getDocs, addDoc, collection, query, where, Timestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import SubHeader from '../../component/SubHeader';  

function EditActivityScreen({ route, navigation }) {
  const { activityData } = route.params;

  const [selectedDate, setSelectedDate] = useState(activityData.admissionDate.toDate());

  const [selectedDiagnosis, setSelectedDiagnosis] = useState(activityData.mainDiagnosis || []); // State for selected diagnosis
  const [mainDiagnoses, setMainDiagnoses] = useState([]); // State to store main diagnoses

  const [professorId, setProfessorId] = useState(activityData.professorId);
  const [professorName, setProfessorName] = useState(activityData.professorName); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [teachers, setTeachers] = useState([]);

  const [activityType, setActivityType] = useState([]);
  const [selectedActivityType, setSelectedActivityType] = useState(activityData.activityType);

  const [note, setNote] = useState(activityData.note); // Note
  const status = "pending"; // Status
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedHour, setSelectedHour] = useState(activityData.hours.toString());
  const [selectedMinute, setSelectedMinute] = useState(activityData.minutes.toString());

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
      alignItems: "left",
      justifyContent: "left",
      paddingHorizontal: dimensions.width < 768 ? 10 : 30,
    },
    uploadContainer: {
      marginBottom: 16,
    },
    uploadTitle: {
      fontSize: 20,
      fontWeight: '400',
      marginVertical: 8,
      textAlign: 'left'
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
            fontSize: 16,
            width: "95%",
            backgroundColor: '#FEF0E6',
            borderColor: '#FEF0E6',
            borderWidth: 1,
            borderRadius: 10,
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
  
      // Step 1: Save patient data (excluding images) and retrieve the Document ID
      const docRef = doc(db, "activity", activityData.id);
      await updateDoc(docRef, {
        admissionDate: Timestamp.fromDate(new Date(selectedDate)),
        activityType: selectedActivityType, // Activity
        createBy_id: user.uid, // User ID
        mainDiagnosis: selectedDiagnosis,
        note: note, // Note
        professorName: teachers.find(t => t.key === professorId)?.value,
        professorId: professorId,
        images: [], // We'll store the image URLs in the next step
        hours: parseInt(selectedHour),
        minutes: parseInt(selectedMinute)
      });
  
      // Step 2: Use the Document ID as a folder name for image uploads and then update image URLs in Firestore
      const imageUrls = await uploadImages(uploadedImages, docRef.id);
      await updateDoc(docRef, { images: imageUrls });
  
      alert("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>

        <View style={{marginVertical: dimensions.width < 768 ? 40 : 60,}}>
          <SubHeader text="EDIT ACTIVITY" />
        </View>

        <View style={{ flexDirection: dimensions.width < 768 ? 'column' : 'row', alignItems: 'left', marginBottom: 16, justifyContent: 'space-between' }}>
          <View style={{ width: dimensions.width < 768 ? '100%' : '45%' }}>
            <Text style={{ fontSize: 20, fontWeight: 400, marginVertical: 8, textAlign: 'left' }}>Activity Date</Text>
            <DateInput />
          </View>
          <View style={{ width: dimensions.width < 768 ? '100%' : '45%', flexDirection: 'row', justifyContent: 'left', alignItems: 'left' }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: 400, marginVertical: 8, textAlign: 'left' }}>Activity Time</Text>
              <View style={{ flexDirection: 'row', alignItems: 'left' }}>
                <SelectList
                  setSelected={setSelectedHour}
                  defaultOption={{ key: selectedHour, value: selectedHour }}
                  data={hours}
                  placeholder="Hours"
                  search={false}
                  boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10 }}
                  dropdownStyles={{ backgroundColor: '#FEF0E6' }}
                />
                <Text style={{ marginHorizontal: 5, alignSelf: 'center' }}>:</Text>
                <SelectList
                  setSelected={setSelectedMinute}
                  defaultOption={{ key: selectedMinute, value: selectedMinute }}
                  data={minutes}
                  placeholder="Minutes"
                  search={false}
                  boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10  }}
                  dropdownStyles={{ backgroundColor: '#FEF0E6' }}
                />
              </View>
            </View>
        </View>
      </View>

      <View style={{ flexDirection: dimensions.width < 768 ? 'column' : 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ width: dimensions.width < 768 ? '100%' : '45%' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'left'

          }}>Activity Type</Text>
          <SelectList
            setSelected={setSelectedActivityType}
            defaultOption={{ key: selectedActivityType, value: selectedActivityType }}
            data={activityType}
            placeholder={"Select activity type"}
            boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10  }}
            dropdownStyles={{ backgroundColor: '#FEF0E6' }}
          />
        </View>

        <View style={{ width: dimensions.width < 768 ? '100%' : '45%' }}>
          <Text style={{
            fontSize: 20, 
            fontWeight: 400,
            marginVertical: 8, 
            textAlign: 'left', 
            alignItems: 'flex-start' 
            
            }}>Professor</Text>
            <SelectList
              setSelected={onSelectTeacher}
              defaultOption={{  key: professorId, value: professorName }}
              data={teachers}
              placeholder={"Select the professor name"}
              placeholderTextColor="grey"
              boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10  }}
              dropdownStyles={{ backgroundColor: '#FEF0E6' }}
            />
        </View>
      </View>

        <View style={{ marginBottom: 16, width: '70%' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'left'

          }}>Topic</Text>
          <SelectList
            setSelected={setSelectedDiagnosis}
            defaultOption={{ key: selectedDiagnosis, value: selectedDiagnosis }}
            data={mainDiagnoses}
            placeholder={"เลือกการวินิฉัย"}
            boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10  }}
            dropdownStyles={{ backgroundColor: '#FEF0E6' }}
          />
        </View>

        <View style={{ marginBottom: 16, width: '70%', }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'left'

          }}>Note / Reflection (optional)</Text>
        <View style={{
          height: 260,
          borderColor: '#FEF0E6',
          borderWidth: 1,
          borderRadius: 10,
          backgroundColor: '#FEF0E6'
        }}>
          <TextInput
                placeholder={isFocused ? '' : "Fill a note/reflection"}
                placeholderTextColor="grey"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(note.length > 0)}
                value={note}
                onChangeText={setNote}
                multiline
                style={{
                  width: '100%',
                  height: '100%',
                  textAlign: 'left', // ตั้งค่าให้ข้อความจัดชิดซ้าย
                  textAlignVertical: 'top', // ตั้งค่าให้ข้อความเริ่มที่บน
                  paddingTop: 8, // พิจารณาเพิ่ม padding ด้านบน
                  paddingLeft: 8, // พิจารณาเพิ่ม padding ด้านซ้าย
                  fontSize: 20
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

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: '20%' }}>
        <TouchableOpacity
            onPress={saveDataToFirestore}
            style={{
              height: 48,
              width: 120,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#008000',
              borderRadius: 30,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              marginRight: 20
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              height: 48,
              width: 120,
              marginRight: 10,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'grey',
              borderRadius: 30,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    );
  }

export default EditActivityScreen;