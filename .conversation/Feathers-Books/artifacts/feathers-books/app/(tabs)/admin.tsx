import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '@/components/BookCover';
import { useBooks } from '@/context/BooksContext';
import { useColors } from '@/hooks/useColors';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { books, togglePublished, deleteBook } = useBooks();
  const { isLoaded, isSignedIn, isOwner, email } = useAdminAccess();
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  if (!isLoaded || !isOwner) {
    return <PublisherAccessPanel isSignedIn={isSignedIn} email={email} colors={colors} router={router} />;
  }

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <FlatList
      data={books}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: topInset + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<><View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>PUBLISHER STUDIO</Text><Text style={[styles.title, { color: colors.foreground }]}>Your catalog</Text></View><Pressable onPress={() => router.push('/admin/new')} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}><Feather name="plus" size={18} color={colors.primaryForeground} /><Text style={[styles.addText, { color: colors.primaryForeground }]}>Add book</Text></Pressable></View><View style={styles.stats}><Stat value={`${books.length}`} label="Total books" colors={colors} /><Stat value={`${books.filter((book) => book.published).length}`} label="Published" colors={colors} /><Stat value="1.2k" label="Reads this month" colors={colors} /></View><View style={styles.catalogHeader}><Text style={[styles.catalogTitle, { color: colors.foreground }]}>Manage books</Text><Text style={[styles.catalogHint, { color: colors.mutedForeground }]}>Live catalog</Text></View></>}
      renderItem={({ item }) => <View style={[styles.bookRow, { borderBottomColor: colors.border }]}><BookCover book={item} style={styles.cover} containerStyle={styles.coverFrame} /><View style={styles.bookInfo}><Text numberOfLines={1} style={[styles.bookTitle, { color: colors.foreground }]}>{item.title}</Text><Text numberOfLines={1} style={[styles.author, { color: colors.mutedForeground }]}>{item.author} · {item.price === 0 ? 'Free' : `$${item.price.toFixed(2)}`}</Text><View style={styles.rowStatus}><View style={[styles.statusDot, { backgroundColor: item.published ? '#78a36b' : colors.mutedForeground }]} /><Text style={[styles.status, { color: item.published ? '#5e8553' : colors.mutedForeground }]}>{item.published ? 'Published' : 'Unpublished'}</Text></View></View><View style={styles.rowActions}><Pressable accessibilityLabel={`Edit ${item.title}`} onPress={() => router.push({ pathname: '/admin/edit/[id]', params: { id: item.id } })} style={[styles.iconButton, { borderColor: colors.border }]}><Feather name="edit-2" size={15} color={colors.foreground} /></Pressable><Pressable accessibilityLabel={`${item.published ? 'Unpublish' : 'Publish'} ${item.title}`} onPress={() => togglePublished(item.id)} style={[styles.iconButton, { borderColor: colors.border }]}><Feather name={item.published ? 'eye-off' : 'eye'} size={15} color={colors.primary} /></Pressable><Pressable accessibilityLabel={`Delete ${item.title}`} onPress={() => Alert.alert('Delete book?', 'This will remove it from your catalog and shelf.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteBook(item.id) }])} style={[styles.iconButton, { borderColor: colors.border }]}><Feather name="trash-2" size={15} color={colors.destructive} /></Pressable></View></View>}
    />
  </View>;
}

function PublisherAccessPanel({
  isSignedIn,
  email,
  colors,
  router,
}: {
  isSignedIn: boolean;
  email?: string;
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
}) {
  return <PublisherAccessContent isSignedIn={isSignedIn} email={email} colors={colors} router={router} />;
}

function PublisherAccessContent({
  isSignedIn,
  email,
  colors,
  router,
}: {
  isSignedIn: boolean;
  email?: string;
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={[styles.screen, styles.accessScreen, { backgroundColor: colors.background }]}>
      <Feather name={isSignedIn ? 'lock' : 'user'} size={28} color={colors.primary} />
      <Text style={[styles.accessEyebrow, { color: colors.primary }]}>PUBLISHER STUDIO</Text>
      <Text style={[styles.accessTitle, { color: colors.foreground }]}>
        {isSignedIn ? 'Publisher access is limited.' : 'Sign in to publish.'}
      </Text>
      <Text style={[styles.accessText, { color: colors.mutedForeground }]}>
        {isSignedIn
          ? `${email ?? 'This account'} can browse Feathers Books, but only the owner account can manage the catalog.`
          : 'The Feathers Books catalog is open to everyone. Sign in with the owner account to add or manage books.'}
      </Text>
      <Pressable
        onPress={() => router.push('/admin/sign-in' as never)}
        style={[styles.accessButton, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.accessButtonText, { color: colors.primaryForeground }]}>Sign in</Text>
      </Pressable>
    </View>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: ReturnType<typeof useColors> }) { return <View style={[styles.stat, { backgroundColor: colors.secondary }]}><Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 },
  accessScreen: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  accessEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.7, marginTop: 18, marginBottom: 8 },
  accessTitle: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.7, textAlign: 'center' },
  accessText: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, maxWidth: 330 },
  accessButton: { borderRadius: 13, paddingHorizontal: 24, paddingVertical: 13, marginTop: 24 },
  accessButtonText: { fontSize: 13, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.7, marginBottom: 6 },
  title: { fontSize: 31, fontWeight: '700', letterSpacing: -1 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11 },
  addText: { fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  stat: { flex: 1, borderRadius: 15, padding: 12 },
  statValue: { fontSize: 21, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 5, lineHeight: 13 },
  catalogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  catalogTitle: { fontSize: 19, fontWeight: '700' },
  catalogHint: { fontSize: 11 },
  bookRow: { paddingVertical: 13, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  coverFrame: { width: 52, height: 72, borderRadius: 8 },
  cover: { borderRadius: 8 },
  bookInfo: { flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  author: { fontSize: 11 },
  rowStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  statusDot: { width: 6, height: 6, borderRadius: 4 },
  status: { fontSize: 10, fontWeight: '600' },
  rowActions: { flexDirection: 'row', gap: 5 },
  iconButton: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});