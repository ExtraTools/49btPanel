import { redirect } from 'next/navigation';

export default async function Home() {
  // Временно убираем аутентификацию - сразу перенаправляем на dashboard
  redirect('/dashboard');
} 