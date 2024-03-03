import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, CheckBox, Platform, ScrollView, Dimensions} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth, storage } from '../../data/firebaseDB'
import { getDocs, addDoc, collection, query, where, Timestamp, updateDoc, doc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

function EditProcedureScreen({ route, navigation }) {
  const { procedureData } = route.params;

  const [selectedDate, setSelectedDate] = useState(procedureData.admissionDate.toDate());

  const [selectedProcedures, setSelectedProcedures] = useState(procedureData.procedureType); // State for selected Procedures
  const [mainProcedure, setMainProcedure] = useState([]); // State to store main Procedure

  const [hn, setHN] = useState(procedureData.hn); // HN
  const [remarks, setRemarks] = useState(procedureData.remarks); // remarks
  const [approvedById, setApprovedById] = useState(procedureData.approvedById); // สถานะสำหรับเก็บ id ของอาจารย์ที่ถูกเลือก
  const [approvedByName, setApprovedByName] = useState(procedureData.approvedByName); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [teachers, setTeachers] = useState([]); // สถานะสำหรับเก็บรายการอาจารย์ทั้งหมด
  const [procedureLevel, setProcedureLevel] = useState(procedureData.procedureLevel);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedHour, setSelectedHour] = useState(procedureData.hours.toString());
  const [selectedMinute, setSelectedMinute] = useState(procedureData.minutes.toString());

  const [uploadedImages, setUploadedImages] = useState([]);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const hours = Array.from({ length: 24 }, (_, i) => ({ key: i.toString(), value: i.toString() }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({ key: i.toString(), value: i.toString() }));
  useEffect(() => {
    console.log("Hours:", mainProcedure); // ตรวจสอบข้อมูลชั่วโมง
  }, [mainProcedure]);
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
    checkboxContainerStyle: {
      flexDirection: 'row', 
      alignItems: 'center', 
      margin: 5, 
      padding: 8, 
      borderWidth: 1, 
      borderColor: '#d1d1d1', 
      borderRadius: 5,
      backgroundColor: '#ffffff', 
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    previewImage: {
      width: 100,
      height: 100,
      margin: 5,
      borderRadius: 5,
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
      const imageRef = ref(storage, `procedures_images/${docId}/${image.name}`);
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
        setApprovedByName(selectedTeacher.value);
        setApprovedById(selectedTeacher.key);
    } else {
        console.error('Teacher not found:', selectedTeacherId);
    }
}
  

  useEffect(() => {
    async function fetchMainProcedure() {
      try {
        const procedureTypeRef = collection(db, "procedures_type");
        const querySnapshot = await getDocs(procedureTypeRef);
  
        const Procedure = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          data.procedureType.forEach((disease) => {
            Procedure.push({ key: disease, value: disease });
          });
        });
  
        setMainProcedure(Procedure);
      } catch (error) {
        console.error("Error fetching main Procedure:", error);
      }
    }
  
    fetchMainProcedure();
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

  const saveDataToFirestore = async () => {
    try {

      if (!selectedProcedures) {
        alert("โปรดเลือกประเภท");
        return;
      }
      
      if (!hn) {
        alert("โปรดกรอก HN");
        return;
      }
  
      if (!selectedDate) {
        alert("โปรดเลือกวันที่รับผู้ป่วย");
        return;
      }

      if (!approvedByName) {
        alert("โปรดเลือกอาจารย์");
        return;
      }

      if (!procedureLevel) {
        alert("โปรดเลือกเลเวล");
        return;
      }
      // if (uploadedImages.length === 0) {
      //   alert("กรุณาเลือกรูปภาพก่อนทำการบันทึก");
      //   return;
      // }

      const user = auth.currentUser;
      if (!user) {
        alert("ไม่พบข้อมูลผู้ใช้");
        return;
      }
  
      const timestamp = Timestamp.fromDate(selectedDate);
  
      // Step 1: Save patient data (excluding images) and retrieve the Document ID

      const docRef = doc(db, "procedures", procedureData.id);
      await updateDoc(docRef, {
        admissionDate: Timestamp.fromDate(new Date(selectedDate)),
        hn,
        procedureType: selectedProcedures,
        remarks: remarks,
        approvedByName: teachers.find(t => t.key === approvedById)?.value,
        approvedById: approvedById,
        procedureLevel: procedureLevel,
        images: [], // We'll store the image URLs in the next step
        hours: parseInt(selectedHour),
        minutes: parseInt(selectedMinute)
      });
  
      const imageUrls = await uploadImages(uploadedImages, docRef.id);
      await updateDoc(docRef, { images: imageUrls });

      alert("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
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
            textAlign: 'center' }}>วันที่ทำหัตถการ</Text>
            <DateInput />
          </View>
          <View style={{ flex: 1, marginRight: 10}}>
            <Text style={{ fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center' }}>ชั่วโมง</Text>
            <SelectList
              setSelected={setSelectedHour}
              defaultOption={{ key: selectedHour, value: selectedHour }}
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
              defaultOption={{ key: selectedMinute, value: selectedMinute }}
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

          }}>Procedure</Text>
          <SelectList
            setSelected={setSelectedProcedures}
            defaultOption={{ key: selectedProcedures, value: selectedProcedures }}
            data={mainProcedure}
            placeholder={"เลือกหัวข้อหัตถการ"}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{
              fontSize: 24,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: 'center'

            }}>Level</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginBottom: 12 }}>
              <View style={styles.checkboxContainerStyle}>
                <CheckBox value={procedureLevel === 1} onValueChange={() => setProcedureLevel(1)} />
                <Text style={{ marginLeft: 5, fontSize: 20 }}>Observe</Text>
              </View>
              <View style={styles.checkboxContainerStyle}>
                <CheckBox value={procedureLevel === 2} onValueChange={() => setProcedureLevel(2)} />
                <Text style={{ marginLeft: 5, fontSize: 20 }}>Assist</Text>
              </View>
              <View style={styles.checkboxContainerStyle}>
                <CheckBox value={procedureLevel === 3} onValueChange={() => setProcedureLevel(3)} />
                <Text style={{ marginLeft: 5, fontSize: 20 }}>Perform</Text>
              </View>
            </View>
        </View>

        <View style={{ marginBottom: 12, width: '70%' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: 'center'

            }}>HN</Text>
            <View style={{
              height: 48,
              borderColor: 'black',
              borderWidth: 1,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TextInput
                placeholder="กรอกรายละเอียด"
                placeholderTextColor="grey"
                value={hn}
                onChangeText={setHN}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  height: '100%',
                  fontSize: 20
                }}
              ></TextInput>
            </View>
          </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>ผู้ Approve</Text>
          <SelectList
            setSelected={onSelectTeacher}
            defaultOption={{  key: approvedById, value: approvedByName }}
            data={teachers}
            placeholder={"เลือกชื่ออาจารย์"}
          />
        </View>

        <View style={{ marginBottom: 12, width: '70%', }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: 'center'

            }}>หมายเหตุ</Text>
          <View style={{
            height: 260,
            borderColor: 'black',
            borderWidth: 1,
            borderRadius: 8,
          }}>
            <TextInput
              placeholder={isFocused ? '' : "กรอกรายละเอียด"}
              placeholderTextColor="grey"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(note.length > 0)}
              value={remarks}
              onChangeText={setRemarks}
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
        <Text style={styles.uploadTitle}>อัปโหลดรูปภาพ (optional)</Text>
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

export default EditProcedureScreen;