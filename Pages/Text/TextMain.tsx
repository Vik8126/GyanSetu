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
  TouchableWithoutFeedback,
  Keyboard,
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
  const [selectionPosition, setSelectionPosition] = useState({
    x: 100,
    y: 100,
  });
  const [sliderValue, setSliderValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const loremText =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(100);
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

  const pages = splitTextIntoPages(loremText, MAX_CHARS);
  const pagesCount = pages.length;

  const injectedJavaScript = `
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
      color: #000;
    }
  \`;
  document.head.appendChild(style);
  document.addEventListener('contextmenu', e => e.preventDefault());

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
  true;
`;

  const handleMessage = (event: any) => {
  try {
    const { text, y } = JSON.parse(event.nativeEvent.data);
    const { width: screenWidth } = Dimensions.get("window");

    const toolbarX = screenWidth / 3; // Center of screen
    const toolbarHeight = -80;

    setSelectedText(text);
    setSelectionPosition({ x: toolbarX, y: y - toolbarHeight });
    setSelectionVisible(true);
  } catch (err) {
    console.error("Invalid message from WebView:", err);
  }
};


  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

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
        keyExtractor={(_, index) => `page-${index}`}
        onMomentumScrollEnd={(event) => {
          const pageIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setSliderValue(pageIndex);
          setCurrentPage(pageIndex);
          setSelectionVisible(false);
        }}
        renderItem={({ item, index }) => (
          <WebView
            ref={(ref) => (webViewRefs.current[index] = ref)}
            originWhitelist={["*"]}
            source={{
              html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    font-size: 18px;
                    line-height: 1.6;
                    padding: 16px;
                    color: #000;
                    background-color: #fff;
                  }
                </style>
              </head>
              <body>${item}</body>
              </html>
              `,
            }}
            style={{ width, flex: 1 }}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleMessage}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />
        )}
      />

      <View style={styles.bottomInfo}>
        <Text style={styles.currentHeading}>Heading of current content</Text>
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
        <TouchableOpacity style={styles.toolbarButton}>
          <Feather name="menu" size={24} color="#CC3333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Feather name="type" size={24} color="#CC3333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Ionicons name="moon" size={24} color="#CC3333" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
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
});

export default TextMain;
