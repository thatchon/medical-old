import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, Dimensions } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth, storage } from '../../data/firebaseDB'
import { getDocs, addDoc, collection, query, where, Timestamp, doc, updateDoc } from "firebase/firestore";
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesome, AntDesign } from "@expo/vector-icons";

function EditOpdScreen({ route, navigation }) {
  const { patientData } = route.params;

  const [selectedDate, setSelectedDate] = useState(patientData.admissionDate.toDate());
  const [mainDiagnosis, setMainDiagnosis] = useState(patientData.mainDiagnosis);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(patientData.coMorbid || []);
  const [hn, setHN] = useState(patientData.hn);
  const [note, setNote] = useState(patientData.note);
  const [selectedHour, setSelectedHour] = useState(patientData.hours.toString());
  const [selectedMinute, setSelectedMinute] = useState(patientData.minutes.toString());
  const [professorName, setProfessorName] = useState(patientData.professorName); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [professorId, setProfessorId] = useState(patientData.professorId);
  const [mainDiagnoses, setMainDiagnoses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(patientData.pdfUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const hours = Array.from({ length: 24 }, (_, i) => ({ key: i.toString(), value: i.toString() }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({ key: i.toString(), value: i.toString() }));
  // useEffect(() => {
  //   console.log("Teachers:", ); // ตรวจสอบข้อมูลอาจารย์
  //   console.log("Selected Professor ID:", professorId); // ตรวจสอบ ID ของอาจารย์ที่เลือก
  //   console.log("Hours:", hours); // ตรวจสอบข้อมูลชั่วโมง
  //   console.log("Selected Hour:", selectedHour); // ตรวจสอบชั่วโมงที่เลือก
  //   console.log("Minutes:", minutes); // ตรวจสอบข้อมูลนาที
  //   console.log("Selected Minute:", selectedMinute); // ตรวจสอบนาทีที่เลือก
  // }, [teachers, professorId, hours, selectedHour, minutes, selectedMinute]);
  useEffect(() => {
    console.log("Loaded data:", patientData);
  }, [patientData]);
  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get('window'));
    };

    Dimensions.addEventListener('change', updateLayout);
    return () => Dimensions.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const diagnoses = await fetchMainDiagnoses();
      setMainDiagnoses(diagnoses);

      const teachers = await fetchTeachers();
      setTeachers(teachers);
    }

    fetchData();
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

  const fetchMainDiagnoses = async () => {
    const mainDiagnosisRef = collection(db, "mainDiagnosis");
    const diagnosisSnapshot = await getDocs(mainDiagnosisRef);
    return diagnosisSnapshot.docs.map(doc => {
      const disease = doc.data().diseases;
      return disease.map(d => ({ key: d, value: d }));
    }).flat();
  };

  const fetchTeachers = async () => {
    const teacherRef = collection(db, "users");
    const q = query(teacherRef, where("role", "==", "teacher"));
    const teacherSnapshot = await getDocs(q);
    return teacherSnapshot.docs.map(doc => ({
      key: doc.id,
      value: doc.data().displayName
    }));
  };

  const saveDataToFirestore = async () => {
    if (!mainDiagnosis || !hn || !selectedDate || !professorId) {
      alert("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }

    try {
      let uploadedPdfUrl = pdfUrl;
      if (pdfFile && typeof pdfFile === 'object') {
        uploadedPdfUrl = await uploadPdfToStorage();
      }

      const patientDocRef = doc(db, "patients", patientData.id);
      await updateDoc(patientDocRef, {
        admissionDate: Timestamp.fromDate(new Date(selectedDate)),
        coMorbid: selectedDiagnosis,
        hn,
        mainDiagnosis,
        note,
        professorId,
        professorName: teachers.find(t => t.key === professorId)?.value,
        hours: parseInt(selectedHour),
        minutes: parseInt(selectedMinute),
        pdfUrl: uploadedPdfUrl
      });

      alert("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
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

  const onDrop = acceptedFiles => {
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
      const storageRef = ref(storage, `pdfs/${pdfFile.name}`);
      await uploadBytes(storageRef, pdfFile);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading PDF to Firebase Storage:", error);
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

        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 400,
            marginVertical: 8,
            textAlign: 'center'

          }}>อาจารย์ผู้รับผิดชอบ</Text>
          <SelectList
            setSelected={setProfessorId}
            data={teachers}
            defaultOption={{  key: professorId, value: professorName }}
            placeholder="เลือกชื่ออาจารย์ผู้รับผิดชอบ"
            placeholderTextColor="grey"
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
              placeholder="กรอกชื่อโรคหลัก"
              placeholderTextColor="grey"
              value={mainDiagnosis}
              onChangeText={setMainDiagnosis}
              style={{
                width: '100%',
                textAlign: 'center',
                height: '100%',
                fontSize: 20
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
              <View style={{ flex: 1 }}>
                <SelectList
                      setSelected={(value) => {
                        const newDiagnoses = [...selectedDiagnosis];
                        newDiagnoses[index] = { value: value }; // ปรับปรุงจาก newDiagnoses[index].value = value;
                        setSelectedDiagnosis(newDiagnoses);
                      }}
                  data={mainDiagnoses}
                  defaultOption={diagnosis.value ? { key: diagnosis.value, value: diagnosis.value } : null} // กำหนดค่าเริ่มต้นโดยใช้โครงสร้าง key-value
                  placeholder={"เลือกการวินิฉัย"}
                />
              </View>
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
            }}>
              <TextInput
                placeholder={isFocused ? '' : "กรอกรายละเอียด"}
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
              fontSize: 24,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: 'center'

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

export default EditOpdScreen;