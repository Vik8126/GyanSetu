import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AntDesign,
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  Foundation,
  Entypo,
} from "@expo/vector-icons";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");


const TextMain = () => {
  const webViewRefs = useRef<(WebView | null)[]>([]);
  const insets = useSafeAreaInsets();
  const justSelectedRef = useRef(false);
  const scrollViewRef = useRef<FlatList>(null);

  const [selectedText, setSelectedText] = useState("");
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pageHigh, setpageHigh] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [fromSlider, setFromSlider] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!scrolling) {
      const index = viewableItems[0]?.index ?? 0;
      setCurrentPage(index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToPage = (index: number) => {
    flatListRef.current?.scrollToOffset({ offset: index * width, animated: true });
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
    setTimeout(() => setFromSlider(false), 500); 
  };


  const toggleMenu = () => {
    if (menuVisible) {
      // Slide down to hide
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      // Slide up to show
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const menuTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0], // Adjust this value based on how much you want it to slide up
  });
  const [selectionPosition, setSelectionPosition] = useState({
    x: 100,
    y: 100,
  });
  const [sliderValue, setSliderValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const DarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const loremText =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(120);
  const MAX_CHARS = 600;

  const splitTextIntoPages = (text: string, maxCharsPerPage: number) => {
    const pages = [];
    let currentIndex = 0;
    const totalLength = text.length;

    while (currentIndex < totalLength) {
      const slice = text.slice(currentIndex, currentIndex + maxCharsPerPage);
      pages.push(slice);
      currentIndex += maxCharsPerPage;
    }

    return pages;
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    // Add a small delay to ensure the state has updated before injecting JavaScript
    setTimeout(() => {
      webViewRefs.current.forEach((ref) => {
        if (ref) {
          ref.injectJavaScript(getInjectedJavaScript(newMode));
        }
      });
    }, 100);
  };

  const pages = splitTextIntoPages(loremText, MAX_CHARS);

  const pagesCount = pages.length;

  const getInjectedJavaScript = (isDark) => `
  (function() {
    const style = document.createElement('style');
    style.innerHTML = \`
      ::selection {
        background: #FF5722;
        color: white;
      }
      body {
        -webkit-user-select: text;
        user-select: text;
        -webkit-touch-callout: none;
        margin: 0;
        padding: 20px;
        font-size: 18px;
        line-height: 1.6;
        color: ${isDark ? "#fff" : "#000"};
        background-color: ${isDark ? "#000" : "#fff"};
      }
    \`;
    document.head.appendChild(style);

    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });

    document.addEventListener("selectionchange", function () {
      const selection = window.getSelection();
      const selectedText = selection.toString();

      if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const pos = {
          x: rect.left + (rect.width / 2),
          y: rect.top,
        };

        window.ReactNativeWebView.postMessage(
          JSON.stringify({ text: selectedText, x: pos.x, y: pos.y })
        );
      }
    });

    true; // required for Android
  })();
`;

  const handleMessage = (event: any) => {
    try {
      const { text, y } = JSON.parse(event.nativeEvent.data);
      const { width: screenWidth } = Dimensions.get("window");
      const toolbarX = screenWidth / 3;
      const toolbarHeight = -80;

      setSelectedText(text);
      setSelectionPosition({ x: toolbarX, y: y - toolbarHeight });
      setSelectionVisible(true);
    } catch (err) {
      console.error("Invalid message from WebView:", err);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#000" : "#fff"} // or your theme bg
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="search" size={24} color="#FF5722" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="more-vert" size={24} color="#FF5722" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={scrollViewRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <WebView
            ref={(ref) => {
              if (ref) {
                webViewRefs.current[index] = ref;
                ref.injectJavaScript(getInjectedJavaScript(isDarkMode));
              }
            }}
            originWhitelist={["*"]}
            source={{
              html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                         body {
                          transition: background-color 0s, color 0s;
                         }
                     </style>
                    </head>
                    <body>${item}</body>
                    </html>
              `,
            }}
            style={{
              width,
              flex: 1,
              backgroundColor: isDarkMode ? "#000" : "#fff",
            }}
            injectedJavaScript={getInjectedJavaScript(isDarkMode)}
            onMessage={handleMessage}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            onLoadEnd={() => {
              if (webViewRefs.current[index]) {
                webViewRefs.current[index].injectJavaScript(
                  getInjectedJavaScript(isDarkMode)
                );
              }
            }}
          />
        )}
      />

      <View style={styles.bottomInfo}>
        <Text
          style={isDarkMode ? styles.currentHeadColor : styles.currentHeading}
        >
          Heading of current content
        </Text>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={pagesCount - 1}
            value={sliderValue}
            step={1}
            onValueChange={(val) => {
              setSliderValue(val);
              scrollViewRef.current?.scrollToOffset({
                offset: val * width,
                animated: true,
              });
              setCurrentPage(val);
              setSelectionVisible(false);
            }}
            minimumTrackTintColor="#FF5722"
            maximumTrackTintColor="#DDDDDD"
            thumbTintColor="#FF5722"
          />
          <View style={styles.progressInfo}>
            <Text style={styles.percentText}>
              {(((sliderValue + 1) / pagesCount) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.pagesText}>
              {pagesCount - sliderValue - 1} pages left
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={toggleMenu} style={styles.toolbarButton}>
          <Feather name="menu" size={24} color="#CC3333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Feather name="type" size={24} color="#CC3333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleDarkMode} style={styles.toolbarButton}>
          <Ionicons
            name={isDarkMode ? "sunny" : "moon"}
            size={24}
            color={isDarkMode ? "#CC3333" : "#CC3333"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarButton}>
          <FontAwesome5 name="clipboard-list" size={24} color="#CC3333" />
        </TouchableOpacity>
      </View>

      {selectionVisible && (
        <View
          style={[
            styles.selectionModal,
            {
              left: selectionPosition.x - 80,
              top: selectionPosition.y - (Platform.OS === "ios" ? 50 : 80),
            },
          ]}
        >
          <TouchableOpacity style={styles.selectionOption}>
            <FontAwesome5 name="highlighter" size={13} color="#fff" />
            <Text style={styles.selectionText}>Highlight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionOption}>
            <Foundation name="clipboard-notes" size={13} color="#fff" />
            <Text style={styles.selectionText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionOption}>
            <MaterialIcons name="translate" size={13} color="#fff" />
            <Text style={styles.selectionText}>Translate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionOption}>
            <Entypo name="share" size={13} color="#fff" />
            <Text style={styles.selectionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionOption}>
            <Feather name="copy" size={13} color="#fff" />
            <Text style={styles.selectionText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionOption}>
            <MaterialIcons name="error-outline" size={13} color="#fff" />
            <Text style={styles.selectionText}>Error</Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.selectionOption}
            onPress={() => {
              setSelectionVisible(false);
              setSelectedText("");

              // Inject JS to clear selection
              webViewRefs.current[currentPage]?.injectJavaScript(`
                   if (window.getSelection) {
                   const sel = window.getSelection();
                   if (sel.removeAllRanges) sel.removeAllRanges();
                    }
                    true;
                `);
            }}
          >
            <Ionicons name="close-circle-outline" size={13} color="#fff" />
            <Text style={styles.selectionText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateY: menuTranslateY }],
              backgroundColor: isDarkMode ? "#333" : "#fff",
            },
          ]}
        >
          <View style={styles.menuHeader}>
            <Text
              style={[
                styles.menuTitle,
                { color: isDarkMode ? "#fff" : "#000" },
              ]}
            >
              Content
            </Text>
            <TouchableOpacity onPress={toggleMenu}>
              <AntDesign
                name="close"
                size={24}
                color={isDarkMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: pagesCount }, (_, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuCont}
                onPress={() => {
                  scrollViewRef.current?.scrollToOffset({
                    offset: i * width,
                    animated: true,
                  });
                  setSliderValue(i);
                  setCurrentPage(i);
                  setMenuVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.menuItem,
                    { color: isDarkMode ? "#fff" : "#000" },
                  ]}
                >
                  Heading of current content {i + 1}
                </Text>
                <Text
                  style={[
                    styles.progressText,
                    { color: isDarkMode ? "#fff" : "#000" },
                  ]}
                >
                  {(((i + 1) / pagesCount) * 100).toFixed(0)}%
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF5722",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRight: { flexDirection: "row" },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  bottomInfo: { paddingHorizontal: 20, paddingTop: 10 },
  currentHeading: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  currentHeadColor: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  progressContainer: { marginBottom: 10 },
  slider: { width: "100%", height: 40 },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -10,
  },
  percentText: { color: "#999999" },
  pagesText: { color: "#999999" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  toolbarButton: { padding: 10 },
  selectionModal: {
    position: "absolute",
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 999,
  },
  selectionOption: { padding: 6, alignItems: "center" },
  selectionText: {
    fontSize: 9,
    marginTop: 5,
    textAlign: "center",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%", // Adjust height as needed
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 0,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  menuContent: {
    flex: 1,
  },
  menuItem: {
    fontSize: 20,
    paddingVertical: 12,
  },
  menuCont: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBarContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  progressBar: {
    height: 6,
    width: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF5722",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default TextMain;
