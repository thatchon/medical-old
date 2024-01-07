import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import validator from 'validator';

const ResetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState(''); // เพิ่มการกรอกรหัสผ่านเก่า
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);

  const handleChangePassword = () => {
    // ตรวจสอบว่า field ว่างหรือไม่
    if (email.trim() === '') {
      setErrorMessage('กรุณากรอกอีเมล');
      return;
    }
    // ตรวจสอบ format ของอีเมล
    if (!validator.isEmail(email)) {
      setErrorMessage('กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง');
      return;
    }
    if (oldPassword.trim() === '') {
      setErrorMessage('กรุณากรอกรหัสผ่านเก่า');
      return;
    }
    if (newPassword.trim() === '') {
      setErrorMessage('กรุณากรอกรหัสผ่านใหม่');
      return;
    }
  
    // ตรวจสอบความยาวของรหัสผ่าน
    if (newPassword.length < 6) {
      setErrorMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
  
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(email, oldPassword);
      reauthenticateWithCredential(user, credential)
        .then(() => {
          updatePassword(user, newPassword)
            .then(() => {
              setIsResetSuccessful(true);
              setErrorMessage('');
              // navigation.navigate('SelectRole');
            })
            .catch((error) => {
              setIsResetSuccessful(false);
              switch (error.code) {
                case 'auth/weak-password':
                  setErrorMessage('รหัสผ่านใหม่สั้นเกินไป โปรดใช้รหัสผ่านที่ยาวกว่า');
                  break;
                default:
                  setErrorMessage('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: ' + error.message);
                  break;
              }
            });
        })
        .catch((error) => {
          setIsResetSuccessful(false);
          switch (error.code) {
            case 'auth/user-not-found':
              setErrorMessage('ไม่มีอีเมลนี้อยู่ในระบบ');
              break;
            case 'auth/wrong-password':
              setErrorMessage('รหัสผ่านเก่าไม่ถูกต้อง');
              break;
            default:
              setErrorMessage('เกิดข้อผิดพลาดในการยืนยันรหัสผ่านเก่า: ' + error.message);
              break;
          }
        });
    } else {
      setErrorMessage('ผู้ใช้ไม่ได้เข้าสู่ระบบ');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>เปลี่ยนรหัสผ่าน</Text>
      <TextInput
        placeholder="อีเมล"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="รหัสผ่านเก่า"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="รหัสผ่านใหม่"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleChangePassword}
      >
        <Text style={styles.buttonText}>ยืนยัน</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
      {isResetSuccessful ? (
        <Text style={styles.successMessage}>เปลี่ยนรหัสผ่านสำเร็จ!</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 36,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
  },
  resetButton: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: 'gray',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
  },
  errorMessage: {
    color: 'red',
    marginTop: 10,
  },
  successMessage: {
    color: 'green',
    marginTop: 10,
  },
});

export default ResetPasswordScreen;
