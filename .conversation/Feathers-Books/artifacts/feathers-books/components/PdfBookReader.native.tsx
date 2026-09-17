import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export function PdfBookReader({ uri }: { uri: string; title: string }) {
  return (
    <View style={styles.stage}>
      <View style={styles.page}>
        <WebView
          source={{ uri }}
          originWhitelist={['*']}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          javaScriptEnabled
          style={styles.webView}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  page: { flex: 1, overflow: 'hidden', borderRadius: 12, backgroundColor: '#ffffff', shadowColor: '#101820', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  webView: { flex: 1, backgroundColor: '#ffffff' },
});