import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '@/components/BookCover';
import { Book, useBooks } from '@/context/BooksContext';
import { useColors } from '@/hooks/useColors';

const categories = ['All', 'Literary fiction', 'Essays', 'Travel', 'Poetry'];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { publishedBooks } = useBooks();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const visibleBooks = useMemo(() => publishedBooks.filter((book) => {
    const matchesCategory = category === 'All' || book.category === category;
    const search = query.trim().toLowerCase();
    return matchesCategory && (!search || `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(search));
  }), [publishedBooks, category, query]);
  const featured = publishedBooks.find((book) => book.featured) ?? publishedBooks[0];
  const newReleases = [...publishedBooks].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topInset + 14, paddingBottom: insets.bottom + 106 }}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Feather name="feather" size={19} color={colors.accent} /></View>
            <View><Text style={[styles.brand, { color: colors.foreground }]}>FEATHERS</Text><Text style={[styles.brandSub, { color: colors.primary }]}>BOOKS</Text></View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Administrator sign in"
              onPress={() => router.push('/admin/sign-in' as never)}
              style={({ pressed }) => [
                styles.adminButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Feather name="lock" size={14} color={colors.primary} />
              <Text style={[styles.adminButtonText, { color: colors.primary }]}>Admin</Text>
            </Pressable>
            <Pressable accessibilityLabel="Notifications" style={[styles.headerIcon, { borderColor: colors.border }]}>
              <Feather name="bell" size={19} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
        <View style={styles.welcome}><Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning, reader.</Text><Text style={[styles.headline, { color: colors.foreground }]}>Find your next <Text style={{ color: colors.primary }}>beautiful</Text> story.</Text></View>
        <View style={[styles.searchBox, { backgroundColor: colors.secondary }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search books, authors..." placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" />
          {query ? <Pressable onPress={() => setQuery('')}><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryPill, { backgroundColor: category === item ? colors.primary : colors.secondary }]}><Text style={[styles.categoryText, { color: category === item ? colors.primaryForeground : colors.mutedForeground }]}>{item}</Text></Pressable>)}
        </ScrollView>
        {!query && category === 'All' && featured ? (
          <Pressable onPress={() => router.push({ pathname: '/book/[id]', params: { id: featured.id } })} style={({ pressed }) => [styles.featuredCard, { backgroundColor: colors.primary, opacity: pressed ? 0.94 : 1 }]}>
            <View style={styles.featuredCopy}><Text style={[styles.featuredEyebrow, { color: colors.accent }]}>EDITOR'S PICK</Text><Text style={[styles.featuredTitle, { color: colors.primaryForeground }]}>{featured.title}</Text><Text style={[styles.featuredAuthor, { color: '#d8c7ac' }]}>by {featured.author}</Text><Text numberOfLines={2} style={[styles.featuredDesc, { color: '#ede4d7' }]}>{featured.description}</Text><View style={styles.discoverLink}><Text style={[styles.discoverText, { color: colors.accent }]}>Discover book</Text><Feather name="arrow-up-right" size={16} color={colors.accent} /></View></View>
            <BookCover book={featured} style={styles.featuredImage} containerStyle={styles.featuredImageFrame} />
          </Pressable>
        ) : null}
        {!query && category === 'All' ? <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>New releases</Text><Pressable onPress={() => setCategory('All')}><Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text></Pressable></View> : null}
        {!query && category === 'All' ? <FlatList horizontal data={newReleases} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.releaseItem, { opacity: pressed ? 0.78 : 1 }]}><BookCover book={item} style={styles.releaseCover} containerStyle={styles.releaseCoverFrame} /><Text numberOfLines={1} style={[styles.releaseTitle, { color: colors.foreground }]}>{item.title}</Text><Text numberOfLines={1} style={[styles.releaseAuthor, { color: colors.mutedForeground }]}>{item.author}</Text></Pressable>} /> : null}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{query || category !== 'All' ? 'Search results' : 'Popular right now'}</Text>{!query && category === 'All' ? <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>This week</Text> : null}</View>
        {visibleBooks.length ? visibleBooks.map((item) => <PopularRow key={item.id} book={item} colors={colors} onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.id } })} />) : <View style={styles.noResults}><Feather name="search" size={24} color={colors.mutedForeground} /><Text style={[styles.noResultsTitle, { color: colors.foreground }]}>No books found</Text><Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>Try another title, author, or category.</Text></View>}
      </ScrollView>
    </View>
  );
}

function PopularRow({ book, colors, onPress }: { book: Book; colors: ReturnType<typeof useColors>; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.popularRow, { borderBottomColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
    <BookCover book={book} style={styles.popularCover} containerStyle={styles.popularCoverFrame} />
    <View style={styles.popularCopy}><Text numberOfLines={1} style={[styles.popularTitle, { color: colors.foreground }]}>{book.title}</Text><Text numberOfLines={1} style={[styles.popularAuthor, { color: colors.mutedForeground }]}>{book.author} · {book.category}</Text><View style={styles.rating}><Feather name="star" size={12} color={colors.accent} /><Text style={[styles.ratingText, { color: colors.mutedForeground }]}>{book.rating ? book.rating.toFixed(1) : 'New'}</Text></View></View><Text style={[styles.price, { color: colors.primary }]}>{book.price === 0 ? 'Free' : `$${book.price.toFixed(2)}`}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adminButton: { minHeight: 40, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  adminButtonText: { fontSize: 11, fontWeight: '700' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 12, fontWeight: '800', letterSpacing: 2.2, lineHeight: 13 },
  brandSub: { fontSize: 9, fontWeight: '800', letterSpacing: 3.3, lineHeight: 11 },
  headerIcon: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  signInButton: { minHeight: 40, borderRadius: 14, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  signInText: { fontSize: 12, fontWeight: '700' },
  welcome: { paddingHorizontal: 20, marginTop: 28, marginBottom: 18 },
  greeting: { fontSize: 14, marginBottom: 6 },
  headline: { fontSize: 29, lineHeight: 34, fontWeight: '700', letterSpacing: -1 },
  searchBox: { marginHorizontal: 20, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  categories: { gap: 8, paddingHorizontal: 20, paddingVertical: 18 },
  categoryPill: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  featuredCard: { marginHorizontal: 20, minHeight: 230, borderRadius: 24, padding: 20, overflow: 'hidden', flexDirection: 'row' },
  featuredCopy: { flex: 1, paddingRight: 12, justifyContent: 'center' },
  featuredEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 12 },
  featuredTitle: { fontSize: 28, fontWeight: '700', lineHeight: 31, letterSpacing: -0.9 },
  featuredAuthor: { fontSize: 13, marginTop: 7 },
  featuredDesc: { fontSize: 12, lineHeight: 18, marginTop: 13 },
  discoverLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 },
  discoverText: { fontSize: 12, fontWeight: '700' },
  featuredImageFrame: { width: 102, height: 157, borderRadius: 14, transform: [{ rotate: '6deg' }], alignSelf: 'center', marginRight: 4 },
  featuredImage: { borderRadius: 14 },
  sectionHeader: { paddingHorizontal: 20, marginTop: 28, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  seeAll: { fontSize: 12, fontWeight: '600' },
  horizontalList: { paddingHorizontal: 20, gap: 14 },
  releaseItem: { width: 112 },
  releaseCoverFrame: { width: 112, height: 158, borderRadius: 13, marginBottom: 10 },
  releaseCover: { borderRadius: 13 },
  releaseTitle: { fontSize: 13, fontWeight: '700' },
  releaseAuthor: { fontSize: 11, marginTop: 4 },
  popularRow: { marginHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  popularCoverFrame: { width: 57, height: 76, borderRadius: 9 },
  popularCover: { borderRadius: 9 },
  popularCopy: { flex: 1 },
  popularTitle: { fontSize: 15, fontWeight: '700', marginBottom: 5 },
  popularAuthor: { fontSize: 11 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 9 },
  ratingText: { fontSize: 11 },
  price: { fontSize: 13, fontWeight: '700' },
  noResults: { alignItems: 'center', paddingVertical: 38 },
  noResultsTitle: { fontSize: 17, fontWeight: '700', marginTop: 13 },
  noResultsText: { fontSize: 13, marginTop: 6 },
});
