import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Dimensions, Picker } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth, storage } from '../../data/firebaseDB'
import { getDocs, addDoc, collection, query, where, Timestamp, } from "firebase/firestore";
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesome, AntDesign } from "@expo/vector-icons";
import SubHeader from '../../component/SubHeader';  

function AddOpdScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [mainDiagnosis, setMainDiagnosis] = useState(""); // ใช้ TextInput สำหรับ Main Diagnosis
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([{}]); // เก็บโรคที่เลือกทั้งหมด
  const [mainDiagnoses, setMainDiagnoses] = useState([]); // เก็บรายชื่อโรค

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [hn, setHN] = useState(""); // HN
  const [coMorbid, setCoMorbid] = useState(""); // Co-Morbid Diagnosis
  const [note, setNote] = useState(""); // Note
  const status = "pending"; // Status
  const patientType = "outpatient"; // Patient Type
  const [createBy_id, setCreateById] = useState(null); // User ID
  const [professorId, setProfessorId] = useState(null); // สถานะสำหรับเก็บ id ของอาจารย์ที่ถูกเลือก
  const [professorName, setProfessorName] = useState(null); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [teachers, setTeachers] = useState([]); // สถานะสำหรับเก็บรายการอาจารย์ทั้งหมด
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');

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
  const onDrop = acceptedFiles => {
    // Check if the uploaded file is a PDF
    if (acceptedFiles[0].type !== 'application/pdf') {
      alert('กรุณาอัปโหลดเฉพาะไฟล์ PDF');
      return;
    }
    setPdfFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'application/pdf'
  });
  
  const uploadPdfToStorage = async () => {
    if (!pdfFile) return null;
  
    try {
      const storageRef = ref(storage, 'pdfs/' + pdfFile.name);
      await uploadBytes(storageRef, pdfFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading PDF to Firebase Storage:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PDF");
      return null;
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

      // if (!selectedDiagnosis || selectedDiagnosis.some(diagnosis => !diagnosis.value)) {
      //   alert("โปรดกรอก Main Diagnosis ในทุกแถว");
      //   return;
      // }

      if (!mainDiagnosis) {
        alert("โปรดกรอก Main Diagnosis");
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
      const user = auth.currentUser;
      const uploadedPdfUrl = await uploadPdfToStorage();

      if (user) {
        const { uid } = user; 
        const timestamp = Timestamp.fromDate(selectedDate); 
        // Add a new document with a generated ID to a collection
        await addDoc(collection(db, "patients"), {
          admissionDate: timestamp,
          coMorbid: selectedDiagnosis.length > 0 ? selectedDiagnosis : null,
          createBy_id: uid, // User ID
          hn: hn, // HN
          mainDiagnosis: mainDiagnosis,
          note: note, // Note
          patientType: patientType,
          professorName: professorName,
          status: status,
          professorId: professorId,
          pdfUrl: uploadedPdfUrl || "",
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
        setPdfFile(null);
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

      <View style={{marginVertical: dimensions.width < 768 ? 40 : 60,}}>
        <SubHeader text="ADD OUTPATIENT" />
      </View>

      <View style={{ flexDirection: dimensions.width < 768 ? 'column' : 'row', alignItems: 'left', marginBottom: 16, justifyContent: 'space-between' }}>
        <View style={{ width: dimensions.width < 768 ? '100%' : '45%' }}>
          <Text style={{ fontSize: 20, fontWeight: 400, marginVertical: 8, textAlign: 'left' }}>OPD Addmission Date</Text>
          <DateInput />
        </View>
        <View style={{ width: dimensions.width < 768 ? '100%' : '45%', flexDirection: 'row', justifyContent: 'left', alignItems: 'left' }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 400, marginVertical: 8, textAlign: 'left' }}>OPD Addmission Time</Text>
            <View style={{ flexDirection: 'row', alignItems: 'left' }}>
              <SelectList
                setSelected={setSelectedHour}
                data={hours}
                placeholder="Hours"
                search={false}
                boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10 }}
                dropdownStyles={{ backgroundColor: '#FEF0E6' }}
              />
              <Text style={{ marginHorizontal: 5, alignSelf: 'center' }}>:</Text>
              <SelectList
                setSelected={setSelectedMinute}
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
        <Text style={{ fontSize: 20, fontWeight: 400, marginVertical: 8, textAlign: 'left', alignItems: 'flex-start' }}>HN</Text>
        <View style={{
          height: 48,
          borderColor: '#FEF0E6',
          borderWidth: 1,
          borderRadius: 10,
          alignItems: 'left',
          justifyContent: 'left',
        }}>
          <TextInput
            placeholder="Fill the hospital number"
            placeholderTextColor="grey"
            value={hn}
            onChangeText={setHN}
            style={{
              width: '100%',
              textAlign: 'center',
              height: '100%',
              fontSize: 20,
              backgroundColor: '#FEF0E6'
            }}
          />
        </View>
      </View>
      <View style={{ width: dimensions.width < 768 ? '100%' : '45%' }}>
      <Text style={{ fontSize: 20, fontWeight: 400, marginVertical: 8, textAlign: 'left', alignItems: 'flex-start' }}>Professor</Text>
        <SelectList
          setSelected={onSelectTeacher}
          data={teachers}
          placeholder={"Select the professor name"}
          placeholderTextColor="grey"
          boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10  }}
          dropdownStyles={{ backgroundColor: '#FEF0E6' }}
        />
      </View>
    </View>


        <View>
          <Text style={{
            fontSize: 20,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'left'

          }}>Main Diagnosis</Text>
        </View>
        
        <View style={{
              height: 48,
              borderColor: '#FEF0E6',
              borderWidth: 1,
              borderRadius: 10,
              alignItems: 'left',
              justifyContent: 'left',
              marginVertical: 8,
            }}>
          <TextInput
              placeholder="Fill the main diagnosis"
              placeholderTextColor="grey"
              value={mainDiagnosis}
              onChangeText={setMainDiagnosis}
              style={{
                width: '100%',
                textAlign: 'center',
                height: '100%',
                fontSize: 20,
                backgroundColor: '#FEF0E6'
              }}
            />
          </View>

        <View>
          <Text style={{
            fontSize: 20,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'left'

          }}>Co-Morbid Diagnosis</Text>
        </View>
        {
  selectedDiagnosis.map((diagnosis, index) => (
    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <SelectList
          setSelected={(value) => {
            const newDiagnoses = [...selectedDiagnosis];
            newDiagnoses[index] = { value: value };
            setSelectedDiagnosis(newDiagnoses);
          }}
          data={mainDiagnoses}
          placeholder={"Select a diagnosis"}
          boxStyles={{ width: 'auto', backgroundColor: '#FEF0E6', borderColor: '#FEF0E6', borderWidth: 1, borderRadius: 10  }}
          dropdownStyles={{ backgroundColor: '#FEF0E6' }}
        />
      </View>
      {index === selectedDiagnosis.length - 1 ? (
        <TouchableOpacity onPress={addDiagnosis} style={{ marginLeft: 10, backgroundColor: '#5F7D8E', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 16, color: 'white' }}>+ Add</Text>
        </TouchableOpacity>
      ) : null}
      {selectedDiagnosis.length > 1 ? (
        <TouchableOpacity onPress={() => removeDiagnosis(index)} style={{ marginLeft: 10, backgroundColor: '#5F7D8E', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 16, color: 'white' }}>- Delete</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  ))
}


          
        <View style={{ marginBottom: 16, width: '70%' }}>
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

          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: 'left'

            }}>Upload File ( Unable to support files larger than 5 MB.)  
            (Optinal)</Text>
          <View 
            {...getRootProps({ className: 'dropzone' })}
            style={{ 
              height: 50,
              borderColor: 'gray',
              borderWidth: 1,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row'
            }}
          >
            <input {...getInputProps()} />
            <FontAwesome name="upload" size={24} color="black" />
            <Text style={{ marginLeft: 10 }}>
              {
                pdfFile ? pdfFile.name : 'Import PDF only.'
              }
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: '10%' }}>
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

export default AddOpdScreen;