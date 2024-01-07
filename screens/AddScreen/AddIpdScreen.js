import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Dimensions } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth } from '../../data/firebaseDB'
import { getDocs, addDoc, collection, query, where, Timestamp } from "firebase/firestore";
import { AntDesign } from "@expo/vector-icons";

function AddIpdScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [mainDiagnosis, setMainDiagnosis] = useState(""); // ใช้ TextInput สำหรับ Main Diagnosis
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([{}]); // เก็บโรคที่เลือกทั้งหมด
  const [mainDiagnoses, setMainDiagnoses] = useState([]); // เก็บรายชื่อโรค


  const [hn, setHN] = useState(""); // HN
  const [coMorbid, setCoMorbid] = useState(""); // Co-Morbid Diagnosis
  const [note, setNote] = useState(""); // Note
  const status = "pending"; // Status
  const patientType = "inpatient"; // Patient Type
  const [createBy_id, setCreateById] = useState(null); // User ID
  const [professorId, setProfessorId] = useState(null); // สถานะสำหรับเก็บ id ของอาจารย์ที่ถูกเลือก
  const [professorName, setProfessorName] = useState(null); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [teachers, setTeachers] = useState([]); // สถานะสำหรับเก็บรายการอาจารย์ทั้งหมด
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");

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
  
  });

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
  
const addDiagnosis = () => {
  setSelectedDiagnosis([...selectedDiagnosis, {}]);
};

const removeDiagnosis = (index) => {
  const newDiagnosis = [...selectedDiagnosis];
  newDiagnosis.splice(index, 1);
  setSelectedDiagnosis(newDiagnosis);
};

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

  const saveDataToFirestore = async () => {
    try {

      if (!selectedDiagnosis || selectedDiagnosis.some(diagnosis => !diagnosis.value)) {
        alert("โปรดกรอก Main Diagnosis ในทุกแถว");
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

      if (!professorName) {
        alert("โปรดเลือกอาจารย์");
        return;
      }

      // Get the currently authenticated user
      const user = auth.currentUser;
    
      // Check if a user is authenticated
      if (user) {
        const { uid } = user; 
        const timestamp = Timestamp.fromDate(selectedDate);
        // Add a new document with a generated ID to a collection
        await addDoc(collection(db, "patients"), {
          admissionDate: timestamp,
          coMorbid: selectedDiagnosis, // Co-Morbid Diagnosis
          createBy_id: uid, // User ID
          hn: hn, // HN
          mainDiagnosis: mainDiagnosis,
          note: note, // Note
          patientType: patientType,
          professorName: professorName,
          status: status,
          professorId: professorId,
          hours: selectedHour,
          minutes: selectedMinute
          // Add more fields as needed
        });

        // Clear the input fields after successfully saving data
        setHN("");
        setSelectedDate(new Date());
        setSelectedDiagnosis([{}]);
        setCoMorbid("");
        setNote("");
        setSelectedHour("");
        setSelectedMinute("");

        // Display a success message or perform any other action
        alert("บันทึกข้อมูลสำเร็จ");
      } else {
        // Handle the case when no user is authenticated
        alert("ไม่พบข้อมูลผู้ใช้");
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      // Handle errors or display an error message
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
            textAlign: 'center' }}>วันที่รับผู้ป่วย</Text>
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

        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>อาจารย์ผู้รับผิดชอบ</Text>
          <SelectList
            setSelected={onSelectTeacher}
            data={teachers}
            placeholder={"เลือกชื่ออาจารย์ผู้รับผิดชอบ"}
          />
        </View>

        <View style={{ marginBottom: 16, width: '70%'}}>
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
              value={hn}
              onChangeText={setHN}
              style={{
                width: '100%',
                textAlign: 'center'
              }}
            ></TextInput>
          </View>
        </View>

        <View>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>Main Diagnosis</Text>
        </View>

        <View style={{
              height: 48,
              borderColor: 'black',
              borderWidth: 1,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 8,
            }}>
          <TextInput
              placeholder="กรอกโรคหลัก"
              value={mainDiagnosis}
              onChangeText={setMainDiagnosis}
              style={{
                width: '100%',
                textAlign: 'center'
              }}
            />
          </View>

        <View>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>Co-Morbid Diagnosis</Text>
        </View>
        {
          selectedDiagnosis.map((diagnosis, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, }}>
              <SelectList
                    setSelected={(value) => {
                      const newDiagnoses = [...selectedDiagnosis];
                      newDiagnoses[index] = { value: value }; // ปรับปรุงจาก newDiagnoses[index].value = value;
                      setSelectedDiagnosis(newDiagnoses);
                    }}
                data={mainDiagnoses}
                placeholder={"เลือกการวินิฉัย"}
              />
              {index === selectedDiagnosis.length - 1 ? (
                <TouchableOpacity onPress={addDiagnosis} style={{ marginLeft: 10 }}>
                  <AntDesign name="plus" size={20} color="black" />
                </TouchableOpacity>
              ) : null}
              {selectedDiagnosis.length > 1 ? (
                <TouchableOpacity onPress={() => removeDiagnosis(index)} style={{ marginLeft: 10 }} >
                  <AntDesign name="minus" size={20} color="black" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        }
          
        <View style={{ marginBottom: 16, width: '70%' }}>
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


export default AddIpdScreen;