import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '@/components/BookCover';
import { Book, useBooks } from '@/context/BooksContext';
import { useColors } from '@/hooks/useColors';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { books, ownedIds, progress } = useBooks();
  const ownedBooks = books.filter((book) => ownedIds.includes(book.id));
  const continueBook = ownedBooks.find((book) => (progress[book.id] ?? 0) > 0 && (progress[book.id] ?? 0) < 1);
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={ownedBooks}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR SHELF</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Library</Text>
              </View>
              <View style={[styles.countBubble, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.count, { color: colors.primary }]}>{ownedBooks.length}</Text>
                <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>books</Text>
              </View>
            </View>
            {continueBook ? (
              <Pressable
                onPress={() => router.push({ pathname: '/reader/[id]', params: { id: continueBook.id } })}
                style={({ pressed }) => [styles.continueCard, { backgroundColor: colors.primary, opacity: pressed ? 0.92 : 1 }]}
              >
                <View style={styles.continueCopy}>
                  <View style={styles.continueTag}><Feather name="book-open" color={colors.primary} size={13} /><Text style={[styles.continueTagText, { color: colors.primary }]}>CONTINUE READING</Text></View>
                  <Text style={[styles.continueTitle, { color: colors.primaryForeground }]}>{continueBook.title}</Text>
                  <Text style={[styles.continueAuthor, { color: '#d8c7ac' }]}>by {continueBook.author}</Text>
                  <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(progress[continueBook.id] ?? 0) * 100}%`, backgroundColor: colors.accent }]} /></View>
                  <Text style={[styles.progressText, { color: '#d8c7ac' }]}>{Math.round((progress[continueBook.id] ?? 0) * 100)}% complete</Text>
                </View>
                <BookCover book={continueBook} style={styles.continueCover} containerStyle={styles.continueCoverFrame} />
              </Pressable>
            ) : null}
            <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>All books</Text><Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Tap to read</Text></View>
          </>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.bookItem, { opacity: pressed ? 0.78 : 1 }]}>
            <BookCover book={item} style={styles.gridCover} containerStyle={styles.gridCoverFrame} />
            <Text numberOfLines={1} style={[styles.bookTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text numberOfLines={1} style={[styles.bookAuthor, { color: colors.mutedForeground }]}>{item.author}</Text>
            <View style={styles.miniProgressTrack}><View style={[styles.miniProgressFill, { width: `${(progress[item.id] ?? 0) * 100}%`, backgroundColor: colors.primary }]} /></View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bookmark" size={28} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your shelf is waiting</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Buy a book from Discover and it will live here.</Text>
            <Pressable onPress={() => router.push('/(tabs)')} style={[styles.emptyButton, { backgroundColor: colors.primary }]}><Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>Explore books</Text></Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.7, marginBottom: 6 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  countBubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, alignItems: 'center', flexDirection: 'row', gap: 5 },
  count: { fontSize: 18, fontWeight: '700' },
  countLabel: { fontSize: 12, fontWeight: '600' },
  continueCard: { minHeight: 192, borderRadius: 24, padding: 18, flexDirection: 'row', overflow: 'hidden', marginBottom: 28 },
  continueCopy: { flex: 1, paddingRight: 10, justifyContent: 'center' },
  continueTag: { backgroundColor: '#f1e4cf', borderRadius: 9, alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, marginBottom: 13 },
  continueTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  continueTitle: { fontSize: 23, lineHeight: 27, fontWeight: '700', letterSpacing: -0.5 },
  continueAuthor: { fontSize: 13, marginTop: 5 },
  progressTrack: { height: 4, backgroundColor: '#5f6870', borderRadius: 4, marginTop: 20, width: '93%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 11, marginTop: 7 },
  continueCoverFrame: { width: 100, height: 150, borderRadius: 12, transform: [{ rotate: '5deg' }], marginRight: 5 },
  continueCover: { borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionHint: { fontSize: 12 },
  gridRow: { justifyContent: 'space-between', marginBottom: 24 },
  bookItem: { width: '47%', paddingBottom: 4 },
  gridCoverFrame: { width: '100%', aspectRatio: 0.72, borderRadius: 14, marginBottom: 10 },
  gridCover: { borderRadius: 14 },
  bookTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  bookAuthor: { fontSize: 12 },
  miniProgressTrack: { backgroundColor: '#e6ded2', height: 3, borderRadius: 3, marginTop: 9, overflow: 'hidden' },
  miniProgressFill: { height: 3, borderRadius: 3 },
  empty: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 21, marginTop: 8 },
  emptyButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 20 },
  emptyButtonText: { fontWeight: '700', fontSize: 14 },
});