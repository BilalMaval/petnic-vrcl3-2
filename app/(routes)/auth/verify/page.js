"use client";
import { Suspense } from 'react';
import VerifyEmailContent from './VerifyEmailContent';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4A4A68]">Verifying your email...</p>
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
