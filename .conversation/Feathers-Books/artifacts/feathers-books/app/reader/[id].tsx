import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBooks } from '@/context/BooksContext';
import { PdfBookReader } from '@/components/PdfBookReader';
import { useColors } from '@/hooks/useColors';

export default function ReaderScreen() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { books, progress, bookmarks, updateProgress, toggleBookmark } = useBooks();
  const book = books.find((item) => item.id === id);
  const [fontSize, setFontSize] = useState(18);
  const [dark, setDark] = useState(false);
  if (!book) return <View style={styles.missing}><Text>Book not found.</Text></View>;
  const paper = dark ? '#1d252a' : '#f8f3ea';
  const ink = dark ? '#eee7dc' : '#27343a';
  const muted = dark ? '#a4aaa8' : '#73807c';
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const paragraphs = book.content.split('\n\n');
  const currentProgress = progress[book.id] ?? 0;
  const hasPdf = Boolean(book.pdfUri);

  return <View style={[styles.screen, { backgroundColor: paper }]}>
    <View style={[styles.toolbar, { paddingTop: topInset + 8, backgroundColor: paper }]}>
      <Pressable onPress={() => router.back()} style={styles.toolbarButton}><Feather name="x" size={21} color={ink} /></Pressable>
      <View style={styles.toolbarCenter}><Text numberOfLines={1} style={[styles.toolbarTitle, { color: ink }]}>{book.title}</Text><Text style={[styles.toolbarSub, { color: muted }]}>{preview ? 'Preview' : 'Reading now'}</Text></View>
      <View style={styles.toolbarActions}><Pressable onPress={() => setDark((value) => !value)} style={styles.toolbarButton}><Feather name={dark ? 'sun' : 'moon'} size={18} color={ink} /></Pressable><Pressable onPress={() => toggleBookmark(book.id)} style={styles.toolbarButton}><Feather name="bookmark" size={18} color={bookmarks[book.id] ? '#c79243' : ink} fill={bookmarks[book.id] ? '#c79243' : 'transparent'} /></Pressable></View>
    </View>
    <View style={[styles.progressBar, { backgroundColor: dark ? '#364248' : '#e5dccd' }]}><View style={[styles.progressFill, { width: `${currentProgress * 100}%`, backgroundColor: '#c79243' }]} /></View>
     {hasPdf ? (
       <PdfBookReader uri={book.pdfUri!} title={book.title} />
     ) : (
       <ScrollView
         showsVerticalScrollIndicator={false}
         onScroll={(event) => {
           const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
           const next = contentSize.height > layoutMeasurement.height ? contentOffset.y / (contentSize.height - layoutMeasurement.height) : 0;
           if (next > currentProgress + 0.01 || next < currentProgress - 0.08) updateProgress(book.id, next);
         }}
         scrollEventThrottle={250}
         contentContainerStyle={[styles.reader, { paddingBottom: insets.bottom + 60 }]}
       >
         <Text style={[styles.chapterLabel, { color: '#c79243' }]}>CHAPTER ONE</Text>
         <Text style={[styles.readerTitle, { color: ink }]}>{book.title}</Text>
         <Text style={[styles.readerByline, { color: muted }]}>{book.author}</Text>
         <View style={[styles.divider, { backgroundColor: dark ? '#3d484d' : '#ddd3c4' }]} />
         {paragraphs.map((paragraph, index) => <Text key={`${paragraph.slice(0, 12)}-${index}`} style={[styles.paragraph, { color: ink, fontSize, lineHeight: fontSize * 1.7 }]}>{paragraph}</Text>)}
         {preview ? <View style={[styles.endCard, { borderColor: dark ? '#3d484d' : '#ddd3c4' }]}><Feather name="lock" size={18} color="#c79243" /><Text style={[styles.endTitle, { color: ink }]}>Enjoying the story?</Text><Text style={[styles.endText, { color: muted }]}>Buy the full edition to keep reading and save it to your shelf.</Text><Pressable onPress={() => router.replace({ pathname: '/book/[id]', params: { id: book.id } })} style={styles.endButton}><Text style={styles.endButtonText}>View book</Text></Pressable></View> : null}
       </ScrollView>
     )}
    <View style={[styles.readerControls, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: paper, borderTopColor: dark ? '#3d484d' : '#ddd3c4' }]}>
       <Text style={[styles.controlLabel, { color: muted }]}>{hasPdf ? 'PDF EDITION' : 'TEXT SIZE'}</Text>{hasPdf ? <View style={styles.pdfControl}><Feather name="file-text" size={14} color={muted} /><Text style={[styles.sizeValue, { color: muted }]}>Book view</Text></View> : <View style={styles.sizeControls}><Pressable onPress={() => setFontSize((value) => Math.max(15, value - 1))} style={[styles.sizeButton, { borderColor: dark ? '#3d484d' : '#ddd3c4' }]}><Text style={[styles.smallA, { color: ink }]}>A</Text></Pressable><Text style={[styles.sizeValue, { color: muted }]}>{fontSize}</Text><Pressable onPress={() => setFontSize((value) => Math.min(24, value + 1))} style={[styles.sizeButton, { borderColor: dark ? '#3d484d' : '#ddd3c4' }]}><Text style={[styles.bigA, { color: ink }]}>A</Text></Pressable></View>}<Text style={[styles.percent, { color: muted }]}>{Math.round(currentProgress * 100)}%</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toolbar: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  toolbarButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  toolbarCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  toolbarTitle: { fontSize: 13, fontWeight: '700' },
  toolbarSub: { fontSize: 10, marginTop: 3 },
  toolbarActions: { flexDirection: 'row' },
  progressBar: { height: 3 },
  progressFill: { height: 3 },
  reader: { paddingHorizontal: 28, paddingTop: 38 },
  chapterLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  readerTitle: { fontSize: 32, lineHeight: 37, fontWeight: '700', letterSpacing: -1 },
  readerByline: { fontSize: 14, marginTop: 8 },
  divider: { height: 1, marginVertical: 29 },
  paragraph: { fontFamily: 'Inter_400Regular', marginBottom: 22 },
  endCard: { borderWidth: 1, borderRadius: 18, padding: 19, alignItems: 'center', marginTop: 12 },
  endTitle: { fontSize: 17, fontWeight: '700', marginTop: 10 },
  endText: { textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 6 },
  endButton: { backgroundColor: '#c79243', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 15 },
  endButtonText: { color: '#15242a', fontSize: 13, fontWeight: '700' },
  readerControls: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' },
  controlLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  sizeControls: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 8 },
  sizeButton: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  smallA: { fontSize: 12 },
  bigA: { fontSize: 17 },
  sizeValue: { fontSize: 11, width: 18, textAlign: 'center' },
  pdfControl: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  percent: { fontSize: 11, marginLeft: 16, width: 31, textAlign: 'right' },
  missing: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});