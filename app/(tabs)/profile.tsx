import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Common medical conditions
const COMMON_CONDITIONS = [
    'Diabetes Type 1',
    'Diabetes Type 2',
    'High Blood Pressure',
    'Heart Disease',
    'Asthma',
    'Arthritis',
    'Depression',
    'Anxiety',
    'High Cholesterol',
    'Thyroid Disease',
    'COPD',
    'Kidney Disease',
    'Liver Disease',
    'Epilepsy',
    'Migraine',
    'Osteoporosis',
    'Cancer',
    'Autoimmune Disease',
];

// Common allergies
const COMMON_ALLERGIES = [
    'Penicillin',
    'Aspirin',
    'Ibuprofen',
    'Sulfa drugs',
    'Peanuts',
    'Tree nuts',
    'Shellfish',
    'Fish',
    'Milk',
    'Eggs',
    'Soy',
    'Wheat',
    'Bee stings',
    'Latex',
    'Pet dander',
    'Pollen',
    'Dust mites',
    'Mold',
];

interface UserProfile {
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    height: number; // in cm
    weight: number; // in kg
    bloodType: string;
    allergies: string[];
    medicalConditions: string[];
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    doctor: {
        name: string;
        phone: string;
        specialty: string;
    };
}

const defaultProfile: UserProfile = {
    firstName: '',
    lastName: '',
    age: 0,
    gender: 'Not specified',
    height: 0,
    weight: 0,
    bloodType: 'Not specified',
    allergies: [],
    medicalConditions: [],
    emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
    },
    doctor: {
        name: '',
        phone: '',
        specialty: '',
    },
};

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserProfile>(defaultProfile);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [medicalFormVisible, setMedicalFormVisible] = useState(false);
    const [editingField, setEditingField] = useState<string>('');
    const [editValue, setEditValue] = useState<string>('');
    const [newCondition, setNewCondition] = useState<string>('');
    const [newAllergy, setNewAllergy] = useState<string>('');
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const savedProfile = await AsyncStorage.getItem('userProfile');
            if (savedProfile) {
                setProfile(JSON.parse(savedProfile));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const saveProfile = async (updatedProfile: UserProfile) => {
        try {
            await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            setProfile(updatedProfile);
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    const handleEdit = (field: string, currentValue: string) => {
        setEditingField(field);
        setEditValue(currentValue);
        setEditModalVisible(true);
    }; const handleSaveEdit = () => {
        const updatedProfile = { ...profile };

        switch (editingField) {
            case 'firstName':
                updatedProfile.firstName = editValue;
                break;
            case 'lastName':
                updatedProfile.lastName = editValue;
                break;
            case 'age':
                updatedProfile.age = parseInt(editValue) || 0;
                break;
            case 'gender':
                updatedProfile.gender = editValue;
                break;
            case 'height':
                updatedProfile.height = parseFloat(editValue) || 0;
                break;
            case 'weight':
                updatedProfile.weight = parseFloat(editValue) || 0;
                break;
            case 'bloodType':
                updatedProfile.bloodType = editValue;
                break;
            case 'emergencyContactName':
                updatedProfile.emergencyContact.name = editValue;
                break;
            case 'emergencyContactPhone':
                updatedProfile.emergencyContact.phone = editValue;
                break;
            case 'emergencyContactRelationship':
                updatedProfile.emergencyContact.relationship = editValue;
                break;
            case 'doctorName':
                updatedProfile.doctor.name = editValue;
                break;
            case 'doctorPhone':
                updatedProfile.doctor.phone = editValue;
                break;
            case 'doctorSpecialty':
                updatedProfile.doctor.specialty = editValue;
                break;
        }

        saveProfile(updatedProfile);
        setEditModalVisible(false);
    };

    const handleOpenMedicalForm = () => {
        setSelectedConditions([...profile.medicalConditions]);
        setSelectedAllergies([...profile.allergies]);
        setNewCondition('');
        setNewAllergy('');
        setMedicalFormVisible(true);
    };

    const handleSaveMedicalForm = () => {
        const updatedProfile = { ...profile };
        updatedProfile.medicalConditions = [...selectedConditions];
        updatedProfile.allergies = [...selectedAllergies];

        // Add custom conditions and allergies if entered
        if (newCondition.trim() && !selectedConditions.includes(newCondition.trim())) {
            updatedProfile.medicalConditions.push(newCondition.trim());
        }
        if (newAllergy.trim() && !selectedAllergies.includes(newAllergy.trim())) {
            updatedProfile.allergies.push(newAllergy.trim());
        }

        saveProfile(updatedProfile);
        setMedicalFormVisible(false);
    };

    const toggleCondition = (condition: string) => {
        setSelectedConditions(prev =>
            prev.includes(condition)
                ? prev.filter(c => c !== condition)
                : [...prev, condition]
        );
    };

    const toggleAllergy = (allergy: string) => {
        setSelectedAllergies(prev =>
            prev.includes(allergy)
                ? prev.filter(a => a !== allergy)
                : [...prev, allergy]
        );
    };

    const removeCondition = (condition: string) => {
        const updatedProfile = { ...profile };
        updatedProfile.medicalConditions = profile.medicalConditions.filter(c => c !== condition);
        saveProfile(updatedProfile);
    };

    const removeAllergy = (allergy: string) => {
        const updatedProfile = { ...profile };
        updatedProfile.allergies = profile.allergies.filter(a => a !== allergy);
        saveProfile(updatedProfile);
    };

    const calculateBMI = () => {
        if (profile.height > 0 && profile.weight > 0) {
            const heightInMeters = profile.height / 100;
            const bmi = profile.weight / (heightInMeters * heightInMeters);
            return bmi.toFixed(1);
        }
        return 'N/A';
    };

    const getBMICategory = (bmi: string) => {
        const bmiValue = parseFloat(bmi);
        if (bmi === 'N/A') return '';
        if (bmiValue < 18.5) return 'Underweight';
        if (bmiValue < 25) return 'Normal';
        if (bmiValue < 30) return 'Overweight';
        return 'Obese';
    };

    const ProfileCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.profileCard}>
            <Text style={styles.cardTitle}>{title}</Text>
            {children}
        </View>
    );

    const EditableField = ({
        label,
        value,
        field,
        icon,
        unit = ''
    }: {
        label: string;
        value: string;
        field: string;
        icon: string;
        unit?: string;
    }) => (
        <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => handleEdit(field, value)}
        >
            <View style={styles.fieldContent}>
                <Ionicons name={icon as any} size={20} color="#666" />
                <View style={styles.fieldText}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <Text style={styles.fieldValue}>
                        {value || 'Not set'} {unit}
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    const bmi = calculateBMI();
    const bmiCategory = getBMICategory(bmi);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={["#8E24AA", "#7B1FA2"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={60} color="white" />
                    </View>
                    <Text style={styles.userName}>
                        {profile.firstName && profile.lastName
                            ? `${profile.firstName} ${profile.lastName}`
                            : 'User Profile'
                        }
                    </Text>
                    {profile.age > 0 && (
                        <Text style={styles.userAge}>{profile.age} years old</Text>
                    )}
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Basic Information */}
                <ProfileCard title="Basic Information">
                    <EditableField
                        label="First Name"
                        value={profile.firstName}
                        field="firstName"
                        icon="person-outline"
                    />
                    <EditableField
                        label="Last Name"
                        value={profile.lastName}
                        field="lastName"
                        icon="person-outline"
                    />
                    <EditableField
                        label="Age"
                        value={profile.age.toString()}
                        field="age"
                        icon="calendar-outline"
                        unit="years"
                    />
                    <EditableField
                        label="Gender"
                        value={profile.gender}
                        field="gender"
                        icon="male-female-outline"
                    />
                </ProfileCard>

                {/* Physical Details */}
                <ProfileCard title="Physical Details">
                    <EditableField
                        label="Height"
                        value={profile.height.toString()}
                        field="height"
                        icon="resize-outline"
                        unit="cm"
                    />
                    <EditableField
                        label="Weight"
                        value={profile.weight.toString()}
                        field="weight"
                        icon="fitness-outline"
                        unit="kg"
                    />
                    <EditableField
                        label="Blood Type"
                        value={profile.bloodType}
                        field="bloodType"
                        icon="water-outline"
                    />

                    {/* BMI Display */}
                    {bmi !== 'N/A' && (
                        <View style={styles.bmiContainer}>
                            <Text style={styles.bmiLabel}>BMI</Text>
                            <Text style={styles.bmiValue}>{bmi}</Text>
                            <Text style={[
                                styles.bmiCategory,
                                {
                                    color:
                                        bmiCategory === 'Normal' ? '#4CAF50' :
                                            bmiCategory === 'Underweight' ? '#FF9800' :
                                                bmiCategory === 'Overweight' ? '#FF5722' : '#F44336'
                                }
                            ]}>
                                {bmiCategory}
                            </Text>
                        </View>
                    )}
                </ProfileCard>

                {/* Emergency Contact */}
                <ProfileCard title="Emergency Contact">
                    <EditableField
                        label="Name"
                        value={profile.emergencyContact.name}
                        field="emergencyContactName"
                        icon="call-outline"
                    />
                    <EditableField
                        label="Phone"
                        value={profile.emergencyContact.phone}
                        field="emergencyContactPhone"
                        icon="phone-portrait-outline"
                    />
                    <EditableField
                        label="Relationship"
                        value={profile.emergencyContact.relationship}
                        field="emergencyContactRelationship"
                        icon="heart-outline"
                    />
                </ProfileCard>

                {/* Doctor Information */}
                <ProfileCard title="Primary Doctor">
                    <EditableField
                        label="Name"
                        value={profile.doctor.name}
                        field="doctorName"
                        icon="medical-outline"
                    />
                    <EditableField
                        label="Phone"
                        value={profile.doctor.phone}
                        field="doctorPhone"
                        icon="call-outline"
                    />
                    <EditableField
                        label="Specialty"
                        value={profile.doctor.specialty}
                        field="doctorSpecialty"
                        icon="library-outline"
                    />
                </ProfileCard>

                {/* Medical Conditions */}
                <ProfileCard title="Medical Conditions & Allergies">
                    <View style={styles.medicalSection}>
                        <Text style={styles.medicalSectionTitle}>Conditions</Text>
                        {profile.medicalConditions.length > 0 ? (
                            profile.medicalConditions.map((condition, index) => (
                                <View key={index} style={styles.medicalItemContainer}>
                                    <Text style={styles.medicalItem}>• {condition}</Text>
                                    <TouchableOpacity
                                        onPress={() => removeCondition(condition)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="close-circle" size={18} color="#FF5252" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No medical conditions recorded</Text>
                        )}

                        <Text style={[styles.medicalSectionTitle, { marginTop: 15 }]}>Allergies</Text>
                        {profile.allergies.length > 0 ? (
                            profile.allergies.map((allergy, index) => (
                                <View key={index} style={styles.medicalItemContainer}>
                                    <Text style={styles.medicalItem}>• {allergy}</Text>
                                    <TouchableOpacity
                                        onPress={() => removeAllergy(allergy)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="close-circle" size={18} color="#FF5252" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No allergies recorded</Text>
                        )}

                        <TouchableOpacity style={styles.addButton} onPress={handleOpenMedicalForm}>
                            <Ionicons name="add-circle-outline" size={20} color="#8E24AA" />
                            <Text style={styles.addButtonText}>Add Medical Information</Text>
                        </TouchableOpacity>
                    </View>
                </ProfileCard>
            </View>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit {editingField}</Text>
                            <TouchableOpacity
                                onPress={() => setEditModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.editInput}
                            value={editValue}
                            onChangeText={setEditValue}
                            placeholder={`Enter ${editingField}`}
                            keyboardType={
                                editingField.includes('age') || editingField.includes('height') || editingField.includes('weight') || editingField.includes('phone')
                                    ? 'numeric'
                                    : 'default'
                            }
                            multiline={false}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Medical Form Modal */}
            <Modal
                visible={medicalFormVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setMedicalFormVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.medicalModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Medical Information</Text>
                            <TouchableOpacity
                                onPress={() => setMedicalFormVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.medicalFormScroll} showsVerticalScrollIndicator={false}>
                            {/* Medical Conditions Section */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Medical Conditions</Text>
                                <Text style={styles.formSectionSubtitle}>Select all that apply:</Text>

                                <View style={styles.checkboxContainer}>
                                    {COMMON_CONDITIONS.map((condition) => (
                                        <TouchableOpacity
                                            key={condition}
                                            style={styles.checkboxItem}
                                            onPress={() => toggleCondition(condition)}
                                        >
                                            <Ionicons
                                                name={selectedConditions.includes(condition) ? "checkbox" : "square-outline"}
                                                size={24}
                                                color={selectedConditions.includes(condition) ? "#8E24AA" : "#ccc"}
                                            />
                                            <Text style={styles.checkboxLabel}>{condition}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.customInputLabel}>Add custom condition:</Text>
                                <TextInput
                                    style={styles.customInput}
                                    value={newCondition}
                                    onChangeText={setNewCondition}
                                    placeholder="Enter a medical condition not listed above"
                                    multiline={false}
                                />
                            </View>

                            {/* Allergies Section */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Allergies</Text>
                                <Text style={styles.formSectionSubtitle}>Select all that apply:</Text>

                                <View style={styles.checkboxContainer}>
                                    {COMMON_ALLERGIES.map((allergy) => (
                                        <TouchableOpacity
                                            key={allergy}
                                            style={styles.checkboxItem}
                                            onPress={() => toggleAllergy(allergy)}
                                        >
                                            <Ionicons
                                                name={selectedAllergies.includes(allergy) ? "checkbox" : "square-outline"}
                                                size={24}
                                                color={selectedAllergies.includes(allergy) ? "#8E24AA" : "#ccc"}
                                            />
                                            <Text style={styles.checkboxLabel}>{allergy}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.customInputLabel}>Add custom allergy:</Text>
                                <TextInput
                                    style={styles.customInput}
                                    value={newAllergy}
                                    onChangeText={setNewAllergy}
                                    placeholder="Enter an allergy not listed above"
                                    multiline={false}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setMedicalFormVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveMedicalForm}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        alignItems: "center",
        paddingHorizontal: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    userName: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
        marginBottom: 5,
    },
    userAge: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
    },
    content: {
        flex: 1,
        paddingTop: 20,
        paddingBottom: 30,
    },
    profileCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 15,
    },
    fieldContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f0f0f0",
    },
    fieldContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    fieldText: {
        marginLeft: 12,
        flex: 1,
    },
    fieldLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 2,
    },
    fieldValue: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    bmiContainer: {
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
        alignItems: "center",
    },
    bmiLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    bmiValue: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
    },
    bmiCategory: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 5,
    },
    medicalSection: {
        marginTop: 5,
    },
    medicalSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    medicalItem: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
        lineHeight: 20,
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        fontStyle: "italic",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        paddingVertical: 10,
    },
    addButtonText: {
        color: "#8E24AA",
        fontWeight: "600",
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        width: width * 0.9,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    closeButton: {
        padding: 5,
    },
    editInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#f0f0f0",
    },
    saveButton: {
        backgroundColor: "#8E24AA",
    },
    cancelButtonText: {
        color: "#666",
        fontWeight: "600",
    },
    saveButtonText: {
        color: "white",
        fontWeight: "600",
    },
    // Medical form specific styles
    medicalItemContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    removeButton: {
        padding: 4,
    },
    medicalModalContent: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        width: width * 0.95,
        maxHeight: "90%",
    },
    medicalFormScroll: {
        maxHeight: 500,
    },
    formSection: {
        marginBottom: 25,
    },
    formSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 8,
    },
    formSectionSubtitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 15,
    },
    checkboxContainer: {
        marginBottom: 15,
    },
    checkboxItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    checkboxLabel: {
        fontSize: 16,
        color: "#333",
        marginLeft: 12,
        flex: 1,
    },
    customInputLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
        fontWeight: "600",
    },
    customInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
    },
});
