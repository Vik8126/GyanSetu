import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

const PDFReader = () => {
  const webviewRef = useRef(null);
  const [extractedText, setExtractedText] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadImageAsBase64();
  }, []);

  const loadImageAsBase64 = async () => {
    try {
      const asset = Asset.fromModule(require("../assets/ScanCopyImg.png"));
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js"></script>
  <style>
      body { font-family: sans-serif; text-align: center; margin: 0; position: relative; }
      img { max-width: 100%; display: block; margin: auto; margin-top: 10px; }
      #imageContainer { position: relative; display: inline-block; }
      #cropBox {
        position: absolute;
        border: 2px dashed red;
        cursor: move;
        width: 100px;
        height: 100px;
        top: 50px;
        left: 50px;
        touch-action: none;
      }
      .resize-handle {
        position: absolute;
        width: 10px;
        height: 10px;
        right: 0;
        bottom: 0;
        background: red;
        cursor: nwse-resize;
        touch-action: none;
      }
  </style>
  <title></title>
</head>
<body>
  <h3>Image:</h3>
  <div id="imageContainer">
    <img id="image" src="data:image/jpg;base64,${base64}" alt="jpg;base64,${base64}">
    <div id="cropBox">
      <div class="resize-handle"></div>
    </div>
  </div>
  <script>
      const cropBox = document.getElementById("cropBox");
      const resizeHandle = cropBox.querySelector(".resize-handle");
      const imageContainer = document.getElementById("imageContainer");
      const image = document.getElementById("image");
      
      let isDragging = false;
      let isResizing = false;
      let startX, startY, startWidth, startHeight, startLeft, startTop;
      
      // Touch and mouse event handlers for dragging
      cropBox.addEventListener("mousedown", startDrag);
      cropBox.addEventListener("touchstart", startDrag, { passive: false });
      
      // Touch and mouse event handlers for resizing
      resizeHandle.addEventListener("mousedown", startResize);
      resizeHandle.addEventListener("touchstart", startResize, { passive: false });
      
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("touchmove", handleMove, { passive: false });
      
      document.addEventListener("mouseup", stopDrag);
      document.addEventListener("touchend", stopDrag);
      
      function startDrag(e) {
        if (e.target === resizeHandle) return;
        
        e.preventDefault();
        isDragging = true;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        startX = clientX;
        startY = clientY;
        startLeft = parseInt(cropBox.style.left, 10) || 0;
        startTop = parseInt(cropBox.style.top, 10) || 0;
      }
      
      function startResize(e) {
        e.preventDefault();
        isResizing = true;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        startX = clientX;
        startY = clientY;
        startWidth = parseInt(cropBox.style.width, 10) || cropBox.offsetWidth;
        startHeight = parseInt(cropBox.style.height, 10) || cropBox.offsetHeight;
      }
      
      function handleMove(e) {
        if (!isDragging && !isResizing) return;
        
        e.preventDefault();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        if (isDragging) {
          let newLeft = startLeft + dx;
          let newTop = startTop + dy;
          
          // Boundary checking
          newLeft = Math.max(0, Math.min(newLeft, imageContainer.offsetWidth - cropBox.offsetWidth));
          newTop = Math.max(0, Math.min(newTop, imageContainer.offsetHeight - cropBox.offsetHeight));
          
          cropBox.style.left = newLeft + "px";
          cropBox.style.top = newTop + "px";
        } else if (isResizing) {
          let newWidth = startWidth + dx;
          let newHeight = startHeight + dy;
          
          // Minimum size
          newWidth = Math.max(10, newWidth);
          newHeight = Math.max(10, newHeight);
          
          // Boundary checking
          const maxWidth = imageContainer.offsetWidth - cropBox.offsetLeft;
          const maxHeight = imageContainer.offsetHeight - cropBox.offsetTop;
          newWidth = Math.min(newWidth, maxWidth);
          newHeight = Math.min(newHeight, maxHeight);
          
          cropBox.style.width = newWidth + "px";
          cropBox.style.height = newHeight + "px";
        }
      }
      
      function stopDrag() {
        isDragging = false;
        isResizing = false;
      }
      
      window.extractTextFromImage = async function () {
        const image = document.getElementById('image');
        const imgRect = image.getBoundingClientRect();
        const cropRect = cropBox.getBoundingClientRect();
        
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / imgRect.width;
        const scaleY = image.naturalHeight / imgRect.height;
        
        const cropLeft = (cropRect.left - imgRect.left) * scaleX;
        const cropTop = (cropRect.top - imgRect.top) * scaleY;
        const cropWidth = cropRect.width * scaleX;
        const cropHeight = cropRect.height * scaleY;
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        
        const croppedDataUrl = canvas.toDataURL('image/jpeg');
        
        const result = await Tesseract.recognize(croppedDataUrl, 'eng', {
          logger: m => console.log(m)
        });
        
        window.ReactNativeWebView.postMessage(result.data.text);
      }
  </script>
</body>
</html>
`;

      setHtmlContent(html);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load image", err);
    }
  };

  const onMessage = (event) => {
    setExtractedText(event.nativeEvent.data);
  };

  const extractText = () => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `window.extractTextFromImage(); true;`
      );
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <>
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ html: htmlContent }}
            onMessage={onMessage}
            javaScriptEnabled={true}
            style={styles.webview}
            mixedContentMode="compatibility"
          />
          <TouchableOpacity onPress={extractText} style={styles.button}>
            <Text style={styles.buttonText}>Extract Text</Text>
          </TouchableOpacity>
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Extracted Text:</Text>
            <Text>{extractedText}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  webview: { height: 300, borderWidth: 1, borderColor: "#ccc" },
  button: {
    backgroundColor: "#4285F4",
    padding: 12,
    marginVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  resultBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  resultTitle: { fontWeight: "bold", marginBottom: 5 },
});

export default PDFReader;
