import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ImageSourcePropType } from 'react-native';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export type CoverKey = 'lighthouse' | 'garden' | 'north-star' | 'default';

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  pages: number;
  price: number;
  cover: CoverKey;
  coverUri?: string;
  pdfUri?: string;
  pdfName?: string;
  content: string;
  published: boolean;
  featured?: boolean;
  rating: number;
  releaseDate: string;
};

type StoredState = {
  books: Book[];
  ownedIds: string[];
  progress: Record<string, number>;
  bookmarks: Record<string, boolean>;
};

const STORAGE_KEY = '@feathers-books/state';

export const COVER_IMAGES: Record<CoverKey, ImageSourcePropType> = {
  lighthouse: require('../assets/images/book-the-last-lighthouse.png'),
  garden: require('../assets/images/book-quiet-garden.png'),
  'north-star': require('../assets/images/book-north-star.png'),
  default: require('../assets/images/book-the-last-lighthouse.png'),
};

export function getCoverSource(book: Book): ImageSourcePropType {
  return book.coverUri ? { uri: book.coverUri } : COVER_IMAGES[book.cover];
}

const starterBooks: Book[] = [
  {
    id: 'last-lighthouse',
    title: 'The Last Lighthouse',
    author: 'Mara Vale',
    category: 'Literary fiction',
    description:
      'On a coast where the fog never lifts, a young cartographer arrives to map a lighthouse that has disappeared from every chart. What she finds there changes the shape of home.',
    pages: 288,
    price: 12.99,
    cover: 'lighthouse',
    content:
      'The fog arrived before the boat did.\n\nBy the time Iris stepped onto the jetty, the harbor had become a room with no walls. Ropes creaked in the white distance. Somewhere beyond the veil, a bell counted the seconds between one world and the next.\n\nShe held the map case against her coat and walked toward the light. It flashed once, then vanished. A lighthouse, she thought. Or a memory of one.\n\nThe village had sent three letters. All three asked the same question: could she chart a place that no longer appeared on any map?\n\nAt the end of the road, a blue door stood open in the fog. Iris paused with her hand on the frame. Behind it, the house smelled of salt, old paper, and the first rain of autumn.\n\nA voice from the dark said, “You’re late.”',
    published: true,
    featured: true,
    rating: 4.8,
    releaseDate: '2026-08-22',
  },
  {
    id: 'quiet-garden',
    title: 'A Quiet Garden',
    author: 'Nia Okafor',
    category: 'Essays',
    description:
      'A tender collection of essays about growing, grieving, and making a life with both hands in the soil.',
    pages: 176,
    price: 9.99,
    cover: 'garden',
    content:
      'A garden does not ask to be understood all at once.\n\nIt begins with a handful of ordinary things: a seed, a stone, a patch of light that lasts until lunch. The work is small enough to overlook, and that is its first lesson.\n\nWhen my mother moved into the blue house, she planted basil along the kitchen window. She said she wanted the room to remember summer. Years later, the scent still arrives before I do.\n\nWe inherit more than names. We inherit ways of tending, ways of waiting, ways of leaving a place more generous than we found it.',
    published: true,
    rating: 4.6,
    releaseDate: '2026-08-14',
  },
  {
    id: 'north-star',
    title: 'North Star, Open Road',
    author: 'Elias Reed',
    category: 'Travel',
    description:
      'A beautifully observed journey through the small towns, roadside diners, and unexpected friendships that make a country feel close.',
    pages: 240,
    price: 11.5,
    cover: 'north-star',
    content:
      'The first rule of the open road is that it never stays open for long.\n\nThere will be construction, a deer crossing, a town that appears only on the old map. There will be coffee poured into a paper cup by someone who has never heard of your destination.\n\nI kept driving north because the compass said so, and because the road seemed to know something I did not.',
    published: true,
    rating: 4.5,
    releaseDate: '2026-08-02',
  },
];

type BooksContextValue = {
  books: Book[];
  ownedIds: string[];
  progress: Record<string, number>;
  bookmarks: Record<string, boolean>;
  isReady: boolean;
  publishedBooks: Book[];
  buyBook: (id: string) => void;
  addBook: (book: Omit<Book, 'id' | 'releaseDate' | 'rating'>) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  togglePublished: (id: string) => void;
  updateProgress: (id: string, value: number) => void;
  toggleBookmark: (id: string) => void;
  canManageBooks: boolean;
};

const BooksContext = createContext<BooksContextValue | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const { isOwner } = useAdminAccess();
  const [books, setBooks] = useState<Book[]>(starterBooks);
  const [ownedIds, setOwnedIds] = useState<string[]>(['last-lighthouse']);
  const [progress, setProgress] = useState<Record<string, number>>({ 'last-lighthouse': 0.32 });
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) {
          const parsed = JSON.parse(value) as StoredState;
          setBooks(parsed.books ?? starterBooks);
          setOwnedIds(parsed.ownedIds ?? ['last-lighthouse']);
          setProgress(parsed.progress ?? {});
          setBookmarks(parsed.bookmarks ?? {});
        }
      })
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, []);

  const persist = (next: StoredState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const buyBook = (id: string) => {
    setOwnedIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      persist({ books, ownedIds: next, progress, bookmarks });
      return next;
    });
  };

  const addBook = (book: Omit<Book, 'id' | 'releaseDate' | 'rating'>) => {
    if (!isOwner) return;
    const nextBook: Book = {
      ...book,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      releaseDate: new Date().toISOString().slice(0, 10),
      rating: 0,
    };
    setBooks((current) => {
      const next = [nextBook, ...current];
      persist({ books: next, ownedIds, progress, bookmarks });
      return next;
    });
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    if (!isOwner) return;
    setBooks((current) => {
      const next = current.map((book) => (book.id === id ? { ...book, ...updates } : book));
      persist({ books: next, ownedIds, progress, bookmarks });
      return next;
    });
  };

  const deleteBook = (id: string) => {
    if (!isOwner) return;
    setBooks((current) => {
      const next = current.filter((book) => book.id !== id);
      persist({ books: next, ownedIds, progress, bookmarks });
      return next;
    });
    setOwnedIds((current) => current.filter((bookId) => bookId !== id));
  };

  const togglePublished = (id: string) => {
    if (!isOwner) return;
    const book = books.find((item) => item.id === id);
    if (book) updateBook(id, { published: !book.published });
  };

  const updateProgress = (id: string, value: number) => {
    setProgress((current) => {
      const next = { ...current, [id]: Math.max(0, Math.min(1, value)) };
      persist({ books, ownedIds, progress: next, bookmarks });
      return next;
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((current) => {
      const next = { ...current, [id]: !current[id] };
      persist({ books, ownedIds, progress, bookmarks: next });
      return next;
    });
  };

  const value = useMemo(
    () => ({
      books,
      ownedIds,
      progress,
      bookmarks,
      isReady,
      publishedBooks: books.filter((book) => book.published),
      buyBook,
      addBook,
      updateBook,
      deleteBook,
      togglePublished,
      updateProgress,
      toggleBookmark,
      canManageBooks: isOwner,
    }),
    [books, ownedIds, progress, bookmarks, isReady, isOwner],
  );

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (!context) throw new Error('useBooks must be used inside BooksProvider');
  return context;
}