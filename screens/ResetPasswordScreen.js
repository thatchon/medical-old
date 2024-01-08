import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import validator from 'validator';

const ResetPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);

  const handleSendResetLink = () => {
    // ตรวจสอบว่าอีเมลว่างหรือไม่
    if (email.trim() === '') {
      setErrorMessage('กรุณากรอกอีเมล');
      return;
    }
    // ตรวจสอบ format ของอีเมล
    if (!validator.isEmail(email)) {
      setErrorMessage('กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง');
      return;
    }

    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setIsResetSuccessful(true);
        setErrorMessage('');
      })
      .catch((error) => {
        setIsResetSuccessful(false);
        setErrorMessage('ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่าน: ' + error.message);
      });
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
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleSendResetLink}
      >
        <Text style={styles.buttonText}>Reset your password</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
      {isResetSuccessful ? (
        <Text style={styles.successMessage}>ลิงก์รีเซ็ตรหัสผ่านได้ถูกส่งไปยังอีเมลของคุณ</Text>
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