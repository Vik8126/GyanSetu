import React, { useState } from "react";
import { View, Modal, StyleSheet, Text, Pressable, TextInput } from "react-native";
import {
  AntDesign,
  Entypo,
} from "@expo/vector-icons";

export default function NotesModal({ setModalVisible, modalVisible, selectedText }) {
  return (
    <Modal animationType="slide" transparent={true} visible={modalVisible}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Pressable onPress={() => setModalVisible(!modalVisible)}>
              <Entypo name="cross" size={28} color="blue" />
            </Pressable>
            <AntDesign name="check" size={24} color="blue" />
          </View>
          <View>
            <Text style={styles.modalText}>{selectedText}</Text>
          </View>
          <TextInput
            editable
            multiline
            numberOfLines={20}
            maxLength={400}
            placeholder="kindly share your notes in few lines..."
          ></TextInput>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    fontSize: 25,
    fontWeight: "600",
    backgroundColor: "orange",
    width: "wrap-content",
    alignSelf: "flex-start",
  },
});