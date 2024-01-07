import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import { setRole } from '../redux/action'; // ตรงนี้ต้องแก้ import จาก reducers เป็น action

const SelectRoleScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const dispatch = useDispatch();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', onChange);
    return () => {
      Dimensions.removeEventListener('change', onChange);
    };
  }, []);

  const handleRoleToggle = (role) => {
    if (selectedRole === role) {
      setSelectedRole(null);
    } else {
      setSelectedRole(role);
    }
  };

  const handleContinue = () => {
    if (selectedRole) {
      dispatch(setRole(selectedRole));
      navigation.navigate('Login', { role: selectedRole });
    }
  };

  const fontSizeDynamic = screenWidth < 768 ? 37 : 52;
  const roleButtonTextSize = screenWidth < 768 ? 20 : 48;
  const continueButtonTextSize = screenWidth < 768 ? 22 : 28;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>E-LogBook</Text>
      </View>
      <View style={styles.container}>
        <Text style={[styles.titleText, { fontSize: fontSizeDynamic }]}>เลือกหน้าที่ของคุณ</Text>

        <TouchableOpacity
          style={[
            styles.roleButton,
            {
              backgroundColor: selectedRole === 'student' ? 'blue' : 'gray',
            },
          ]}
          onPress={() => handleRoleToggle('student')}
        >
          <Text
            style={[
              styles.roleButtonText,
              {
                color: selectedRole === 'student' ? 'white' : '#0500FF',
              },
            ]}
          >
            นักศึกษาแพทย์
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            {
              backgroundColor: selectedRole === 'teacher' ? 'blue' : 'gray',
            },
          ]}
          onPress={() => handleRoleToggle('teacher')}
        >
          <Text
            style={[
              styles.roleButtonText,
              {
                color: selectedRole === 'teacher' ? 'white' : '#0500FF',
              },
            ]}
          >
            อาจารย์
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            {
              backgroundColor: selectedRole === 'staff' ? 'blue' : 'gray',
            },
          ]}
          onPress={() => handleRoleToggle('staff')}
        >
          <Text
            style={[
              styles.roleButtonText,
              {
                color: selectedRole === 'staff' ? 'white' : '#0500FF',
              },
            ]}
          >
            เจ้าหน้าที่
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedRole ? '#05AB9F' : 'gray',
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={[styles.continueButtonText, { fontSize: continueButtonTextSize }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'between',
    alignItems: 'center',
  },
  banner: {
    backgroundColor: '#05AB9F', 
    width: '100%',
    height: 100, 
    justifyContent: 'center',
    alignItems: 'center',
    // flex: 1,
    
  },
  bannerText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  titleText: {
    color: 'black',
    fontWeight: 'bold',
    padding: 20,
  },
  roleButton: {
    height: 80,
    width: 340,
    marginTop: 50,
    borderRadius: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 48,
  },
  continueButton: {
    height: 63,
    width: 216,
    marginTop: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  continueButtonText: {
    color: 'white',
  },
});

export default SelectRoleScreen;