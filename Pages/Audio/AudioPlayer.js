import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";

const lyrics = [
  {
    time: 0,
    text: "The stale smell of old beer lingers.",
  },
  {
    time: 4000,
    text: "It takes heat to bring out the odor.",
  },
  {
    time: 7000,
    text: "A cold dip restores health and zest.",
  },
  {
    time: 10000,
    text: "A salt pickle tastes fine with ham.",
  },
  {
    time: 12000,
    text: "Tacos al pastor are my favorite.",
  },
  {
    time: 15000,
    text: "A zestful food is the hot cross bun.",
  },
];

const songURI = require("../Audio/harvard.wav");

export default function AudioPlayer() {
   const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [activeLyricIndex, setActiveLyricIndex] = useState(0);
  
    const playSound = async () => {
      if (sound) {
        await sound.unloadAsync();
      }
  
      const { sound: newSound } = await Audio.Sound.createAsync(
        songURI,
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    };
  
    const onPlaybackStatusUpdate = (status) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying);
        setDuration(status.durationMillis);
        setPosition(status.positionMillis);
        updateActiveLyric(status.positionMillis);
      }
    };
  
    const updateActiveLyric = (currentTime) => {
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].time) {
          setActiveLyricIndex(i);
          break;
        }
      }
    };
  
    const togglePlayPause = async () => {
      if (sound) {
        isPlaying ? await sound.pauseAsync() : await sound.playAsync();
      }
    };
  
    const onSliderValueChange = async (value) => {
      if (sound) {
        await sound.setPositionAsync(value);
      }
    };
  
    const formatTime = (ms) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };
  
    useEffect(() => {
      playSound();
      return () => {
        sound && sound.unloadAsync();
      };
    }, []);
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎶 Song with Lyrics Sync</Text>
  
        <ScrollView style={styles.lyricsBox}>
          {lyrics.map((line, index) => (
            <Text
              key={index}
              style={[
                styles.lyricLine,
                index === activeLyricIndex && styles.activeLyric,
              ]}
            >
              {line.text}
            </Text>
          ))}
        </ScrollView>
  
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={onSliderValueChange}
        />
        <View style={styles.timeContainer}>
          <Text>{formatTime(position)}</Text>
          <Text>{formatTime(duration)}</Text>
        </View>
  
        <View style={styles.controls}>
          <Button
            title={isPlaying ? "⏸ Pause" : "▶️ Play"}
            onPress={togglePlayPause}
          />
        </View>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 80,
      paddingHorizontal: 20,
      backgroundColor: "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: "center",
    },
    lyricsBox: {
      height: 200,
      marginBottom: 20,
      backgroundColor: "#f5f5f5",
      padding: 10,
      borderRadius: 10,
    },
    lyricLine: {
      fontSize: 16,
      marginVertical: 4,
      color: "#444",
    },
    activeLyric: {
      color: "#1e90ff",
      fontWeight: "bold",
      fontSize: 18,
    },
    slider: {
      width: "100%",
      height: 40,
    },
    timeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    controls: {
      flexDirection: "row",
      justifyContent: "center",
    },
  });