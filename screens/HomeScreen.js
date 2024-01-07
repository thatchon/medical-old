import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../redux/action';

const HomeScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user);
  const role = useSelector((state) => state.role);
  const dispatch = useDispatch();

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = ({ window }) => {
      setDimensions(window);
    };

    Dimensions.addEventListener('change', onChange);
    return () => Dimensions.removeEventListener('change', onChange);
  }, []);

  const isLandscape = dimensions.width > dimensions.height;

  const responsiveWidth = isLandscape ? dimensions.width * 0.5 : dimensions.width * 0.9;
  const responsiveHeight = isLandscape ? dimensions.height * 0.5 : dimensions.height * 0.7;
  const imageDimension = isLandscape ? dimensions.width * 0.15 : dimensions.width * 0.3;

  // ปรับขนาดตัวอักษรตามขนาดหน้าจอ
  const textSize = dimensions.width < 400 ? 24 : (dimensions.width < 600 ? 24 : 30);
  const buttonTextSize = dimensions.width < 400 ? 24 : (dimensions.width < 600 ? 24 : 28);

  const handleLogout = () => {
    dispatch(clearUser());
    navigation.navigate('SelectRole');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.newBox, { width: responsiveWidth, height: responsiveHeight }]}>
        <Image
          style={[styles.image, { width: imageDimension, height: imageDimension }]}
          source={require("../assets/doctor.png")}
          resizeMode={"contain"}
        />
        <Text style={[styles.text, { fontSize: textSize }]}>{user.displayName}</Text>
        <Text style={{ fontSize: textSize, color: '#00046D' }}>{role === 'student' ? 'นักศึกษาแพทย์' : role === 'teacher' ? 'อาจารย์แพทย์' : role}</Text>
        {role === 'teacher' && (
          <Text style={{ fontSize: textSize, color: '#00046D' }}>Department: [{user.department}]</Text>
        )}
      </View>
      <View style={styles.bottomBox}>
        {role !== 'teacher' && (
          <TouchableOpacity
            style={[styles.button, styles.portfolioButton]}
            onPress={() => navigation.navigate('Portfolio')}
          >
            <Text style={[styles.buttonText, { fontSize: buttonTextSize }]}>My Portfolio</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, { fontSize: buttonTextSize }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  newBox: {
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    borderRadius: 8
  },
  text: {
    color: '#00046D',
    fontWeight: 'bold',
    marginTop: 20
  },
  button: {
    height: 63,
    width: 216,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginBottom: 10
  },
  portfolioButton: {
    backgroundColor: '#05AB9F',
  },
  logoutButton: {
    backgroundColor: 'red',
  },
  image: {
    marginBottom: 10
  },
  bottomBox: {
    marginTop: 20,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white'
  }
});

export default HomeScreen;
