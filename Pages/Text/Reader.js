import React, { useRef, useState } from "react";
import {
  View,
  FlatList,
  Text,
  Dimensions,
  StyleSheet,
  Slider,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

const { width } = Dimensions.get("window");

const DATA = Array.from({ length: 10 }, (_, i) => `Page ${i + 1}`);

export default function Reader() {
  const flatListRef = useRef < FlatList > null;
  const [currentPage, setCurrentPage] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [fromSlider, setFromSlider] = useState(false);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!scrolling) {
      const index = viewableItems[0]?.index ?? 0;
      setCurrentPage(index);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const scrollToPage = (index: number) => {
    flatListRef.current?.scrollToOffset({
      offset: index * width,
      animated: true,
    });
  };

  const handleScrollBegin = () => {
    setScrolling(true);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrolling(false);
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentPage(index);
  };

  const handleSliderChange = (value: number) => {
    const index = Math.round(value);
    setFromSlider(true);
    setCurrentPage(index);
    scrollToPage(index);
    setTimeout(() => setFromSlider(false), 500); // throttle to prevent fight between slider and FlatList
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={DATA}
        ref={flatListRef}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <Text style={styles.pageText}>{item}</Text>
          </View>
        )}
      />

      <View style={styles.sliderContainer}>
        <Slider
          style={{ width: "100%" }}
          minimumValue={0}
          maximumValue={DATA.length - 1}
          step={1}
          value={currentPage}
          onValueChange={handleSliderChange}
        />
        <Text style={styles.pageIndicator}>Page: {currentPage + 1}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  page: { width, justifyContent: "center", alignItems: "center" },
  pageText: { fontSize: 28, fontWeight: "bold" },
  sliderContainer: {
    padding: 16,
    backgroundColor: "#f0f0f0",
  },
  pageIndicator: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 16,
    color: "#333",
  },
});
