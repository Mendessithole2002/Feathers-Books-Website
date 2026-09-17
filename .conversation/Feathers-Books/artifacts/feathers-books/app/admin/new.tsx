import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoverKey, useBooks } from '@/context/BooksContext';
import { useColors } from '@/hooks/useColors';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { storePdfFile } from '@/utils/pdfStorage';

export default function NewBookScreen() {
  return <BookForm />;
}

export function BookForm({ editId }: { editId?: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { books, addBook, updateBook } = useBooks();
  const { isLoaded, isOwner } = useAdminAccess();
  const existing = books.find((book) => book.id === editId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [author, setAuthor] = useState(existing?.author ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'Literary fiction');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [pages, setPages] = useState(existing ? String(existing.pages) : '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [coverUri, setCoverUri] = useState(existing?.coverUri);
  const [pdfUri, setPdfUri] = useState(existing?.pdfUri);
  const [pdfName, setPdfName] = useState(existing?.pdfName);
  const [published, setPublished] = useState(existing?.published ?? true);
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  if (!isLoaded || !isOwner) {
    return null;
  }

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to choose a book cover from your device.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.85 });
    if (!result.canceled) setCoverUri(result.assets[0].uri);
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      const storedUri = Platform.OS === 'web' && file.file ? await storePdfFile(file.file) : file.uri;
      setPdfUri(storedUri);
      setPdfName(file.name);
    }
  };

  const save = () => {
    if (!title.trim() || !author.trim() || !description.trim() || (!content.trim() && !pdfUri)) {
      Alert.alert('A few details are missing', 'Add a title, author, description, and manuscript text or PDF before publishing.');
      return;
    }
    const payload = { title: title.trim(), author: author.trim(), category, description: description.trim(), pages: Number(pages) || 1, price: Number(price) || 0, cover: (existing?.cover ?? 'default') as CoverKey, coverUri, pdfUri, pdfName, content: content.trim(), published };
    if (editId) updateBook(editId, payload);
    else addBook(payload);
    router.back();
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: topInset + 9, paddingBottom: insets.bottom + 36 }}>
      <View style={styles.nav}><Pressable onPress={() => router.back()} style={styles.navButton}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable><Text style={[styles.navTitle, { color: colors.foreground }]}>{editId ? 'Edit book' : 'New book'}</Text><Pressable onPress={save}><Text style={[styles.saveText, { color: colors.primary }]}>{editId ? 'Save' : 'Publish'}</Text></Pressable></View>
      <View style={styles.form}>
        <Text style={[styles.introEyebrow, { color: colors.primary }]}>{editId ? 'UPDATE EDITION' : 'NEW RELEASE'}</Text><Text style={[styles.introTitle, { color: colors.foreground }]}>{editId ? 'Keep your catalog fresh.' : 'Bring a new story to life.'}</Text><Text style={[styles.introText, { color: colors.mutedForeground }]}>Everything you need to share a book with your readers.</Text>
        <Text style={[styles.label, { color: colors.foreground }]}>Cover artwork</Text>
        <Pressable onPress={pickCover} style={[styles.coverPicker, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          {coverUri ? <Image source={{ uri: coverUri }} style={styles.uploadedCover} /> : <><View style={[styles.uploadIcon, { backgroundColor: colors.accent }]}><Feather name="image" size={20} color={colors.primary} /></View><Text style={[styles.uploadTitle, { color: colors.foreground }]}>Choose cover image</Text><Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>From your photo library</Text></>}
          {coverUri ? <View style={styles.coverChange}><Feather name="edit-2" size={14} color={colors.primaryForeground} /><Text style={[styles.coverChangeText, { color: colors.primaryForeground }]}>Change cover</Text></View> : null}
        </Pressable>
         <Text style={[styles.label, { color: colors.foreground }]}>PDF edition</Text>
         <Pressable testID="upload-pdf" onPress={pickPdf} style={[styles.pdfPicker, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
           <View style={[styles.uploadIcon, { backgroundColor: colors.accent }]}><Feather name="file-text" size={20} color={colors.primary} /></View>
           <View style={styles.pdfInfo}><Text numberOfLines={1} style={[styles.uploadTitle, { color: colors.foreground }]}>{pdfName ?? 'Upload book PDF'}</Text><Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>{pdfName ? 'Tap to replace this PDF' : 'Choose a PDF from your device'}</Text></View>
           <Feather name={pdfName ? 'check-circle' : 'upload'} size={18} color={colors.primary} />
         </Pressable>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. The Glass Orchard" colors={colors} />
        <Field label="Author" value={author} onChangeText={setAuthor} placeholder="Author name" colors={colors} />
        <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
        <View style={styles.choiceRow}>{['Literary fiction', 'Essays', 'Travel', 'Poetry'].map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.choice, { borderColor: category === item ? colors.primary : colors.border, backgroundColor: category === item ? colors.accent : colors.background }]}><Text style={[styles.choiceText, { color: category === item ? colors.primary : colors.mutedForeground }]}>{item}</Text></Pressable>)}</View>
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="What will readers discover?" colors={colors} multiline />
        <View style={styles.twoFields}><View style={{ flex: 1 }}><Field label="Pages" value={pages} onChangeText={setPages} placeholder="240" colors={colors} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Price (USD)" value={price} onChangeText={setPrice} placeholder="9.99" colors={colors} keyboardType="decimal-pad" /></View></View>
        <Text style={[styles.label, { color: colors.foreground }]}>Book manuscript</Text><TextInput value={content} onChangeText={setContent} placeholder="Paste the opening text or full manuscript here..." placeholderTextColor={colors.mutedForeground} multiline textAlignVertical="top" style={[styles.textInput, styles.manuscript, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]} />
        <Pressable onPress={() => setPublished((value) => !value)} style={styles.publishRow}><View style={[styles.checkbox, { backgroundColor: published ? colors.primary : colors.background, borderColor: published ? colors.primary : colors.border }]}>{published ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}</View><View><Text style={[styles.publishTitle, { color: colors.foreground }]}>Publish immediately</Text><Text style={[styles.publishHint, { color: colors.mutedForeground }]}>Make this book visible in Discover</Text></View></Pressable>
        <Pressable onPress={save} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 }]}><Feather name={editId ? 'check' : 'send'} size={17} color={colors.primaryForeground} /><Text style={[styles.submitText, { color: colors.primaryForeground }]}>{editId ? 'Save changes' : 'Publish book'}</Text></Pressable>
      </View>
    </ScrollView>
  </View>;
}

function Field({ label, value, onChangeText, placeholder, colors, multiline, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; multiline?: boolean; keyboardType?: 'number-pad' | 'decimal-pad' }) {
  return <View><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} keyboardType={keyboardType} textAlignVertical={multiline ? 'top' : 'center'} style={[styles.textInput, multiline && styles.multiline, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  nav: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15, fontWeight: '700' },
  saveText: { fontSize: 13, fontWeight: '700' },
  form: { paddingHorizontal: 20, paddingTop: 27 },
  introEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 9 },
  introTitle: { fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -0.8 },
  introText: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 27 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 18 },
  coverPicker: { minHeight: 126, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  uploadedCover: { width: '100%', height: 210, resizeMode: 'cover' },
  uploadIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  uploadTitle: { fontSize: 13, fontWeight: '700' },
  uploadHint: { fontSize: 11, marginTop: 4 },
  coverChange: { position: 'absolute', right: 10, bottom: 10, backgroundColor: '#15242a', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 },
  coverChangeText: { fontSize: 10, fontWeight: '700' },
  pdfPicker: { minHeight: 74, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  pdfInfo: { flex: 1, minWidth: 0 },
  textInput: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontSize: 14 },
  multiline: { minHeight: 93, paddingTop: 13 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  choiceText: { fontSize: 11, fontWeight: '600' },
  twoFields: { flexDirection: 'row', gap: 12 },
  manuscript: { minHeight: 165, paddingTop: 13, lineHeight: 21 },
  publishRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 26 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  publishTitle: { fontSize: 13, fontWeight: '700' },
  publishHint: { fontSize: 11, marginTop: 3 },
  submit: { minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 28 },
  submitText: { fontSize: 14, fontWeight: '700' },
});