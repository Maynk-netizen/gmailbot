import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import EmailNotifier from './components/EmailNotifier';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gmail Bot',
  description: 'AI-powered Gmail assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==" crossOrigin="anonymous" referrerPolicy="no-referrer" />      
      </head>
      <body className={inter.className}>
        {/* Add this div to contain the embedded chatbot */}
        <div id="embedded-chatbot"></div>
        
        <EmailNotifier />
        {children}
        
      </body>
    </html>
  );
}
