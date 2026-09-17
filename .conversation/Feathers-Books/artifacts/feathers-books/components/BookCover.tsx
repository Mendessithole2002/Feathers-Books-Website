import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Book, getCoverSource } from '@/context/BooksContext';

export function BookCover({
  book,
  style,
  containerStyle,
}: {
  book: Book;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Image source={getCoverSource(book)} style={[styles.image, style]} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#e8dcc8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});