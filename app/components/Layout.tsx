import Navbar from '@/app/components/Navbar';
import Head from 'next/head'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Questrial&display=swap');
        </style>
      </Head>
      <Navbar />
      {children}
    </div>
  );
}