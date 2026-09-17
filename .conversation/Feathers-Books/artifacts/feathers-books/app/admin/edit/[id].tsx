import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { BookForm } from '@/app/admin/new';

export default function EditBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookForm editId={id} />;
}