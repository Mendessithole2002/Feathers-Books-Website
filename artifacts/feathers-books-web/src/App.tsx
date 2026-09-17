import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Bookmark, Check, ChevronLeft, ChevronRight, Compass, Feather, FileText, Image as ImageIcon, Library, Lock, LogOut, Menu, Moon, Plus, Search, Send, Settings, Shield, Star, Sun, Trash2, Upload, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import lighthouseCover from './assets/book-the-last-lighthouse.png';
import gardenCover from './assets/book-quiet-garden.png';
import northStarCover from './assets/book-north-star.png';

type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  content: string;
  pages: number;
  releaseDate: string;
  price: number;
  rating: number;
  featured?: boolean;
  published: boolean;
  cover: string;
  coverUri?: string;
  pdfUri?: string;
};

type StoredState = { books: Book[]; ownedIds: string[]; bookmarks: Record<string, boolean>; progress: Record<string, number>; admin: boolean };
const STORAGE_KEY = 'feathers-books-web-state';
const categories = ['All', 'Literary fiction', 'Essays', 'Travel', 'Poetry'];
const coverMap: Record<string, string> = { lighthouse: lighthouseCover, garden: gardenCover, 'north-star': northStarCover };
const starterBooks: Book[] = [
  { id: 'last-lighthouse', title: 'The Last Lighthouse', author: 'Mara Vale', category: 'Literary fiction', description: 'On a coast where the fog never lifts, a young cartographer arrives to map a lighthouse that has disappeared from every chart. What she finds there changes the shape of home.', pages: 288, price: 12.99, cover: 'lighthouse', content: 'The fog arrived before the boat did.\n\nBy the time Iris stepped onto the jetty, the harbor had become a room with no walls. Ropes creaked in the white distance. Somewhere beyond the veil, a bell counted the seconds between one world and the next.\n\nShe held the map case against her coat and walked toward the light. It flashed once, then vanished. A lighthouse, she thought. Or a memory of one.\n\nThe village had sent three letters. All three asked the same question: could she chart a place that no longer appeared on any map?\n\nAt the end of the road, a blue door stood open in the fog. Iris paused with her hand on the frame. Behind it, the house smelled of salt, old paper, and the first rain of autumn.\n\nA voice from the dark said, “You’re late.”', releaseDate: '2026-08-22', rating: 4.8, featured: true, published: true },
  { id: 'quiet-garden', title: 'A Quiet Garden', author: 'Nia Okafor', category: 'Essays', description: 'A tender collection of essays about growing, grieving, and making a life with both hands in the soil.', pages: 176, price: 9.99, cover: 'garden', content: 'A garden does not ask to be understood all at once.\n\nIt begins with a handful of ordinary things: a seed, a stone, a patch of light that lasts until lunch. The work is small enough to overlook, and that is its first lesson.\n\nWhen my mother moved into the blue house, she planted basil along the kitchen window. She said she wanted the room to remember summer. Years later, the scent still arrives before I do.\n\nWe inherit more than names. We inherit ways of tending, ways of waiting, ways of leaving a place more generous than we found it.', releaseDate: '2026-08-14', rating: 4.6, published: true },
  { id: 'north-star', title: 'North Star, Open Road', author: 'Elias Reed', category: 'Travel', description: 'A beautifully observed journey through the small towns, roadside diners, and unexpected friendships that make a country feel close.', pages: 240, price: 11.5, cover: 'north-star', content: 'The first rule of the open road is that it never stays open for long.\n\nThere will be construction, a deer crossing, a town that appears only on the old map. There will be coffee poured into a paper cup by someone who has never heard of your destination.\n\nI kept driving north because the compass said so, and because the road seemed to know something I did not.', releaseDate: '2026-08-02', rating: 4.5, published: true },
];

function readState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { books: starterBooks, ownedIds: ['last-lighthouse'], bookmarks: {}, progress: { 'last-lighthouse': .32 }, admin: false };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return { books: Array.isArray(parsed.books) ? parsed.books : starterBooks, ownedIds: Array.isArray(parsed.ownedIds) ? parsed.ownedIds : ['last-lighthouse'], bookmarks: parsed.bookmarks ?? {}, progress: parsed.progress ?? { 'last-lighthouse': .32 }, admin: Boolean(parsed.admin) };
  } catch {
    return { books: starterBooks, ownedIds: ['last-lighthouse'], bookmarks: {}, progress: { 'last-lighthouse': .32 }, admin: false };
  }
}

type LibraryContextValue = {
  books: Book[];
  publishedBooks: Book[];
  ownedIds: string[];
  bookmarks: Record<string, boolean>;
  progress: Record<string, number>;
  admin: boolean;
  saveState: (next: Partial<StoredState>) => void;
  toggleOwned: (id: string) => void;
  toggleBookmark: (id: string) => void;
  setProgress: (id: string, value: number) => void;
  addBook: (book: Omit<Book, 'id' | 'releaseDate' | 'rating'>) => void;
  deleteBook: (id: string) => void;
  togglePublished: (id: string) => void;
};

import { createContext, useContext } from 'react';
const LibraryContext = createContext<LibraryContextValue | null>(null);
function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => readState());
  const save = (next: StoredState) => { setState(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* persistence is best effort */ } };
  const saveState = (next: Partial<StoredState>) => save({ ...state, ...next });
  const value: LibraryContextValue = {
    ...state,
    publishedBooks: state.books.filter((book) => book.published),
    saveState,
    toggleOwned: (id) => saveState({ ownedIds: state.ownedIds.includes(id) ? state.ownedIds.filter((item) => item !== id) : [...state.ownedIds, id] }),
    toggleBookmark: (id) => saveState({ bookmarks: { ...state.bookmarks, [id]: !state.bookmarks[id] } }),
    setProgress: (id, value) => saveState({ progress: { ...state.progress, [id]: Math.max(0, Math.min(1, value)) } }),
    addBook: (book) => saveState({ books: [{ ...book, id: `book-${Date.now()}`, releaseDate: new Date().toISOString().slice(0, 10), rating: 0 }, ...state.books] }),
    deleteBook: (id) => saveState({ books: state.books.filter((book) => book.id !== id), ownedIds: state.ownedIds.filter((item) => item !== id) }),
    togglePublished: (id) => saveState({ books: state.books.map((book) => book.id === id ? { ...book, published: !book.published } : book) }),
  };
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}

function Cover({ book, className = '' }: { book: Book; className?: string }) {
  return <div className={`book-cover ${className}`}><img className="cover" src={book.coverUri || coverMap[book.cover] || lighthouseCover} alt={`Cover of ${book.title}`} /></div>;
}
function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-3 no-underline" data-testid="link-brand"><span className="brand-mark"><Feather size={19} strokeWidth={1.8} /></span>{!compact && <span><strong className="brand-word block">FEATHERS</strong><strong className="brand-word brand-sub block">BOOKS</strong></span>}</Link>;
}
function Sidebar() {
  const [location] = useLocation();
  const { admin } = useLibrary();
  return <aside className="desktop-sidebar">
    <Brand />
    <nav className="mt-14 grid gap-2" aria-label="Primary navigation">
      <Link href="/" className={`side-link ${location === '/' ? 'active' : ''}`} data-testid="link-discover"><Compass size={17} />Discover</Link>
      <Link href="/library" className={`side-link ${location === '/library' ? 'active' : ''}`} data-testid="link-library"><Library size={17} />My library</Link>
    </nav>
    <div className="mt-auto">
      <div className="mb-3 px-3 text-[10px] uppercase tracking-[.15em] opacity-40">Publisher</div>
      <Link href={admin ? '/admin' : '/admin/sign-in'} className={`side-link ${location.startsWith('/admin') ? 'active' : ''}`} data-testid="link-admin"><Shield size={17} />Publisher studio</Link>
      {admin && <button className="side-link w-full border-0 bg-transparent text-left" onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }} data-testid="button-sign-out"><LogOut size={17} />Sign out</button>}
      <p className="mt-8 px-3 text-[11px] leading-5 opacity-40">Independent stories,<br />kept close.</p>
    </div>
  </aside>;
}
function MobileNav() {
  const [location] = useLocation();
  return <nav className="mobile-nav" aria-label="Mobile navigation">
    <Link href="/" className={location === '/' ? 'active' : ''} data-testid="mobile-discover"><Compass size={19} /><span>Discover</span></Link>
    <Link href="/library" className={location === '/library' ? 'active' : ''} data-testid="mobile-library"><Library size={19} /><span>Library</span></Link>
     <Link href="/admin" className={location.startsWith('/admin') ? 'active' : ''} data-testid="mobile-admin"><Shield size={19} /><span>Studio</span></Link>
  </nav>;
}
function Shell({ children }: { children: ReactNode }) {
  return <div className="app-shell"><Sidebar /><main className="main-with-sidebar"><MobileNav />{children}</main></div>;
}
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 2600); return () => window.clearTimeout(timer); }, [onDone]);
  return <div className="toast" role="status" data-testid="status-toast">{message}</div>;
}
function BookTile({ book }: { book: Book }) {
  return <Link href={`/book/${book.id}`} className="book-tile" data-testid={`card-book-${book.id}`}><Cover book={book} className="tile-cover" /><span className="book-title">{book.title}</span><span className="book-author">{book.author}</span></Link>;
}
function Rating({ book }: { book: Book }) {
  return <span className="inline-flex items-center gap-1 text-xs muted"><Star size={13} fill="hsl(var(--accent))" color="hsl(var(--accent))" />{book.rating ? book.rating.toFixed(1) : 'New'}</span>;
}

function Discover() {
  const { publishedBooks } = useLibrary();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const featured = publishedBooks.find((book) => book.featured) ?? publishedBooks[0];
  const visible = useMemo(() => publishedBooks.filter((book) => (category === 'All' || book.category === category) && (`${book.title} ${book.author} ${book.category}`).toLowerCase().includes(query.trim().toLowerCase())), [publishedBooks, category, query]);
  const releases = [...publishedBooks].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  return <Shell><div className="content-frame">
    <header className="mb-9 flex items-end justify-between gap-4">
      <div><div className="eyebrow mb-3">A small press for the curious</div><h1 className="serif m-0 text-5xl leading-[.95] tracking-tight sm:text-6xl">Find your next<br /><em className="text-[hsl(var(--accent))]">beautiful</em> story.</h1></div>
      <Link href="/library" className="button button-outline hidden sm:inline-flex" data-testid="link-library-header"><Bookmark size={16} />Your shelf</Link>
    </header>
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
      <label className="search-field" aria-label="Search books and authors"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books, authors, or places..." data-testid="input-search-books" />{query && <button className="icon-button h-7 w-7 border-0" onClick={() => setQuery('')} aria-label="Clear search" data-testid="button-clear-search"><X size={15} /></button>}</label>
      <div className="pill-row">{categories.map((item) => <button key={item} className={`pill ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)} data-testid={`filter-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div>
    </div>
    {!query && category === 'All' && featured && <section className="feature-card mt-7" aria-label="Editor's pick">
      <div className="feature-copy"><div className="eyebrow mb-4 !text-[hsl(var(--accent))]">Editor's pick · August 2026</div><h2 className="serif m-0 text-5xl leading-[.92] sm:text-6xl">{featured.title}</h2><p className="mt-3 text-sm opacity-70">by {featured.author}</p><p className="mt-5 max-w-[440px] text-sm leading-6 opacity-75">{featured.description}</p><Link href={`/book/${featured.id}`} className="button mt-6 bg-[hsl(var(--accent))] text-[hsl(var(--primary))]" data-testid="link-featured-book">Discover book <ChevronRight size={16} /></Link></div><Cover book={featured} className="feature-cover" />
    </section>}
    {!query && category === 'All' && <><div className="section-head"><h2>New releases</h2><span className="muted text-xs">Fresh from the press</span></div><div className="book-row">{releases.slice(0, 3).map((book) => <BookTile key={book.id} book={book} />)}</div></>}
    <div className="section-head"><h2>{query || category !== 'All' ? 'Search results' : 'Popular right now'}</h2><span className="muted text-xs">{visible.length} {visible.length === 1 ? 'title' : 'titles'}</span></div>
    {visible.length ? <div className="book-row-wide">{visible.map((book) => <Link href={`/book/${book.id}`} className="book-list-row" key={book.id} data-testid={`row-book-${book.id}`}><Cover book={book} className="list-cover" /><span className="list-copy"><strong className="book-title">{book.title}</strong><span className="book-author">{book.author} · {book.category}</span><span className="mt-2 block"><Rating book={book} /></span></span><span className="price">{book.price === 0 ? 'Free' : `$${book.price.toFixed(2)}`} <ChevronRight className="ml-2 inline" size={15} /></span></Link>)}</div> : <div className="empty-state"><Search className="mx-auto text-[hsl(var(--accent))]" /><h3 className="mt-4 text-lg font-bold">No stories found</h3><p className="muted mt-2 text-sm">Try another title, author, or category.</p></div>}
  </div></Shell>;
}

function LibraryPage() {
  const { books, ownedIds, progress } = useLibrary();
  const owned = books.filter((book) => ownedIds.includes(book.id));
  const current = owned.find((book) => (progress[book.id] ?? 0) > 0 && (progress[book.id] ?? 0) < 1);
  return <Shell><div className="content-frame"><div className="mb-10 flex items-end justify-between"><div><div className="eyebrow mb-3">Your shelf</div><h1 className="serif m-0 text-6xl leading-none">Library</h1></div><div className="rounded-xl bg-[hsl(var(--secondary))] px-4 py-2 text-center"><strong className="block text-lg">{owned.length}</strong><span className="muted text-xs">books</span></div></div>
    {current && <Link href={`/reader/${current.id}`} className="feature-card mb-12 min-h-[230px] no-underline" data-testid="card-continue-reading"><div className="feature-copy"><div className="eyebrow mb-4 !text-[hsl(var(--accent))]">Continue reading · {Math.round((progress[current.id] ?? 0) * 100)}%</div><h2 className="serif m-0 text-4xl">{current.title}</h2><p className="mt-2 text-sm opacity-70">by {current.author}</p><div className="mt-7 h-1 max-w-[340px] rounded bg-white/20"><span className="block h-full rounded bg-[hsl(var(--accent))]" style={{ width: `${(progress[current.id] ?? 0) * 100}%` }} /></div></div><Cover book={current} className="feature-cover" /></Link>}
    <div className="section-head mt-0"><h2>All books</h2><span className="muted text-xs">Select a cover to read</span></div>
    {owned.length ? <div className="book-grid">{owned.map((book) => <Link href={`/book/${book.id}`} className="book-tile" key={book.id} data-testid={`card-library-${book.id}`}><Cover book={book} className="tile-cover" /><span className="book-title">{book.title}</span><span className="book-author">{book.author}</span><div className="mt-3 h-1 rounded bg-[hsl(var(--muted))]"><span className="block h-full rounded bg-[hsl(var(--accent))]" style={{ width: `${(progress[book.id] ?? 0) * 100}%` }} /></div></Link>)}</div> : <div className="empty-state"><Bookmark className="mx-auto text-[hsl(var(--accent))]" size={28} /><h2 className="serif mt-5 text-3xl">Your shelf is waiting</h2><p className="muted mx-auto mt-2 max-w-sm text-sm leading-6">Find a book that stays with you. Anything you add from Discover will live here.</p><Link href="/" className="button button-primary mt-6" data-testid="link-explore-books">Explore books</Link></div>}
  </div></Shell>;
}

function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { books, ownedIds, bookmarks, toggleOwned, toggleBookmark } = useLibrary();
  const [toast, setToast] = useState('');
  const book = books.find((item) => item.id === id);
  if (!book) return <Shell><NotFoundBook /></Shell>;
  const owned = ownedIds.includes(book.id);
  const addOrRead = () => { if (owned) navigate(`/reader/${book.id}`); else { toggleOwned(book.id); setToast('Added to your shelf'); } };
  return <Shell><div className="content-frame"><div className="mb-6 flex justify-between"><button className="button button-outline" onClick={() => navigate('/')} data-testid="button-back-discover"><ChevronLeft size={16} />Back to discover</button><button className="icon-button" aria-label={bookmarks[book.id] ? 'Remove bookmark' : 'Bookmark book'} onClick={() => { toggleBookmark(book.id); setToast(bookmarks[book.id] ? 'Bookmark removed' : 'Book bookmarked'); }} data-testid="button-bookmark"><Bookmark size={18} fill={bookmarks[book.id] ? 'hsl(var(--accent))' : 'none'} color={bookmarks[book.id] ? 'hsl(var(--accent))' : 'currentColor'} /></button></div>
    <article className="detail-hero"><Cover book={book} className="detail-cover" /><div className="detail-body"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-[hsl(var(--accent))] px-3 py-1 text-xs font-bold text-[hsl(var(--primary))]">{book.category}</span><Rating book={book} /></div><h1>{book.title}</h1><div className="detail-author">by {book.author}</div><div className="fact-strip"><span><FileText className="mr-1 inline" size={14} />{book.pages} pages</span><span><Compass className="mr-1 inline" size={14} />{new Date(book.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span><span><BookOpen className="mr-1 inline" size={14} />Digital edition</span></div><p className="detail-description">{book.description}</p><div className="detail-actions"><button className="button button-primary" onClick={addOrRead} data-testid="button-book-action"><BookOpen size={16} />{owned ? 'Read now' : book.price === 0 ? 'Add to shelf' : `Add to shelf · $${book.price.toFixed(2)}`}</button><Link href={`/reader/${book.id}?preview=1`} className="button button-outline" data-testid="link-free-preview">Read free preview</Link></div></div></article>
    <div className="mx-auto mt-12 max-w-3xl"><h2 className="serif text-3xl">A note before you begin</h2><p className="muted mt-3 max-w-2xl leading-7">Feathers Books is a home for independent work with a point of view. Read at your own pace, return whenever you like, and keep the passages that matter close.</p></div>
  </div>{toast && <Toast message={toast} onDone={() => setToast('')} />}</Shell>;
}
function NotFoundBook() {
  return <div className="empty-state mx-auto mt-20 max-w-md"><BookOpen className="mx-auto text-[hsl(var(--accent))]" size={28} /><h1 className="serif mt-4 text-4xl">That book wandered off</h1><p className="muted mt-2 text-sm">This title is no longer in the catalog, or the link was mistyped.</p><Link className="button button-primary mt-6" href="/" data-testid="link-return-discover">Return to Discover</Link></div>;
}

function Reader() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { books, progress, bookmarks, toggleBookmark, setProgress } = useLibrary();
  const book = books.find((item) => item.id === id);
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState(19);
  const contentRef = useRef<HTMLDivElement>(null);
  const isPreview = location.includes('preview=1');
  useEffect(() => { const onScroll = () => { const el = contentRef.current; if (!el) return; const max = document.documentElement.scrollHeight - window.innerHeight; if (max > 0) setProgress(id ?? '', window.scrollY / max); }; window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, [id, setProgress]);
  if (!book) return <div className="reader-page items-center justify-center"><NotFoundBook /></div>;
  const currentProgress = progress[book.id] ?? 0;
  const paragraphs = book.content.split('\n\n');
  return <div className={`reader-page ${dark ? 'dark' : ''}`} style={{ backgroundColor: dark ? '#1d252a' : '#f8f3ea', color: dark ? '#eee7dc' : '#27343a' }}>
    <header className="reader-toolbar"><button className="icon-button border-0" onClick={() => navigate(`/book/${book.id}`)} aria-label="Close reader" data-testid="button-close-reader"><X size={19} /></button><div className="reader-title"><strong>{book.title}</strong><span>{isPreview ? 'Free preview' : 'Reading now'}</span></div><div className="flex gap-1"><button className="icon-button border-0" onClick={() => setDark((value) => !value)} aria-label={dark ? 'Use light paper' : 'Use dark paper'} data-testid="button-toggle-paper">{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button border-0" onClick={() => toggleBookmark(book.id)} aria-label="Bookmark passage" data-testid="button-reader-bookmark"><Bookmark size={18} fill={bookmarks[book.id] ? 'hsl(var(--accent))' : 'none'} color={bookmarks[book.id] ? 'hsl(var(--accent))' : 'currentColor'} /></button></div></header>
    <div className="reader-progress"><span style={{ width: `${currentProgress * 100}%` }} /></div>
    <main ref={contentRef} className="reader-content"><div className="reader-kicker">Chapter one</div><h1>{book.title}</h1><div className="reader-byline">{book.author}</div><hr className="reader-rule" />{paragraphs.map((paragraph, index) => <p key={index} className="paragraph" style={{ fontSize: `${fontSize}px` }}>{paragraph}</p>)}{isPreview && <div className="end-card"><Lock className="mx-auto text-[hsl(var(--accent))]" size={21} /><h2 className="serif mt-3 text-2xl">Enjoying the story?</h2><p className="muted mx-auto mt-2 max-w-sm text-sm leading-6">Add the full edition to your shelf to keep reading and return to this story whenever you like.</p><Link href={`/book/${book.id}`} className="button button-primary mt-5" data-testid="link-preview-end">View book</Link></div>}</main>
    <footer className="reader-controls" style={{ backgroundColor: dark ? '#1d252add' : '#f8f3eadd' }}><small>TEXT SIZE</small><div className="control-group"><button className="icon-button h-8 w-8" onClick={() => setFontSize((value) => Math.max(15, value - 1))} aria-label="Decrease text size" data-testid="button-text-smaller">A</button><span className="w-7 text-center text-xs opacity-65">{fontSize}</span><button className="icon-button h-8 w-8 text-lg" onClick={() => setFontSize((value) => Math.min(27, value + 1))} aria-label="Increase text size" data-testid="button-text-larger">A</button></div><span className="ml-4 text-xs opacity-65">{Math.round(currentProgress * 100)}%</span></footer>
  </div>;
}

function AdminSignIn() {
  const [, navigate] = useLocation();
  const { admin, saveState } = useLibrary();
  const [email, setEmail] = useState('1feathersofficial@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (admin) navigate('/admin'); }, [admin, navigate]);
  if (admin) return null;
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (password !== 'feathers') { setError('That password does not match the publisher key.'); return; } saveState({ admin: true }); navigate('/admin/new'); };
  return <div className="admin-page"><div className="content-frame"><div className="admin-topbar"><button className="back-link" onClick={() => navigate('/')} aria-label="Back to reader browsing" data-testid="button-admin-back"><ChevronLeft size={20} /></button><span>Publisher studio</span><span className="w-12" /></div><div className="admin-signin-wrap"><div className="eyebrow">Publisher studio</div><h1>Admin sign-in</h1><p>Reader browsing is public. Sign in with the owner email and password to manage the Feathers Books catalog.</p><form onSubmit={submit} className="admin-signin-form"><div className="field"><label htmlFor="publisher-email">Owner email</label><input id="publisher-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" data-testid="input-admin-email" /></div><div className="field"><label htmlFor="publisher-password">Publisher password</label><input id="publisher-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} placeholder="Enter your admin password" autoComplete="current-password" data-testid="input-admin-password" /></div>{error && <p className="admin-error" role="alert" data-testid="status-admin-error">{error}</p>}<button className="button button-primary mt-7 w-full" disabled={!email || !password} data-testid="button-admin-submit">Open Publisher Studio</button></form></div></div></div>;
}

function AdminDashboard() {
  const { admin, books, deleteBook, togglePublished } = useLibrary();
  const [, navigate] = useLocation();
  useEffect(() => { if (!admin) navigate('/admin/sign-in'); }, [admin, navigate]);
  if (!admin) return null;
  const published = books.filter((book) => book.published).length;
  return <Shell><div className="admin-page"><div className="content-frame">
    <div className="studio-heading"><div className="eyebrow">Publisher studio</div><div className="flex items-end justify-between gap-4"><div><h1>Your catalog</h1></div><Link href="/admin/new" className="button button-primary min-h-10 px-4 text-xs" data-testid="link-add-book"><Plus size={15} />Add book</Link></div></div>
    <div className="stats-grid" aria-label="Catalog summary"><div className="stat-card"><span className="stat-value">{books.length}</span><span className="stat-label">Total books</span></div><div className="stat-card"><span className="stat-value">{published}</span><span className="stat-label">Published</span></div><div className="stat-card"><span className="stat-value">1.2k</span><span className="stat-label">Reads this month</span></div></div>
    <div className="catalog-head"><h2>Manage books</h2><span>Live catalog</span></div>
    <div className="catalog-list">{books.map((book) => <div className="catalog-row" key={book.id}><Cover book={book} /><div className="catalog-copy"><strong>{book.title}</strong><span>{book.author} · ${book.price.toFixed(2)}</span><span className="catalog-status" style={{ color: book.published ? '#8ac58e' : 'hsl(var(--muted-foreground))' }}>{book.published ? 'Published' : 'Draft'}</span></div><div className="catalog-actions"><button className="icon-button" aria-label={`Edit ${book.title}`} onClick={() => navigate(`/admin/new?edit=${book.id}`)} data-testid={`button-edit-book-${book.id}`}><Settings size={15} /></button><button className="icon-button" aria-label={`${book.published ? 'Unpublish' : 'Publish'} ${book.title}`} onClick={() => togglePublished(book.id)} data-testid={`button-publish-toggle-${book.id}`}><Shield size={15} /></button><button className="icon-button danger" aria-label={`Delete ${book.title}`} onClick={() => { if (window.confirm(`Remove ${book.title} from the catalog?`)) deleteBook(book.id); }} data-testid={`button-delete-book-${book.id}`}><Trash2 size={15} /></button></div></div>)}</div>
    <button className="mt-8 inline-flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.href = '/'; }} data-testid="button-studio-signout"><LogOut size={14} />Sign out</button>
  </div></div></Shell>;
}

function AdminNew() {
  const { admin, addBook } = useLibrary();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Literary fiction');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [pages, setPages] = useState('');
  const [price, setPrice] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [pdfUri, setPdfUri] = useState('');
  const [published, setPublished] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  useEffect(() => { if (!admin) navigate('/admin/sign-in'); }, [admin, navigate]);
  const save = (event: React.FormEvent) => { event.preventDefault(); if (!title.trim() || !author.trim() || !description.trim() || !content.trim() || !pages) { setError('Add a title, author, description, page count, and manuscript before publishing.'); return; } addBook({ title: title.trim(), author: author.trim(), category, description: description.trim(), content: content.trim(), pages: Number(pages), price: Number(price) || 0, cover: 'lighthouse', coverUri, pdfUri, published }); setToast('Book added to the catalog'); setTitle(''); setAuthor(''); setDescription(''); setContent(''); setPages(''); setPrice(''); setCoverUri(''); setPdfUri(''); };
  const chooseCover = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setCoverUri(String(reader.result)); reader.readAsDataURL(file); };
  const choosePdf = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setPdfUri(String(reader.result)); reader.readAsDataURL(file); };
  if (!admin) return null;
  return <Shell><div className="admin-page"><div className="content-frame">
    <div className="admin-topbar"><Link href="/admin" className="back-link" aria-label="Back to catalog"><ChevronLeft size={20} /></Link><h1>New book</h1><button type="submit" form="new-book-form" data-testid="button-publish-header">Publish</button></div>
    <div className="studio-heading"><div className="eyebrow">New release</div><h1>Bring a new story to life.</h1><p>Everything you need to share a book with your readers.</p></div>
    <form id="new-book-form" className="admin-card" onSubmit={save}>
      {error && <div className="admin-error" role="alert" data-testid="status-book-error">{error}</div>}
      <div className="field"><label htmlFor="book-cover">Cover artwork</label><label className="upload-panel">{coverUri ? <img src={coverUri} alt="Selected cover preview" className="h-16 w-12 rounded object-cover" /> : <span className="upload-icon"><ImageIcon size={18} /></span>}<strong>{coverUri ? 'Cover selected · choose another' : 'Choose cover image'}</strong><span>From your photo library</span><input id="book-cover" type="file" accept="image/*" className="sr-only" onChange={chooseCover} data-testid="input-book-cover" /></label></div>
      <div className="field"><label htmlFor="book-pdf">PDF edition</label><label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 text-xs hover:border-[hsl(var(--accent))]"><span className="upload-icon !m-0 !h-10 !w-10"><FileText size={17} /></span><span className="flex-1">{pdfUri ? 'PDF selected · choose another' : 'Upload book PDF'}<small className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">Choose a PDF from your device</small></span><Upload size={17} className="text-[hsl(var(--accent))]" /><input id="book-pdf" type="file" accept="application/pdf" className="sr-only" onChange={choosePdf} data-testid="input-book-pdf" /></label></div>
      <div className="field"><label htmlFor="book-title">Title</label><input id="book-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. The Glass Orchard" data-testid="input-book-title" /></div>
      <div className="field"><label htmlFor="book-author">Author</label><input id="book-author" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author name" data-testid="input-book-author" /></div>
      <div className="field"><label>Category</label><div className="form-category-row">{categories.slice(1).map((item) => <button key={item} type="button" className={`form-category ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)} data-testid={`category-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div></div>
      <div className="field"><label htmlFor="book-description">Description</label><textarea id="book-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What will readers discover?" data-testid="input-book-description" /></div>
      <div className="grid gap-3 sm:grid-cols-2"><div className="field"><label htmlFor="book-pages">Pages</label><input id="book-pages" type="number" min="1" value={pages} onChange={(event) => setPages(event.target.value)} placeholder="240" data-testid="input-book-pages" /></div><div className="field"><label htmlFor="book-price">Price (USD)</label><input id="book-price" type="number" min="0" step=".01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="9.99" data-testid="input-book-price" /></div></div>
      <div className="field"><label htmlFor="book-content">Book manuscript</label><textarea id="book-content" className="!min-h-48" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste the opening text or full manuscript here..." data-testid="input-book-content" /></div>
      <label className="publish-toggle mt-5 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} data-testid="input-book-published" /><span><strong className="block">Publish immediately</strong><small className="muted">Make this book visible in Discover</small></span></label>
      <button className="button button-primary mt-7 w-full" data-testid="button-publish-book"><Send size={16} />Publish book</button>
    </form>{toast && <Toast message={toast} onDone={() => setToast('')} />}
  </div></div></Shell>;
}
function AdminCatalog() {
  const { books, deleteBook, togglePublished } = useLibrary();
  return <section className="mt-14"><div className="section-head"><h2>Catalog</h2><span className="muted text-xs">{books.length} editions</span></div><div className="admin-card !max-w-none p-0"><div className="divide-y divide-[hsl(var(--border))]">{books.map((book) => <div className="flex items-center gap-4 p-4" key={book.id}><Cover book={book} className="h-14 w-11 shrink-0 rounded" /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{book.title}</strong><span className="muted text-xs">{book.author} · {book.category}</span></div><button className={`rounded-full px-3 py-1 text-xs font-bold ${book.published ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--secondary))] muted'}`} onClick={() => togglePublished(book.id)} data-testid={`button-publish-toggle-${book.id}`}>{book.published ? 'Published' : 'Draft'}</button><button className="icon-button h-8 w-8 border-0 text-[hsl(var(--destructive))]" onClick={() => { if (window.confirm(`Remove ${book.title} from the catalog?`)) deleteBook(book.id); }} aria-label={`Delete ${book.title}`} data-testid={`button-delete-book-${book.id}`}><Trash2 size={15} /></button></div>)}</div></div></section>;
}

function NotFound() {
  return <Shell><div className="content-frame"><div className="empty-state mx-auto mt-12 max-w-lg"><Compass className="mx-auto text-[hsl(var(--accent))]" size={30} /><div className="eyebrow mt-5">404 · page not found</div><h1 className="serif mt-3 text-5xl">The page is between chapters.</h1><p className="muted mt-3 text-sm">The address you followed does not lead to a published story.</p><Link href="/" className="button button-primary mt-6" data-testid="link-404-home">Back to Discover</Link></div></div></Shell>;
}

function Router() {
  return <Switch><Route path="/" component={Discover} /><Route path="/library" component={LibraryPage} /><Route path="/book/:id" component={BookDetail} /><Route path="/reader/:id" component={Reader} /><Route path="/admin/sign-in" component={AdminSignIn} /><Route path="/admin" component={AdminDashboard} /><Route path="/admin/new" component={AdminNew} /><Route component={NotFound} /></Switch>;
}
const queryClient = new QueryClient();
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><LibraryProvider><Router /></LibraryProvider></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;