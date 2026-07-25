import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { OnboardingGuard } from './components/OnboardingGuard'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'プログラミング言語学習管理アプリ',
  description: 'プログラミング言語の学習進捗を管理・記録できるWebアプリです。',
}

export default function RootLayout({
  children,
} : {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={cn("font-sans", geist.variable)}>
      <body>
        <Header />
        <main>
          <OnboardingGuard>{children}</OnboardingGuard>
        </main>
        <Footer />
      </body>
    </html>
  )
}