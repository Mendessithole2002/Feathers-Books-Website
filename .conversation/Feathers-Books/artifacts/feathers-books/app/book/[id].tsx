import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/context/BooksContext';
import { useColors } from '@/hooks/useColors';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { books, ownedIds, bookmarks, buyBook, toggleBookmark } = useBooks();
  const book = books.find((item) => item.id === id);
  const owned = !!book && ownedIds.includes(book.id);
  if (!book) return <View style={styles.missing}><Text style={{ color: colors.foreground }}>Book not found.</Text></View>;
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handleBuy = () => {
    buyBook(book.id);
    Alert.alert('Added to your shelf', `${book.title} is ready to read in your Library.`);
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
      <View style={[styles.hero, { paddingTop: topInset + 10, backgroundColor: colors.secondary }]}>
        <View style={styles.nav}><Pressable onPress={() => router.back()} style={styles.navButton}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable><Pressable onPress={() => toggleBookmark(book.id)} style={styles.navButton}><Feather name={bookmarks[book.id] ? 'bookmark' : 'bookmark'} size={20} color={bookmarks[book.id] ? colors.primary : colors.foreground} fill={bookmarks[book.id] ? colors.primary : 'transparent'} /></Pressable></View>
        <BookCover book={book} style={styles.cover} containerStyle={styles.coverFrame} />
      </View>
      <View style={styles.body}>
        <View style={styles.metaRow}><View style={[styles.category, { backgroundColor: colors.accent }]}><Text style={[styles.categoryText, { color: colors.primary }]}>{book.category}</Text></View><View style={styles.rating}><Feather name="star" size={14} color={colors.accent} /><Text style={[styles.ratingText, { color: colors.mutedForeground }]}>{book.rating || 'New'} rating</Text></View></View>
        <Text style={[styles.title, { color: colors.foreground }]}>{book.title}</Text>
        <Text style={[styles.author, { color: colors.primary }]}>by {book.author}</Text>
        <View style={styles.facts}><Fact icon="file-text" value={`${book.pages} pages`} colors={colors} /><Fact icon="calendar" value={new Date(book.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} colors={colors} /><Fact icon="book-open" value="Digital" colors={colors} /></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this book</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{book.description}</Text>
        <View style={[styles.previewNote, { borderColor: colors.border }]}><Feather name="align-left" size={17} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.previewTitle, { color: colors.foreground }]}>Read a free preview</Text><Text style={[styles.previewText, { color: colors.mutedForeground }]}>Start with the opening pages before you decide.</Text></View><Pressable onPress={() => router.push({ pathname: '/reader/[id]', params: { id: book.id, preview: '1' } })}><Feather name="chevron-right" size={19} color={colors.primary} /></Pressable></View>
      </View>
    </ScrollView>
    <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View><Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{owned ? 'In your library' : 'Digital edition'}</Text><Text style={[styles.actionPrice, { color: colors.foreground }]}>{owned ? 'Ready to read' : book.price === 0 ? 'Free' : `$${book.price.toFixed(2)}`}</Text></View>
      <Pressable onPress={() => owned ? router.push({ pathname: '/reader/[id]', params: { id: book.id } }) : handleBuy()} style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 }]}><Feather name={owned ? 'book-open' : 'shopping-bag'} size={17} color={colors.primaryForeground} /><Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{owned ? 'Read now' : book.price === 0 ? 'Add to shelf' : 'Buy book'}</Text></Pressable>
    </View>
  </View>;
}

function Fact({ icon, value, colors }: { icon: keyof typeof Feather.glyphMap; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.fact}><Feather name={icon} size={15} color={colors.mutedForeground} /><Text style={[styles.factText, { color: colors.mutedForeground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { minHeight: 340, alignItems: 'center' },
  nav: { width: '100%', paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  navButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  coverFrame: { width: 172, height: 243, borderRadius: 17, shadowColor: '#101820', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  cover: { borderRadius: 17 },
  body: { padding: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontSize: 12 },
  title: { fontSize: 32, lineHeight: 36, fontWeight: '700', letterSpacing: -1.1, marginTop: 19 },
  author: { fontSize: 15, marginTop: 7 },
  facts: { flexDirection: 'row', gap: 18, marginTop: 24, marginBottom: 30 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factText: { fontSize: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 23 },
  previewNote: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 25, flexDirection: 'row', alignItems: 'center', gap: 11 },
  previewTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  previewText: { fontSize: 11, lineHeight: 16 },
  actionBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 11 },
  actionPrice: { fontSize: 16, fontWeight: '700', marginTop: 3 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, paddingHorizontal: 18, paddingVertical: 14 },
  actionButtonText: { fontSize: 14, fontWeight: '700' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});