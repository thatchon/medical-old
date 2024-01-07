import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Picker, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { db } from '../data/firebaseDB';
import { collection, query, where, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { AntDesign } from "@expo/vector-icons";

const ReportScreen = () => {
  const currentUserUid = useSelector(state => state.user.uid);
  const [patientsData, setPatientsData] = useState([]);
  const [proceduresData, setProceduresData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [fileFormat, setFileFormat] = useState('csv');

  useEffect(() => {
    // Fetch patients data
    const getPatientsData = async () => {
      const patientsCollection = collection(db, 'patients');
      const patientQuery = query(patientsCollection, where("createBy_id", "==", currentUserUid));
      const patientSnapshot = await getDocs(patientQuery);
      setPatientsData(patientSnapshot.docs.map(doc => doc.data()));
    };

    // Fetch procedures data
    const getProceduresData = async () => {
      const proceduresCollection = collection(db, 'procedures');
      const procedureQuery = query(proceduresCollection, where("createBy_id", "==", currentUserUid));
      const procedureSnapshot = await getDocs(procedureQuery);
      setProceduresData(procedureSnapshot.docs.map(doc => doc.data()));
    };

    // Fetch activity data
    const getActivityData = async () => {
      const activityCollection = collection(db, 'activity');
      const activityQuery = query(activityCollection, where("createBy_id", "==", currentUserUid));
      const activitySnapshot = await getDocs(activityQuery);
      setActivityData(activitySnapshot.docs.map(doc => doc.data()));
    };

    getPatientsData();
    getProceduresData();
    getActivityData();
  }, [currentUserUid]);

  const formatDate = (timestamp) => {
    return timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : '';
  };

  const formatPatientsData = (data) => {
    return data.map(patient => {
      return {
        ...patient,
        mainDiagnosis: patient.mainDiagnosis ? patient.mainDiagnosis.map(diagnosis => diagnosis.value).join(', ') : '',
        admissionDate: patient.admissionDate ? new Date(patient.admissionDate.seconds * 1000).toLocaleDateString() : '', // แปลง timestamp เป็นวันที่
      };
    });
  };

  const formatDataForExport = (data) => {
    return data.map(item => ({
      ...item,
      admissionDate: formatDate(item.admissionDate),
      Images: item.images ? item.images.join(', ') : ''
    }));
  };


  const handleDownload = () => {
    const wb = XLSX.utils.book_new();
  
    const formattedPatientsData = formatPatientsData(patientsData);
    const formattedProceduresData = formatDataForExport(proceduresData);
    const formattedActivityData = formatDataForExport(activityData);
  
    // สร้าง worksheet สำหรับแต่ละ collection
    const wsPatients = XLSX.utils.json_to_sheet(formattedPatientsData);
    const wsProcedures = XLSX.utils.json_to_sheet(formattedProceduresData);
    const wsActivities = XLSX.utils.json_to_sheet(formattedActivityData);

    // ใส่ worksheet เข้า workbook
    XLSX.utils.book_append_sheet(wb, wsPatients, 'Patients');
    XLSX.utils.book_append_sheet(wb, wsProcedures, 'Procedures');
    XLSX.utils.book_append_sheet(wb, wsActivities, 'Activities');

    if (fileFormat === 'csv') {
      const csvPatients = XLSX.utils.sheet_to_csv(wsPatients);
      const csvProcedures = XLSX.utils.sheet_to_csv(wsProcedures);
      const csvActivities = XLSX.utils.sheet_to_csv(wsActivities);
      const csvData = `Patients Data:\n${csvPatients}\n\nProcedures Data:\n${csvProcedures}\n\nActivities Data:\n${csvActivities}`;
      const csvLink = document.createElement('a');
      const blob = new Blob([csvData], { type: 'text/csv' });
      csvLink.href = URL.createObjectURL(blob);
      csvLink.setAttribute('download', `CombinedData.csv`);
      csvLink.click();
    } else {
      XLSX.writeFile(wb, `CombinedData.${fileFormat}`);
    }
  };


  return (
    <View style={styles.mainContainer}>
      <View style={styles.reportContainer}>
        <View style={styles.reportContent}>
          <Text style={{ fontSize: 16 }}>Save As : </Text>
          <Picker
                selectedValue={fileFormat}
                style={styles.pickerStyle}
                onValueChange={(itemValue, itemIndex) => setFileFormat(itemValue)}
            >
            <Picker.Item label="CSV" value="csv" />
            <Picker.Item label="XLS" value="xls" />
            <Picker.Item label="XLSX" value="xlsx" />
          </Picker>

          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <AntDesign name="download" size={16} color="white" />
            <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reportContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 121,
    width: 766,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 20
  },
  reportContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3', // สีฟ้า
    padding: 5,
    borderRadius: 16,
    marginLeft: 20
  },
  downloadText: {
      marginLeft: 5, // เพิ่มระยะห่างระหว่างไอคอนกับข้อความ
      marginRight: 10,
      color: 'white', // สีข้อความเป็นสีขาว
  },
  pickerStyle: {
    textAlign: 'center', // ปรับแต่งให้ข้อความอยู่ตรงกลาง
    shadowColor: '#000',
    marginLeft: 10,
    width: 130,
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainContainer: {
    flex: 1, 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5' 
  },
});
export default ReportScreen;